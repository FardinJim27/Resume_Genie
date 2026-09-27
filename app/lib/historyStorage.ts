export interface SavedAnalysis {
  id: string; // Unique snapshot ID
  resumeId: string;
  versionLabel: string;
  companyName: string;
  jobTitle: string;
  timestamp: number;
  overallScore: number;
  atsScore: number;
  breakdown: {
    content: number;
    structure: number;
    skills: number;
    toneAndStyle: number;
  };
  feedback: Feedback;
  notes?: string;
}

const STORAGE_KEY = "resume_genie_analyses_history_v1";

export const getAnalysesHistory = (): SavedAnalysis[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: SavedAnalysis[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch (err) {
    console.warn("Could not read resume analysis history from localStorage:", err);
    return [];
  }
};

export const getAnalysisById = (id: string): SavedAnalysis | undefined => {
  const history = getAnalysesHistory();
  return history.find((item) => item.id === id || item.resumeId === id);
};

export const saveAnalysisToHistory = (
  resumeId: string,
  companyName: string,
  jobTitle: string,
  feedback: Feedback,
  customLabel?: string,
  notes?: string,
): SavedAnalysis => {
  if (!feedback || typeof window === "undefined") {
    throw new Error("Invalid feedback or window context");
  }

  const history = getAnalysesHistory();
  const existingForResume = history.filter((item) => item.resumeId === resumeId);
  const versionIndex = existingForResume.length + 1;
  const versionLabel =
    customLabel?.trim() ||
    `Version ${versionIndex} (${companyName || "Resume"})`;

  const newEntry: SavedAnalysis = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    resumeId,
    versionLabel,
    companyName: companyName || "Target Company",
    jobTitle: jobTitle || "Target Role",
    timestamp: Date.now(),
    overallScore: feedback.overallScore ?? 0,
    atsScore: feedback.ATS?.score ?? 0,
    breakdown: {
      content: feedback.content?.score ?? 0,
      structure: feedback.structure?.score ?? 0,
      skills: feedback.skills?.score ?? 0,
      toneAndStyle: feedback.toneAndStyle?.score ?? 0,
    },
    feedback,
    notes,
  };

  // Check if identical snapshot already exists in the last 15 seconds to avoid duplicate spam
  const recentDuplicate = history.find(
    (item) =>
      item.resumeId === resumeId &&
      item.overallScore === newEntry.overallScore &&
      item.atsScore === newEntry.atsScore &&
      Math.abs(item.timestamp - newEntry.timestamp) < 15000,
  );

  if (recentDuplicate) {
    return recentDuplicate;
  }

  const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50 analyses
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.warn("Failed to persist analysis history to localStorage:", err);
  }

  return newEntry;
};

export const updateAnalysisLabel = (
  id: string,
  newLabel: string,
  notes?: string,
): void => {
  if (typeof window === "undefined") return;
  const history = getAnalysesHistory();
  const updated = history.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        versionLabel: newLabel.trim() || item.versionLabel,
        notes: notes !== undefined ? notes : item.notes,
      };
    }
    return item;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to update analysis history item in localStorage:", err);
  }
};

export const deleteAnalysisFromHistory = (id: string): void => {
  if (typeof window === "undefined") return;
  const history = getAnalysesHistory();
  const filtered = history.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to delete analysis from localStorage:", err);
  }
};

export const clearAnalysesHistory = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear localStorage analysis history:", err);
  }
};
