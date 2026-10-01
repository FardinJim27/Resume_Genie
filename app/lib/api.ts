import { create } from "zustand";

// In browser, the frontend and API routes are served together by the Express server on port 3000.
// Using relative paths ("") guarantees requests hit the right host without mixed content or wrong port errors.
const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return "";
  }
  return import.meta.env.VITE_API_URL || "";
};

const API_URL = getApiBaseUrl();

/**
 * Resilient JSON parser for HTTP responses.
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * by safely reading response text first and checking for valid JSON.
 */
async function safeParseResponse<T = any>(
  response: Response,
  defaultErrorMessage = "Request failed",
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  try {
    const text = await response.text();
    let parsed: any = null;

    if (text && text.trim().length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      const errorMsg =
        (parsed && (parsed.error || parsed.message)) ||
        (text && text.length < 200 && !text.includes("<!DOCTYPE")
          ? text
          : `${defaultErrorMessage} (Status ${response.status})`);
      return { ok: false, data: parsed, error: errorMsg };
    }

    return { ok: true, data: parsed as T };
  } catch (err) {
    const msg = err instanceof Error ? err.message : defaultErrorMessage;
    return { ok: false, data: null, error: msg };
  }
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface Resume {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumePath: string;
  imagePath: string;
  feedback: Feedback | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerGrowthAdvice {
  candidateProfile: {
    currentEstimatedLevel: string;
    primarySpecialization: string;
    experienceSummary: string;
    marketDemandRating: "Very High" | "High" | "Moderate";
    targetFitScore: number;
    salaryBenchmarkRange: {
      currency: string;
      medianAnnual: string;
      topTierAnnual: string;
      growthProjection: string;
    };
  };
  growthRoadmap: {
    timeline: string;
    milestoneTitle: string;
    focusAreas: string[];
    actionItems: {
      action: string;
      rationale: string;
      priority: "critical" | "high" | "medium";
    }[];
  }[];
  industryStandardSkills: {
    category: string;
    skills: {
      name: string;
      status: "detected" | "recommended" | "gap";
      importance: "Critical" | "High" | "Advantageous";
      relevanceScore: number;
      marketReason: string;
      learningPath: string;
      suggestedResumeBullet: string;
    }[];
  }[];
  careerPivotPaths: {
    roleTitle: string;
    fitPercentage: number;
    description: string;
    keyBridgingSkills: string[];
  }[];
  strategicAdvice: {
    title: string;
    category: string;
    recommendation: string;
  }[];
}

export interface BackendParseResponse {
  success: boolean;
  fileName: string;
  fileSize?: number;
  charCount: number;
  wordCount: number;
  pageCount: number;
  extractedText: string;
  cleanText?: string;
  detectedContact?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
  };
  detectedSections?: string[];
  feedback?: Feedback;
  error?: string;
}

interface ApiStore {
  isLoading: boolean;
  error: string | null;
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;

  // Resume methods
  uploadResume: (
    file: File,
    imageFile: File | null,
    companyName: string,
    jobTitle: string,
    jobDescription: string,
    imageDataUrl?: string,
    extractedText?: string,
  ) => Promise<string | null>;
  getResume: (id: string) => Promise<Resume | null>;
  retryAnalysis: (id: string) => Promise<Resume | null>;
  getAllResumes: () => Promise<Resume[]>;
  deleteResume: (id: string) => Promise<boolean>;
  getFileUrl: (filename: string) => string;
  getCareerGrowthAdvice: (
    resumeId: string,
    options?: { targetRole?: string; refresh?: boolean },
  ) => Promise<CareerGrowthAdvice | null>;
  generateDirectCareerGrowthAdvice: (params: {
    resumeText: string;
    jobTitle?: string;
    jobDescription?: string;
    targetRole?: string;
  }) => Promise<CareerGrowthAdvice | null>;
  parseResumeWithBackend: (file: File) => Promise<BackendParseResponse | null>;
  clearError: () => void;
}

export const useApiStore = create<ApiStore>((set, get) => {
  // Initialize auth from localStorage on browser
  const initialToken =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const initialIsAuthenticated = !!initialToken;

  const setError = (error: string | null) => set({ error, isLoading: false });

  const getAuthHeaders = () => {
    const { token } = get();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await safeParseResponse<{ user: User; token: string }>(
        response,
        "Login failed. Please check your credentials.",
      );

      if (!result.ok || !result.data) {
        setError(result.error || "Invalid email or password.");
        return false;
      }

      const data = result.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
      }

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to sign in. Please try again.";
      setError(msg);
      return false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const result = await safeParseResponse<{ user: User; token: string }>(
        response,
        "Registration failed",
      );

      if (!result.ok || !result.data) {
        setError(result.error || "Registration failed. Please check your details.");
        return false;
      }

      const data = result.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
      }

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(msg);
      return false;
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
    });
  };

  const fetchUser = async (): Promise<void> => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await safeParseResponse<User>(response, "Failed to authenticate session");

      if (!result.ok || !result.data) {
        logout();
        return;
      }

      set({ user: result.data, isLoading: false });
    } catch {
      logout();
    }
  };

  const resetPassword = async (
    email: string,
    newPassword: string,
  ): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });

      const result = await safeParseResponse(response, "Password reset failed");

      if (!result.ok) {
        setError(result.error || "Password reset failed");
        return false;
      }

      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password reset failed";
      setError(msg);
      return false;
    }
  };

  const uploadResume = async (
    file: File,
    imageFile: File | null,
    companyName: string,
    jobTitle: string,
    jobDescription: string,
    imageDataUrl?: string,
    extractedText?: string,
  ): Promise<string | null> => {
    const { token } = get();
    if (!token) {
      setError("Please sign in before uploading a resume.");
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (imageDataUrl) {
        formData.append("imageData", imageDataUrl);
      } else if (imageFile) {
        formData.append("image", imageFile);
      }
      formData.append("companyName", companyName);
      formData.append("jobTitle", jobTitle);
      formData.append("jobDescription", jobDescription);
      if (extractedText) {
        formData.append("extractedText", extractedText);
      }

      const response = await fetch(`${API_URL}/api/resumes/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await safeParseResponse<{ id: string }>(response, "Upload failed");

      if (!result.ok || !result.data) {
        setError(result.error || "Upload failed. Please check the resume format.");
        return null;
      }

      set({ isLoading: false, error: null });
      return result.data.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      return null;
    }
  };

  const getResume = async (id: string): Promise<Resume | null> => {
    const { token } = get();
    if (!token) {
      setError("Not authenticated");
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/resumes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await safeParseResponse<Resume>(response, "Failed to fetch resume");

      if (!result.ok || !result.data) {
        setError(result.error || "Failed to fetch resume");
        return null;
      }

      set({ isLoading: false, error: null });
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch resume";
      setError(msg);
      return null;
    }
  };

  const retryAnalysis = async (id: string): Promise<Resume | null> => {
    const { token } = get();
    if (!token) {
      setError("Not authenticated");
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/resumes/${id}/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await safeParseResponse<{ resume: Resume }>(response, "Failed to reanalyze resume");

      if (!result.ok || !result.data) {
        setError(result.error || "Failed to reanalyze resume");
        return null;
      }

      set({ isLoading: false, error: null });
      return result.data.resume;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reanalyze resume";
      setError(msg);
      return null;
    }
  };

  const getAllResumes = async (): Promise<Resume[]> => {
    const { token } = get();
    if (!token) {
      setError("Not authenticated");
      return [];
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await safeParseResponse<Resume[]>(response, "Failed to fetch resumes");

      if (!result.ok || !result.data) {
        setError(result.error || "Failed to fetch resumes");
        return [];
      }

      set({ isLoading: false, error: null });
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch resumes";
      setError(msg);
      return [];
    }
  };

  const deleteResume = async (id: string): Promise<boolean> => {
    const { token } = get();
    if (!token) {
      setError("Not authenticated");
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/resumes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await safeParseResponse(response, "Failed to delete resume");

      if (!result.ok) {
        setError(result.error || "Failed to delete resume");
        return false;
      }

      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete resume";
      setError(msg);
      return false;
    }
  };

  const getCareerGrowthAdvice = async (
    resumeId: string,
    options?: { targetRole?: string; refresh?: boolean },
  ): Promise<CareerGrowthAdvice | null> => {
    const { token } = get();
    if (!token) {
      setError("Not authenticated");
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/resumes/${resumeId}/career-growth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(options || {}),
        },
      );

      const result = await safeParseResponse<{ careerGrowth: CareerGrowthAdvice }>(
        response,
        "Failed to load career growth advice",
      );

      if (!result.ok || !result.data) {
        setError(result.error || "Failed to load career growth advice");
        return null;
      }

      return result.data.careerGrowth || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load career growth advice";
      setError(msg);
      return null;
    }
  };

  const generateDirectCareerGrowthAdvice = async (params: {
    resumeText: string;
    jobTitle?: string;
    jobDescription?: string;
    targetRole?: string;
  }): Promise<CareerGrowthAdvice | null> => {
    try {
      const response = await fetch(
        `${API_URL}/api/resumes/career-growth/direct`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        },
      );

      const result = await safeParseResponse<{ careerGrowth: CareerGrowthAdvice }>(
        response,
        "Failed to generate career growth advice",
      );

      if (!result.ok || !result.data) {
        setError(result.error || "Failed to generate career growth advice");
        return null;
      }

      return result.data.careerGrowth || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate career growth advice";
      setError(msg);
      return null;
    }
  };

  const getFileUrl = (filename: string): string => {
    if (!filename) return "";
    if (filename.startsWith("data:")) return filename;
    const { token } = get();
    return `${API_URL}/api/resumes/file/${filename}?token=${token}`;
  };

  const parseResumeWithBackend = async (
    file: File,
  ): Promise<BackendParseResponse | null> => {
    set({ isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("parseOnly", "true");

      const response = await fetch(`${API_URL}/api/resumes/parse?parseOnly=true`, {
        method: "POST",
        body: formData,
      });

      const result = await safeParseResponse<BackendParseResponse>(
        response,
        "Failed to parse resume with backend",
      );

      if (!result.ok || !result.data) {
        const errorMsg = result.error || "Failed to extract text from resume document";
        setError(errorMsg);
        return null;
      }

      set({ isLoading: false, error: null });
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error contacting resume parsing backend";
      setError(msg);
      return null;
    }
  };

  return {
    isLoading: false,
    error: null,
    user: null,
    token: initialToken,
    isAuthenticated: initialIsAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    resetPassword,
    uploadResume,
    getResume,
    retryAnalysis,
    getAllResumes,
    deleteResume,
    getFileUrl,
    getCareerGrowthAdvice,
    generateDirectCareerGrowthAdvice,
    parseResumeWithBackend,
    clearError: () => set({ error: null }),
  };
});
