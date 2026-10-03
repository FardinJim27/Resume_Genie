import React, { useState, useMemo, useEffect } from "react";
import {
  AiOutlineSearch,
  AiOutlineCheck,
  AiOutlineCopy,
  AiOutlineFilter,
  AiOutlineCheckCircle,
  AiOutlineInfoCircle,
  AiOutlineUndo,
} from "react-icons/ai";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaTasks,
  FaRegLightbulb,
  FaChevronDown,
  FaChevronUp,
  FaRegCheckSquare,
  FaRegSquare,
  FaClipboardList,
  FaRocket,
  FaShieldAlt,
  FaFileAlt,
  FaSlidersH,
} from "react-icons/fa";

export type FeedbackCategoryKey =
  | "all"
  | "ATS"
  | "toneAndStyle"
  | "content"
  | "structure"
  | "skills";

export type FeedbackStatusFilter = "all" | "improve" | "good";

export interface ActionableTipItem {
  id: string;
  categoryKey: "ATS" | "toneAndStyle" | "content" | "structure" | "skills";
  categoryLabel: string;
  type: "good" | "improve";
  tip: string;
  explanation?: string;
  actionRecommendation: string;
  priority: "High" | "Medium" | "Strength";
  exampleSnippet?: string;
}

export interface ResumeFeedbackSectionProps {
  feedback: Feedback | null | undefined;
  jobTitle?: string;
  companyName?: string;
  resumeId?: string;
  className?: string;
  initialFilter?: FeedbackStatusFilter;
  initialCategory?: FeedbackCategoryKey;
  showHeader?: boolean;
}

const CATEGORY_METADATA: Record<
  Exclude<FeedbackCategoryKey, "all">,
  { label: string; icon: string; description: string }
> = {
  ATS: {
    label: "ATS Compatibility",
    icon: "🤖",
    description: "Parser readability, keyword discoverability, and machine filtering grammar.",
  },
  toneAndStyle: {
    label: "Tone & Style",
    icon: "✍️",
    description: "Executive voice, active verbs, professional polish, and tense consistency.",
  },
  content: {
    label: "Content Impact",
    icon: "🎯",
    description: "Quantified outcomes, business metrics, and achievement-focused descriptions.",
  },
  structure: {
    label: "Structure & Layout",
    icon: "📐",
    description: "Section grouping, logical visual flow, scanning hierarchy, and margins.",
  },
  skills: {
    label: "Skills & Keywords",
    icon: "⚡",
    description: "Job-aligned technical skills, tooling proficiencies, and domain competencies.",
  },
};

/**
 * Standardizes backend feedback tips into structured, highly actionable bullet point items.
 */
