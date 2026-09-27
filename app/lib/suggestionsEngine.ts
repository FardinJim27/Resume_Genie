// Engine to extract, structure, and manage section-specific actionable resume suggestions
// with Accept / Dismiss workflows and proposed copy changes.

export type ResumeSection =
  | "summary"
  | "experience"
  | "skills"
  | "structure"
  | "education"
  | "ats";

export type SuggestionImpact = "high" | "medium" | "low";
export type SuggestionStatus = "pending" | "accepted" | "dismissed";

export interface ResumeSuggestion {
  id: string;
  section: ResumeSection;
  sectionLabel: string;
  category: "content" | "structure" | "toneAndStyle" | "skills" | "ATS";
  impact: SuggestionImpact;
  title: string;
  rationale: string;
  originalSnippet?: string;
  proposedChange: string;
  status: SuggestionStatus;
  userEditedSnippet?: string;
  acceptedAt?: number;
}

const STORAGE_PREFIX = "resume_genie_suggestions_v1_";

export const getStoredSuggestionsState = (
  resumeId: string,
): Record<string, { status: SuggestionStatus; userEditedSnippet?: string }> => {
  if (typeof window === "undefined" || !resumeId) return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${resumeId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Could not read suggestions state from localStorage:", err);
    return {};
  }
};

