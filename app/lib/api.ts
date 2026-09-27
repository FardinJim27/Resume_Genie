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

  clearError: () => void;
}

export const useApiStore = create<ApiStore>((set, get) => {
  // Load token from localStorage (only in browser)
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const initialToken = storedToken || null;
  const initialIsAuthenticated = !!storedToken;

  const setError = (msg: string) => {
    set({ error: msg, isLoading: false });
  };

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
        body: JSON.stringify({ email, password }),
      });

      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: `Server error: ${response.status} ${response.statusText}` };
      }

      if (!response.ok) {
        setError(data.error || "Login failed");
        return false;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
      }

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
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
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Registration failed");
        return false;
      }

      const data = await response.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
      }

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
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

      if (!response.ok) {
        logout();
        return;
      }

      const user = await response.json();
      set({ user, isLoading: false });
    } catch (err) {
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
        body: JSON.stringify({ email, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Password reset failed");
        return false;
      }

      set({ isLoading: false });
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
      setError("Not authenticated");
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (imageDataUrl) {
        // Preferred: send as base64 data URL to store directly in DB
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Upload failed");
        return null;
      }

      const data = await response.json();
      set({ isLoading: false });
      return data.id;
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch resume");
        return null;
      }

      const resume = await response.json();
      set({ isLoading: false });
      return resume;
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to reanalyze resume");
        return null;
      }

      const data = await response.json();
      set({ isLoading: false });
      return data.resume;
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch resumes");
        return [];
      }

      const resumes = await response.json();
      set({ isLoading: false });
      return resumes;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch resumes";
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete resume");
        return false;
      }

      set({ isLoading: false });
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete resume";
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load career growth advice");
        return null;
      }

      const result = await response.json();
      return result.careerGrowth || null;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load career growth advice";
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate career growth advice");
        return null;
      }

      const result = await response.json();
      return result.careerGrowth || null;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to generate career growth advice";
      setError(msg);
      return null;
    }
  };

  const getFileUrl = (filename: string): string => {
    if (!filename) return "";
    // If it's already a data URL (base64 stored in DB), return as-is
    if (filename.startsWith("data:")) return filename;
    const { token } = get();
    return `${API_URL}/api/resumes/file/${filename}?token=${token}`;
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
    clearError: () => set({ error: null }),
  };
});