function normalizeFeedbackItems(
  feedback: Feedback | null | undefined,
  jobTitle: string = "Target Role",
): ActionableTipItem[] {
  if (!feedback) return [];

  const items: ActionableTipItem[] = [];

  // 1. ATS Tips
  if (feedback.ATS?.tips) {
    feedback.ATS.tips.forEach((tipObj, idx) => {
      const isImprove = tipObj.type === "improve";
      items.push({
        id: `ats-${idx}`,
        categoryKey: "ATS",
        categoryLabel: "ATS Compatibility",
        type: tipObj.type,
        tip: tipObj.tip,
        explanation: isImprove
          ? "Applicant Tracking Systems (ATS) score resumes using automated tokenizers. Missing standard syntax or non-standard tables can prevent automated discovery."
          : "Your document follows standard parsing conventions, allowing ATS engines to extract qualifications cleanly.",
        actionRecommendation: isImprove
          ? `Align section headers with standard naming ('Experience', 'Education', 'Skills') and ensure keywords related to "${jobTitle}" appear naturally in bullet points.`
          : "Maintain standard bullet formatting and plain text hierarchy throughout revisions.",
        priority: isImprove ? "High" : "Strength",
        exampleSnippet: isImprove
          ? `Tip: In your skills section, list explicit industry terms matching "${jobTitle}" job postings.`
          : undefined,
      });
    });
  }

  // 2. Tone & Style Tips
  if (feedback.toneAndStyle?.tips) {
    feedback.toneAndStyle.tips.forEach((tipObj, idx) => {
      const isImprove = tipObj.type === "improve";
      items.push({
        id: `tone-${idx}`,
        categoryKey: "toneAndStyle",
        categoryLabel: "Tone & Style",
        type: tipObj.type,
        tip: tipObj.tip,
        explanation: tipObj.explanation,
        actionRecommendation: isImprove
          ? "Lead every resume bullet with a decisive power verb (e.g., 'Spearheaded', 'Architected', 'Streamlined', 'Delivered') and eliminate passive verbs."
          : "Strong professional phrasing detected. Continue framing milestones with confidence.",
        priority: isImprove ? "Medium" : "Strength",
        exampleSnippet: isImprove
          ? "Before: 'Responsible for leading team meetings.' → After: 'Orchestrated bi-weekly agile sprint planning for 8 engineers.'"
          : undefined,
      });
    });
  }

  // 3. Content Impact Tips
  if (feedback.content?.tips) {
    feedback.content.tips.forEach((tipObj, idx) => {
      const isImprove = tipObj.type === "improve";
      items.push({
        id: `content-${idx}`,
        categoryKey: "content",
        categoryLabel: "Content Impact",
        type: tipObj.type,
        tip: tipObj.tip,
        explanation: tipObj.explanation,
        actionRecommendation: isImprove
          ? "Apply Google's X-Y-Z formula: Accomplished [X], as measured by [Y], by doing [Z]. Include concrete metrics (%, $, hours saved)."
          : "Achievements effectively demonstrate clear business contribution and measurable scope.",
        priority: isImprove ? "High" : "Strength",
        exampleSnippet: isImprove
          ? "Formula: 'Increased [metric] by [X%] through [initiative], reducing [cost/latency] by [Y].'"
          : undefined,
      });
    });
  }

  // 4. Structure Tips
  if (feedback.structure?.tips) {
    feedback.structure.tips.forEach((tipObj, idx) => {
      const isImprove = tipObj.type === "improve";
      items.push({
        id: `structure-${idx}`,
        categoryKey: "structure",
        categoryLabel: "Structure & Layout",
        type: tipObj.type,
        tip: tipObj.tip,
        explanation: tipObj.explanation,
        actionRecommendation: isImprove
          ? "Keep 3-5 punchy bullets per recent role, ensure consistent date formatting (MM/YYYY - MM/YYYY), and balance page whitespace."
          : "Layout provides clear visual navigation for hiring managers and recruiters.",
        priority: isImprove ? "Medium" : "Strength",
        exampleSnippet: isImprove
          ? "Tip: Standardize margins between 0.5 and 0.75 inches to maximize readable area without visual crowding."
          : undefined,
      });
    });
  }

  // 5. Skills Tips
  if (feedback.skills?.tips) {
    feedback.skills.tips.forEach((tipObj, idx) => {
      const isImprove = tipObj.type === "improve";
      items.push({
        id: `skills-${idx}`,
        categoryKey: "skills",
        categoryLabel: "Skills & Keywords",
        type: tipObj.type,
        tip: tipObj.tip,
        explanation: tipObj.explanation,
        actionRecommendation: isImprove
          ? `Integrate required skills from the ${jobTitle} target description directly into your job bullet points to prove hands-on application.`
          : "Skill set aligns well with core technical competencies expected for this profile.",
        priority: isImprove ? "High" : "Strength",
        exampleSnippet: isImprove
          ? "Tip: Categorize skills into 'Languages', 'Frameworks & Tools', and 'Methodologies' for quick scanning."
          : undefined,
      });
    });
  }

  return items;
}

