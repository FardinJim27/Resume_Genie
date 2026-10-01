import React, { useState, useMemo } from "react";
import {
  AiOutlineSearch,
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineCopy,
  AiOutlineCheck,
} from "react-icons/ai";
import {
  FaCheck,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaFileAlt,
  FaLightbulb,
  FaTasks,
} from "react-icons/fa";

export interface TipItem {
  id?: string;
  category: "ATS Compatibility" | "Tone & Style" | "Content Impact" | "Structure & Layout" | "Skills & Keywords";
  type: "good" | "improve";
  tip: string;
  explanation?: string;
  recommendation?: string;
}

export interface CategorizedFeedbackSectionProps {
  feedback: Feedback;
  jobTitle?: string;
  companyName?: string;
}

export const CategorizedFeedbackSection: React.FC<CategorizedFeedbackSectionProps> = ({
  feedback,
  jobTitle = "Target Role",
  companyName = "Target Company",
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "improve" | "good">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTipIds, setExpandedTipIds] = useState<Set<string>>(new Set());
  const [copiedTipId, setCopiedTipId] = useState<string | null>(null);

  // Group all feedback items from all categories
  const allCategorizedTips = useMemo(() => {
    const list: TipItem[] = [];

    // 1. ATS tips
    (feedback?.ATS?.tips || []).forEach((t, i) => {
      list.push({
        id: `ats-${i}`,
        category: "ATS Compatibility",
        type: t.type,
        tip: t.tip,
        explanation:
          t.type === "good"
            ? "Your document formatting cleanly passes automated applicant tracking system parsers."
            : "Applicant Tracking Systems (ATS) may fail to extract or may down-rank this section.",
        recommendation:
          t.type === "improve"
            ? "Use standard headers like 'Work Experience', keep simple bullet points, and avoid complex tables or textboxes."
            : undefined,
      });
    });

    // 2. Tone & Style tips
    (feedback?.toneAndStyle?.tips || []).forEach((t, i) => {
      list.push({
        id: `tone-${i}`,
        category: "Tone & Style",
        type: t.type,
        tip: t.tip,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Begin each bullet point with strong active verbs (e.g., 'Spearheaded', 'Engineered', 'Optimized') rather than passive phrasing."
            : undefined,
      });
    });

    // 3. Content tips
    (feedback?.content?.tips || []).forEach((t, i) => {
      list.push({
        id: `content-${i}`,
        category: "Content Impact",
        type: t.type,
        tip: t.tip,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Apply the Google X-Y-Z formula: Accomplished [X], as measured by [Y], by doing [Z] with concrete percentages or dollar figures."
            : undefined,
      });
    });

    // 4. Structure tips
    (feedback?.structure?.tips || []).forEach((t, i) => {
      list.push({
        id: `structure-${i}`,
        category: "Structure & Layout",
        type: t.type,
        tip: t.tip,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Ensure consistent margin sizing (0.5 - 0.75 in), clear chronological grouping, and 3-5 high-impact bullets per role."
            : undefined,
      });
    });

    // 5. Skills tips
    (feedback?.skills?.tips || []).forEach((t, i) => {
      list.push({
        id: `skills-${i}`,
        category: "Skills & Keywords",
        type: t.type,
        tip: t.tip,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Explicitly highlight keywords and frameworks mentioned in the target job description to maximize keyword match score."
            : undefined,
      });
    });

    return list;
  }, [feedback]);

  // Category counts and score summaries
  const categoryStats = useMemo(() => {
    const categories = [
      {
        name: "ATS Compatibility",
        score: Math.round(feedback?.ATS?.score || 0),
        key: "ATS Compatibility",
      },
      {
        name: "Tone & Style",
        score: Math.round(feedback?.toneAndStyle?.score || 0),
        key: "Tone & Style",
      },
      {
        name: "Content Impact",
        score: Math.round(feedback?.content?.score || 0),
        key: "Content Impact",
      },
      {
        name: "Structure & Layout",
        score: Math.round(feedback?.structure?.score || 0),
        key: "Structure & Layout",
      },
      {
        name: "Skills & Keywords",
        score: Math.round(feedback?.skills?.score || 0),
        key: "Skills & Keywords",
      },
    ];

    return categories.map((cat) => {
      const items = allCategorizedTips.filter((t) => t.category === cat.key);
      const warnings = items.filter((t) => t.type === "improve").length;
      const strengths = items.filter((t) => t.type === "good").length;
      return {
        ...cat,
        total: items.length,
        warnings,
        strengths,
      };
    });
  }, [allCategorizedTips, feedback]);

  // Filtering
  const filteredTips = useMemo(() => {
    return allCategorizedTips.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" || item.type === selectedStatus;
      const matchesQuery =
        !searchQuery.trim() ||
        item.tip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.explanation &&
          item.explanation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesStatus && matchesQuery;
    });
  }, [allCategorizedTips, selectedCategory, selectedStatus, searchQuery]);

  const toggleExpand = (id?: string) => {
    if (!id) return;
    setExpandedTipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyTip = async (item: TipItem) => {
    if (!item.id) return;
    const text = `[${item.category}] ${item.type === "good" ? "PASS" : "WARN"}: ${item.tip}\n${item.explanation || ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTipId(item.id);
      setTimeout(() => setCopiedTipId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const totalWarnings = allCategorizedTips.filter((t) => t.type === "improve").length;
  const totalStrengths = allCategorizedTips.filter((t) => t.type === "good").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Categorized AI Analysis Findings</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              {allCategorizedTips.length} Total Points
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Tailored evaluation for <span className="font-semibold text-slate-700 dark:text-slate-300">{jobTitle}</span> at {companyName}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback keywords..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Category Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categoryStats.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() =>
                setSelectedCategory(isSelected ? "all" : cat.key)
              }
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-2xs ${
                isSelected
                  ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {cat.name}
                </span>
                <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                  {cat.score}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cat.score}%`,
                    backgroundColor:
                      cat.score >= 80
                        ? "#10b981"
                        : cat.score >= 60
                        ? "#f59e0b"
                        : "#f43f5e",
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {cat.strengths} pass
                </span>
                {cat.warnings > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {cat.warnings} fix
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Row: Category pills + Status toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedStatus("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedStatus === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All ({allCategorizedTips.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("improve")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedStatus === "improve"
                ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FaExclamationTriangle className="w-3 h-3 text-amber-500" />
            <span>Needs Improvement ({totalWarnings})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("good")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              selectedStatus === "good"
                ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FaCheck className="w-3 h-3 text-emerald-500" />
            <span>Passed Strengths ({totalStrengths})</span>
          </button>
        </div>

        {selectedCategory !== "all" && (
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
          >
            Reset category filter (view all)
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-3">
        {filteredTips.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <FaFileAlt className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No feedback items matched your filter criteria
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSearchQuery("");
              }}
              className="mt-3 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredTips.map((item) => {
            const isExpanded = !!item.id && expandedTipIds.has(item.id);
            const isWarn = item.type === "improve";

            return (
              <div
                key={item.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isWarn
                    ? "border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 hover:border-amber-300"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                }`}
              >
                {/* Header Row */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                        isWarn
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isWarn ? (
                        <FaExclamationTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <FaCheck className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                            isWarn
                              ? "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {isWarn ? "Needs Action" : "Passed Validation"}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {item.tip}
                      </h4>

                      {item.explanation && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Copy & Expand */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyTip(item)}
                      title="Copy recommendation text"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedTipId === item.id ? (
                        <AiOutlineCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AiOutlineCopy className="w-4 h-4" />
                      )}
                    </button>

                    {item.recommendation && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isExpanded ? "Collapse guidance" : "Expand action guidance"}
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

                {/* Expanded Actionable Guidance */}
                {isExpanded && item.recommendation && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <FaLightbulb className="w-3 h-3" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        How to Optimize This in Your Resume:
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CategorizedFeedbackSection;