export const saveStoredSuggestionsState = (
  resumeId: string,
  state: Record<string, { status: SuggestionStatus; userEditedSnippet?: string }>,
): void => {
  if (typeof window === "undefined" || !resumeId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${resumeId}`, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save suggestions state to localStorage:", err);
  }
};

// Map category to standard section
function mapCategoryToSection(category: string, tipText: string): { section: ResumeSection; sectionLabel: string } {
  const lower = tipText.toLowerCase();

  if (lower.includes("summary") || lower.includes("objective") || lower.includes("intro") || lower.includes("profile")) {
    return { section: "summary", sectionLabel: "Professional Summary" };
  }
  if (lower.includes("skill") || lower.includes("technology") || lower.includes("tools") || lower.includes("stack")) {
    return { section: "skills", sectionLabel: "Skills & Proficiencies" };
  }
  if (lower.includes("bullet") || lower.includes("metric") || lower.includes("result") || lower.includes("experience") || lower.includes("action verb") || lower.includes("quantif")) {
    return { section: "experience", sectionLabel: "Work Experience" };
  }
  if (lower.includes("format") || lower.includes("layout") || lower.includes("margin") || lower.includes("font") || lower.includes("length") || lower.includes("page")) {
    return { section: "structure", sectionLabel: "Structure & Layout" };
  }
  if (lower.includes("degree") || lower.includes("gpa") || lower.includes("university") || lower.includes("course") || lower.includes("education")) {
    return { section: "education", sectionLabel: "Education" };
  }

  switch (category) {
    case "skills":
      return { section: "skills", sectionLabel: "Skills & Proficiencies" };
    case "structure":
      return { section: "structure", sectionLabel: "Structure & Layout" };
    case "ATS":
      return { section: "ats", sectionLabel: "ATS Compatibility" };
    case "toneAndStyle":
      return { section: "summary", sectionLabel: "Tone & Voice" };
    case "content":
    default:
      return { section: "experience", sectionLabel: "Work Experience" };
  }
}

// Generate an intelligent Before / After snippet based on the tip content
function generateBeforeAndAfterSnippet(tipText: string, explanationText: string, jobTitle?: string): { original?: string; proposed: string } {
  const lower = (tipText + " " + explanationText).toLowerCase();

  if (lower.includes("quantif") || lower.includes("metric") || lower.includes("number") || lower.includes("impact")) {
    return {
      original: "Responsible for managing software development and solving bug tickets.",
      proposed: "Spearheaded core feature development and bug triage, resolving 85+ production issues and reducing application latency by 32%.",
    };
  }

  if (lower.includes("action verb") || lower.includes("passive")) {
    return {
      original: "Assisted the team in organizing sprint meetings and writing tests.",
      proposed: "Orchestrated bi-weekly Agile sprint workflows and built comprehensive automated unit test suites, boosting team velocity by 25%.",
    };
  }

  if (lower.includes("skill") || lower.includes("keyword") || lower.includes("tailor")) {
    return {
      original: "Proficient in web development technologies and standard programming languages.",
      proposed: `Specialized in modern frontend and backend development: TypeScript, React, Node.js, RESTful APIs, and CI/CD automated deployments tailored for ${jobTitle || "software engineering roles"}.`,
    };
  }

  if (lower.includes("summary") || lower.includes("objective")) {
    return {
      original: "Hardworking professional seeking an opportunity to utilize my skills and grow.",
      proposed: `Results-driven ${jobTitle || "Software Engineer"} with 3+ years of experience delivering scalable web platforms, cross-functional project leadership, and robust production systems.`,
    };
  }

  if (lower.includes("length") || lower.includes("concise") || lower.includes("page")) {
    return {
      original: "Extensive multi-page descriptions of daily routine responsibilities and old coursework.",
      proposed: "Streamlined 1-page format highlighting high-impact career milestones, core competencies, and recent measurable achievements.",
    };
  }

  if (lower.includes("format") || lower.includes("font") || lower.includes("ats") || lower.includes("header")) {
    return {
      original: "Complex multi-column tables, text boxes, and decorative graphics.",
      proposed: "Clean single-column standard typography (e.g. Arial / Calibri, 10.5pt - 11pt) with standard H2 section headings for 100% ATS parse rate.",
    };
  }

  return {
    original: "Generic bullet point without clear ownership or business outcomes.",
    proposed: `Enhanced achievement statement emphasizing leadership, measurable metrics, and demonstrated proficiency relevant to ${jobTitle || "the target role"}.`,
  };
}

// Extract suggestions from feedback and apply stored user states (Accepted/Dismissed)
export function buildResumeSuggestions(
  feedback: Feedback | null,
  resumeId: string,
  jobTitle?: string,
): ResumeSuggestion[] {
  if (!feedback) return [];

  const storedState = getStoredSuggestionsState(resumeId);
  const suggestions: ResumeSuggestion[] = [];

  // Helper to add tip
  const addTip = (
    category: "content" | "structure" | "toneAndStyle" | "skills" | "ATS",
    tip: { type: "good" | "improve"; tip: string; explanation?: string },
    index: number,
  ) => {
    // Only focus action items on things that can be improved or optimized
    const { section, sectionLabel } = mapCategoryToSection(category, tip.tip);
    const id = `sug_${category}_${index}_${tip.tip.slice(0, 16).replace(/[^a-zA-Z0-9]/g, "")}`;
    const snippets = generateBeforeAndAfterSnippet(tip.tip, tip.explanation || "", jobTitle);

    let impact: SuggestionImpact = "medium";
    if (category === "content" || category === "ATS" || tip.tip.toLowerCase().includes("quantif") || tip.tip.toLowerCase().includes("keyword")) {
      impact = "high";
    } else if (tip.type === "good") {
      impact = "low";
    }

    const state = storedState[id] || { status: "pending" };

    suggestions.push({
      id,
      section,
      sectionLabel,
      category,
      impact,
      title: tip.tip,
      rationale: tip.explanation || `Optimizing this aspect will directly strengthen your ATS ranking and recruiter readability.`,
      originalSnippet: snippets.original,
      proposedChange: snippets.proposed,
      status: state.status || "pending",
      userEditedSnippet: state.userEditedSnippet,
    });
  };

  // 1. Process Content tips
  if (feedback.content?.tips) {
    feedback.content.tips.forEach((tip, idx) => addTip("content", tip, idx));
  }

  // 2. Process Structure tips
  if (feedback.structure?.tips) {
    feedback.structure.tips.forEach((tip, idx) => addTip("structure", tip, idx));
  }

  // 3. Process Tone & Style tips
  if (feedback.toneAndStyle?.tips) {
    feedback.toneAndStyle.tips.forEach((tip, idx) => addTip("toneAndStyle", tip, idx));
  }

  // 4. Process Skills tips
  if (feedback.skills?.tips) {
    feedback.skills.tips.forEach((tip, idx) => addTip("skills", tip, idx));
  }

  // 5. Process ATS tips (which only have { type, tip })
  if (feedback.ATS?.tips) {
    feedback.ATS.tips.forEach((tip, idx) => {
      if (tip.type === "improve") {
        addTip("ATS", { ...tip, explanation: "ATS scanners look for standard naming conventions, keywords, and cleanly structured headings." }, idx);
      }
    });
  }

  // Sort: pending first, then by impact (high > medium > low)
  const impactScore = { high: 3, medium: 2, low: 1 };
  suggestions.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return impactScore[b.impact] - impactScore[a.impact];
  });

  return suggestions;
}