export const ResumeFeedbackSection: React.FC<ResumeFeedbackSectionProps> = ({
  feedback,
  jobTitle = "Target Role",
  companyName = "Target Company",
  resumeId = "default_resume",
  className = "",
  initialFilter = "all",
  initialCategory = "all",
  showHeader = true,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<FeedbackCategoryKey>(initialCategory);
  const [statusFilter, setStatusFilter] =
    useState<FeedbackStatusFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Load resolved items state from localStorage
  useEffect(() => {
    if (!resumeId) return;
    try {
      const stored = localStorage.getItem(`resume_resolved_feedback_${resumeId}`);
      if (stored) {
        setResolvedIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore storage errors
    }
  }, [resumeId]);

  // Persist resolved state to localStorage
  const toggleResolved = (id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(
          `resume_resolved_feedback_${resumeId}`,
          JSON.stringify(Array.from(next)),
        );
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const resetAllResolved = () => {
    setResolvedIds(new Set());
    try {
      localStorage.removeItem(`resume_resolved_feedback_${resumeId}`);
    } catch {
      // Ignore
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Convert raw backend feedback into unified items
  const allItems = useMemo(
    () => normalizeFeedbackItems(feedback, jobTitle),
    [feedback, jobTitle],
  );

  // Pillar scores
  const categoryScores = useMemo(() => {
    return {
      ATS: Math.round(feedback?.ATS?.score || 0),
      toneAndStyle: Math.round(feedback?.toneAndStyle?.score || 0),
      content: Math.round(feedback?.content?.score || 0),
      structure: Math.round(feedback?.structure?.score || 0),
      skills: Math.round(feedback?.skills?.score || 0),
    };
  }, [feedback]);

  // Counts
  const improvementItems = useMemo(
    () => allItems.filter((i) => i.type === "improve"),
    [allItems],
  );
  const strengthItems = useMemo(
    () => allItems.filter((i) => i.type === "good"),
    [allItems],
  );

  const totalImprovements = improvementItems.length;
  const totalStrengths = strengthItems.length;
  const totalResolved = useMemo(
    () => improvementItems.filter((i) => resolvedIds.has(i.id)).length,
    [improvementItems, resolvedIds],
  );

  // Filtered tips based on category, status, and search query
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.categoryKey !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === "improve" && item.type !== "improve") {
        return false;
      }
      if (statusFilter === "good" && item.type !== "good") {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTip = item.tip.toLowerCase().includes(q);
        const matchesExplanation = (item.explanation || "").toLowerCase().includes(q);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(q);
        const matchesRecommendation = item.actionRecommendation.toLowerCase().includes(q);
        return matchesTip || matchesExplanation || matchesCategory || matchesRecommendation;
      }
      return true;
    });
  }, [allItems, selectedCategory, statusFilter, searchQuery]);

  // Copy single tip
  const handleCopySingle = async (item: ActionableTipItem) => {
    const text = `• [${item.type === "improve" ? "ACTION REQUIRED" : "STRENGTH"}] ${item.categoryLabel}: ${item.tip}\n  Recommendation: ${item.actionRecommendation}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Copy all actionable improvements as a checklist
  const handleCopyAllImprovements = async () => {
    if (improvementItems.length === 0) return;
    const header = `# Resume Action Plan: ${jobTitle} (${companyName})\nTotal Improvements: ${improvementItems.length}\nGenerated by AI Resume Analyzer\n\n`;
    const body = improvementItems
      .map((item, idx) => {
        const isDone = resolvedIds.has(item.id);
        return `${idx + 1}. [${isDone ? "x" : " "}] ${item.categoryLabel}: ${item.tip}\n   • Context: ${item.explanation || "N/A"}\n   • Action: ${item.actionRecommendation}${item.exampleSnippet ? `\n   • Example: ${item.exampleSnippet}` : ""}`;
      })
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(header + body);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (!feedback) {
    return (
      <div className={`p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center ${className}`}>
        <FaTasks className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          No Resume Feedback Available
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Upload and analyze a resume to view AI-generated feedback and prioritized improvement bullet points.
        </p>
      </div>
    );
  }

  return (
    <section
      id="actionable-feedback"
      aria-label="AI-Generated Resume Feedback & Actionable Improvement Bullet Points"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden ${className}`}
    >
      {/* SECTION HEADER */}
      {showHeader && (
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <FaTasks className="w-3.5 h-3.5" />
                  <span>AI Feedback & Action Plan</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Targeted for {jobTitle}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                AI-Generated Resume Feedback & Actionable Improvements
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Review specific weaknesses and strengths returned by the evaluation engine.
                Check off items as you implement edits to track your resume optimization progress.
              </p>
            </div>

            {/* Top Metric Strip / Progress & Export */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-center">
              {totalImprovements > 0 && (
                <button
                  type="button"
                  onClick={handleCopyAllImprovements}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  title="Copy full action checklist formatted as Markdown"
                >
                  {copiedAll ? (
                    <>
                      <AiOutlineCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">Copied Checklist!</span>
                    </>
                  ) : (
                    <>
                      <AiOutlineCopy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Action Checklist</span>
                    </>
                  )}
                </button>
              )}

              {totalResolved > 0 && (
                <button
                  type="button"
                  onClick={resetAllResolved}
                  className="px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reset all checkboxes"
                >
                  <AiOutlineUndo className="w-3 h-3" />
                  <span>Reset ({totalResolved})</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Mini-Counters & Progress Bar */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
            {/* KPI 1: Priority Improvements */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Action Items
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                  {totalImprovements}
                </span>
                <span className="text-[11px] text-slate-500">to address</span>
              </div>
            </div>

            {/* KPI 2: Validated Strengths */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Validated Strengths
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalStrengths}
                </span>
                <span className="text-[11px] text-slate-500">passed checks</span>
              </div>
            </div>

            {/* KPI 3: Implementation Progress */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Implemented Edits
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                  {totalResolved}
                </span>
                <span className="text-[11px] text-slate-500">of {totalImprovements}</span>
              </div>
            </div>

            {/* KPI 4: Potential Uplift */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Targeted Score Lift
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                  +{Math.min(30, totalImprovements * 5)}%
                </span>
                <span className="text-[11px] text-slate-500">potential</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE CONTROLS BAR: Category Segmented Bar + Status Toggles + Search */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-4">
        {/* Category Segmented Buttons */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Filter by Evaluation Pillar
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Pillars ({allItems.length})
            </button>

            {(
              [
                { key: "ATS", label: "ATS Scanner", score: categoryScores.ATS },
                { key: "toneAndStyle", label: "Tone & Style", score: categoryScores.toneAndStyle },
                { key: "content", label: "Content Impact", score: categoryScores.content },
                { key: "structure", label: "Structure", score: categoryScores.structure },
                { key: "skills", label: "Skills", score: categoryScores.skills },
              ] as const
            ).map((cat) => {
              const isSelected = selectedCategory === cat.key;
              const countInPillar = allItems.filter((i) => i.categoryKey === cat.key).length;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="font-mono text-[11px] opacity-80">
                    {cat.score}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                    {countInPillar}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filters + Search Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Status Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All Bullet Points ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("improve")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === "improve"
                  ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FaExclamationTriangle className="w-3 h-3 text-amber-500" />
              <span>Needs Improvement ({totalImprovements})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("good")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === "good"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FaCheckCircle className="w-3 h-3 text-emerald-500" />
              <span>Strengths ({totalStrengths})</span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full md:w-72">
            <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback keywords..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEEDBACK BULLET POINTS LIST */}
      <div className="p-4 sm:p-6 space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <FaFileAlt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No feedback points match the selected criteria
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your pillar category or status filter above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isImprove = item.type === "improve";
            const isResolved = resolvedIds.has(item.id);
            const isExpanded = expandedIds.has(item.id);

            return (
              <article
                key={item.id}
                className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
                  isResolved
                    ? "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 opacity-75"
                    : isImprove
                    ? "border-amber-200/90 dark:border-amber-900/60 bg-white dark:bg-slate-900 shadow-2xs hover:border-amber-400 dark:hover:border-amber-700"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Main Card Header / Bullet Content */}
                <div className="p-4 sm:p-5 flex items-start justify-between gap-3 sm:gap-4">
                  {/* Left: Checkbox & Bullet Content */}
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                    {/* Interactive Resolution Checkbox (For improvement items) */}
                    {isImprove ? (
                      <button
                        type="button"
                        onClick={() => toggleResolved(item.id)}
                        className="mt-0.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                        title={
                          isResolved
                            ? "Marked as resolved. Click to reopen."
                            : "Click to mark this improvement as resolved in your resume."
                        }
                      >
                        {isResolved ? (
                          <FaRegCheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FaRegSquare className="w-4 h-4 text-slate-400 hover:text-amber-600" />
                        )}
                      </button>
                    ) : (
                      <div className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500">
                        <FaCheckCircle className="w-4 h-4" />
                      </div>
                    )}

                    {/* Content Body */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Meta labels (Clean typography, anti-slop compliant) */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                          {item.categoryLabel}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={`font-semibold font-mono text-[10px] ${
                            isResolved
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isImprove
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {isResolved
                            ? "✓ Resolved in Draft"
                            : isImprove
                            ? `Priority Improvement`
                            : "Validated Strength"}
                        </span>
                      </div>

                      {/* Bullet Title */}
                      <h3
                        className={`text-sm sm:text-base font-semibold leading-snug tracking-tight ${
                          isResolved
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {item.tip}
                      </h3>

                      {/* Explanation */}
                      {item.explanation && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                          {item.explanation}
                        </p>
                      )}

                      {/* Direct Action Recommendation Snippet */}
                      {isImprove && item.actionRecommendation && (
                        <div className="mt-2.5 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2.5 text-xs">
                          <FaRegLightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-amber-900 dark:text-amber-200 block">
                              Action to Take:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {item.actionRecommendation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Copy & Expand */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(item)}
                      title="Copy recommendation bullet point"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <AiOutlineCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AiOutlineCopy className="w-4 h-4" />
                      )}
                    </button>

                    {item.exampleSnippet && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        title={isExpanded ? "Hide rewriting example" : "View rewriting example"}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <FaChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <FaChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Rewriting Example */}
                {isExpanded && item.exampleSnippet && (
                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] mb-1 font-semibold">
                      <span>💡 Rewriting Example & Guidelines</span>
                    </div>
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-md border border-slate-200 dark:border-slate-800 leading-relaxed">
                      {item.exampleSnippet}
                    </p>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* FOOTER AUDIT SUMMARY */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <FaShieldAlt className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Showing {filteredItems.length} of {allItems.length} total feedback items
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]">
            {totalResolved} / {totalImprovements} improvements completed
          </span>
        </div>
      </div>
    </section>
  );
};

export default ResumeFeedbackSection;
