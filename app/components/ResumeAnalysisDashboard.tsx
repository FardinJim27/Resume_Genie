import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  AiOutlineCheck,
  AiOutlineCopy,
  AiOutlineDownload,
  AiOutlineFilter,
  AiOutlineReload,
  AiOutlineSearch,
  AiOutlineShareAlt,
  AiOutlinePrinter,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import {
  FaChartPie,
  FaFileAlt,
  FaRocket,
  FaBalanceScale,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaListUl,
  FaTasks,
  FaArrowRight,
  FaColumns,
  FaExpand,
  FaCompress,
  FaRegLightbulb,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";
import ATSScoreBreakdownChart from "./ATSScoreBreakdownChart";
import JobKeywordMatcher from "./JobKeywordMatcher";
import CareerGrowthAdviceModule from "./CareerGrowthAdviceModule";
import ResumeActionSuggestions from "./ResumeActionSuggestions";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "./Accordion";
import ThemeToggle from "./ThemeToggle";

export interface ResumeAnalysisDashboardProps {
  resumeId: string;
  feedback: Feedback;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  previewUrl?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  onToggleComparison?: () => void;
  historyCount?: number;
  workspaceMode: "split" | "full" | "preview";
  setWorkspaceMode: (mode: "split" | "full" | "preview") => void;
}

export const ResumeAnalysisDashboard = ({
  resumeId,
  feedback,
  companyName = "Target Company",
  jobTitle = "Target Role",
  jobDescription = "",
  previewUrl = "",
  onRetry,
  isRetrying = false,
  onToggleComparison,
  historyCount = 0,
  workspaceMode,
  setWorkspaceMode,
}: ResumeAnalysisDashboardProps) => {
  // Navigation tabs for the dashboard
  const [activeTab, setActiveTab] = useState<
    "overview" | "ats" | "feedback" | "growth" | "preview"
  >("overview");

  // Feedback view mode toggle (interactive cards vs category breakdown)
  const [feedbackViewMode, setFeedbackViewMode] = useState<"cards" | "breakdown">("cards");

  // Quick feedback category filter inside breakdown
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    "all" | "tone" | "content" | "structure" | "skills"
  >("all");

  // Export / Print Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Extract core metrics safely
  const overallScore = Math.max(0, Math.min(100, Math.round(feedback?.overallScore || 0)));
  const atsScore = Math.max(0, Math.min(100, Math.round(feedback?.ATS?.score || 0)));
  const toneScore = Math.max(0, Math.min(100, Math.round(feedback?.toneAndStyle?.score || 0)));
  const contentScore = Math.max(0, Math.min(100, Math.round(feedback?.content?.score || 0)));
  const structureScore = Math.max(0, Math.min(100, Math.round(feedback?.structure?.score || 0)));
  const skillsScore = Math.max(0, Math.min(100, Math.round(feedback?.skills?.score || 0)));

  // Count positive vs improvement points across all categories
  const atsGoodCount = (feedback?.ATS?.tips || []).filter((t) => t.type === "good").length;
  const atsImproveCount = (feedback?.ATS?.tips || []).filter((t) => t.type === "improve").length;

  const allTips = useMemo(() => {
    const list: {
      category: string;
      type: "good" | "improve";
      tip: string;
      explanation?: string;
    }[] = [];

    (feedback?.toneAndStyle?.tips || []).forEach((t) =>
      list.push({ ...t, category: "Tone & Style" }),
    );
    (feedback?.content?.tips || []).forEach((t) =>
      list.push({ ...t, category: "Content Quality" }),
    );
    (feedback?.structure?.tips || []).forEach((t) =>
      list.push({ ...t, category: "Structure & Layout" }),
    );
    (feedback?.skills?.tips || []).forEach((t) =>
      list.push({ ...t, category: "Skills & Keywords" }),
    );

    return list;
  }, [feedback]);

  const totalStrengthsCount = allTips.filter((t) => t.type === "good").length + atsGoodCount;
  const totalFixesCount = allTips.filter((t) => t.type === "improve").length + atsImproveCount;

  // Rating descriptors
  const getRatingInfo = (score: number) => {
    if (score >= 80) {
      return {
        label: "Interview Ready",
        status: "Exceptional",
        color: "text-emerald-700 dark:text-emerald-400",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
        border: "border-emerald-500",
      };
    }
    if (score >= 65) {
      return {
        label: "Competitive Baseline",
        status: "Good Start",
        color: "text-amber-700 dark:text-amber-400",
        badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
        border: "border-amber-500",
      };
    }
    return {
      label: "Needs Optimization",
      status: "Revision Needed",
      color: "text-rose-700 dark:text-rose-400",
      badgeBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
      border: "border-rose-500",
    };
  };

  const overallRating = getRatingInfo(overallScore);
  const atsRating = getRatingInfo(atsScore);

  // Copy full executive audit to clipboard
  const handleCopyAudit = async () => {
    const summaryText = `RESUME GENIE - ATS & RESUME AUDIT
Target Role: ${jobTitle}
Company: ${companyName}
Overall Score: ${overallScore}/100 (${overallRating.label})
ATS Compatibility: ${atsScore}/100 (${atsRating.label})

PILLAR SCORES:
- Tone & Style: ${toneScore}/100
- Content Impact: ${contentScore}/100
- Structure & Layout: ${structureScore}/100
- Skills Alignment: ${skillsScore}/100

CRITICAL ATS RECOMMENDATIONS:
${(feedback?.ATS?.tips || [])
  .map((t) => `• [${t.type === "good" ? "PASS" : "WARN"}] ${t.tip}`)
  .join("\n")}

PRIORITY ACTION ITEMS:
${allTips
  .filter((t) => t.type === "improve")
  .slice(0, 5)
  .map((t) => `• ${t.category}: ${t.tip} - ${t.explanation || ""}`)
  .join("\n")}
`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. TOP EXECUTIVE APP BAR (Breadcrumb + Controls) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-1 min-w-0">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Resumes
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs">
              {companyName}
            </span>
          </nav>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {jobTitle}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{companyName}</span>
              <span aria-hidden="true">·</span>
              <span>AI Evaluation Complete</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Workspace Layout Switcher (Desktop) */}
          <div className="hidden lg:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setWorkspaceMode("split")}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                workspaceMode === "split"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Split View: Document on left, Dashboard on right"
            >
              <FaColumns className="w-3 h-3" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode("full")}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                workspaceMode === "full"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Full Dashboard: Maximize analytics view"
            >
              <FaExpand className="w-3 h-3" />
              <span>Full Dashboard</span>
            </button>
          </div>

          {/* Quick Actions */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Export or Print Report"
          >
            <AiOutlinePrinter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Export Report</span>
          </button>

          {onToggleComparison && (
            <button
              type="button"
              onClick={onToggleComparison}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Compare with previous versions"
            >
              <FaBalanceScale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Compare</span>
              {historyCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              title="Re-run AI Analysis"
            >
              <AiOutlineReload className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin text-amber-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">{isRetrying ? "Re-analyzing..." : "Re-analyze"}</span>
            </button>
          )}

          <Link
            to="/upload"
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium transition-colors shadow-xs"
          >
            + Upload New
          </Link>
        </div>
      </header>

      {/* 2. EXECUTIVE KPI METRIC RIBBON (Tabular figures, high-density single elevation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Score */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall Resume Score
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${overallRating.badgeBg}`}>
              {overallRating.status}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {overallScore}
            </span>
            <span className="text-xs font-mono text-slate-400">/100</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallScore >= 80 ? "bg-emerald-500" : overallScore >= 65 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Market Benchmark</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{overallRating.label}</span>
          </div>
        </div>

        {/* KPI 2: ATS Scanner Readiness */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              ATS Compatibility
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${atsRating.badgeBg}`}>
              {atsRating.status}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {atsScore}
            </span>
            <span className="text-xs font-mono text-slate-400">/100</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                atsScore >= 80 ? "bg-emerald-500" : atsScore >= 65 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${atsScore}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Scanner Audits</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {atsGoodCount} passed · {atsImproveCount} warnings
            </span>
          </div>
        </div>

        {/* KPI 3: Four Evaluation Pillars Average */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pillar Balance
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
              4 Categories
            </span>
          </div>

          <div className="my-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Tone:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">{toneScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Content:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">{contentScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Structure:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">{structureScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Skills:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">{skillsScore}</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Strongest Pillar</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {toneScore >= contentScore && toneScore >= structureScore && toneScore >= skillsScore
                ? "Tone & Style"
                : contentScore >= structureScore && contentScore >= skillsScore
                ? "Content Quality"
                : structureScore >= skillsScore
                ? "Structure & Layout"
                : "Skills & Keywords"}
            </span>
          </div>
        </div>

        {/* KPI 4: Action Items Distribution */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Actionable Insights
            </span>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
              +{totalFixesCount > 0 ? "14-22" : "0"} Potential pts
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {totalFixesCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">priority fixes recommended</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <FaCheckCircle className="w-3 h-3" />
              <span>{totalStrengthsCount} Validated Strengths</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("feedback")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Review all →
            </button>
          </div>
        </div>
      </div>

      {/* 3. SEGMENTED DASHBOARD VIEW TABS */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FaChartPie className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Executive Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ats")}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "ats"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FaTasks className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>ATS Scanner & Keywords</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
            {atsScore}%
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "feedback"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FaListUl className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Feedback & Action Plan</span>
          {totalFixesCount > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
              {totalFixesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("growth")}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "growth"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FaRocket className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Career Growth & Skills</span>
        </button>

        {previewUrl && (
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FaFileAlt className="w-3.5 h-3.5 text-slate-500" />
            <span>Document Preview</span>
          </button>
        )}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Quick Wins Banner */}
          <div className="p-4 sm:p-5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                <FaRegLightbulb className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Executive Recommendation
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Your resume has solid foundational qualifications ({overallScore}/100). Addressing{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {totalFixesCount} high-leverage bullet points
                  </span>{" "}
                  can significantly boost recruiter callback rates for {jobTitle}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("feedback")}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Implement Fixes</span>
              <FaArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Visual Score Radar & Pillars Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Radar / Dimension Chart (7 cols) */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Evaluation Radar by Category
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Comparison vs Industry Baseline
                </span>
              </div>
              <ATSScoreBreakdownChart feedback={feedback} />
            </div>

            {/* Pillar Breakdown Cards (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Core Category Performance
              </h3>

              {/* Tone & Style */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Tone & Style</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Action verbs, tense consistency, and executive polish
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {toneScore}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/100</span>
                </div>
              </div>

              {/* Content Quality */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Content Impact</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Measurable metrics, business value, results orientation
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {contentScore}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/100</span>
                </div>
              </div>

              {/* Structure & Layout */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Structure & Formatting</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Section order, typography hierarchy, ATS scan flow
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {structureScore}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/100</span>
                </div>
              </div>

              {/* Skills & Competencies */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Skills & Keywords</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target keyword density, modern framework matches
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {skillsScore}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Strengths vs Vulnerabilities Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Column */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <FaCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                  Validated Strengths ({allTips.filter((t) => t.type === "good").length})
                </h3>
              </div>
              <div className="space-y-3">
                {allTips
                  .filter((t) => t.type === "good")
                  .slice(0, 4)
                  .map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-100 dark:border-emerald-800/40"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                          {tip.category}
                        </span>
                        <span className="text-[10px] text-slate-400">Effective</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        {tip.tip}
                      </p>
                      {tip.explanation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {tip.explanation}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Vulnerabilities Column */}
            <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <FaExclamationTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">
                  Priority Vulnerabilities ({allTips.filter((t) => t.type === "improve").length})
                </h3>
              </div>
              <div className="space-y-3">
                {allTips
                  .filter((t) => t.type === "improve")
                  .slice(0, 4)
                  .map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-rose-100 dark:border-rose-800/40"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-rose-800 dark:text-rose-300">
                          {tip.category}
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          High Priority
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        {tip.tip}
                      </p>
                      {tip.explanation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {tip.explanation}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATS SCANNER & KEYWORDS */}
      {activeTab === "ats" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Detailed ATS Scanner Card */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>ATS Scanner Audit</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${atsRating.badgeBg}`}>
                    {atsScore}% Pass Rate
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Simulating automated candidate filtering engines (Workday, Greenhouse, Taleo, Lever)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                    {atsScore}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/100</span>
                </div>
              </div>
            </div>

            {/* ATS Findings List */}
            <div className="mt-5 space-y-3">
              {(feedback?.ATS?.tips || []).map((tip, index) => (
                <div
                  key={index}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                    tip.type === "good"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                      : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                  }`}
                >
                  <img
                    src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                    alt={tip.type}
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                  />
                  <div className="space-y-0.5">
                    <p
                      className={`text-xs sm:text-sm font-semibold ${
                        tip.type === "good"
                          ? "text-emerald-900 dark:text-emerald-200"
                          : "text-amber-900 dark:text-amber-200"
                      }`}
                    >
                      {tip.tip}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tip.type === "good"
                        ? "Complies with standard applicant parsing grammars."
                        : "Applicant tracking algorithms may penalize or miss information here."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Job Keyword Matcher */}
          <JobKeywordMatcher
            jobDescription={jobDescription}
            jobTitle={jobTitle}
            companyName={companyName}
            feedback={feedback}
          />
        </div>
      )}

      {/* TAB 3: FEEDBACK & ACTION PLAN */}
      {activeTab === "feedback" && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-300">
          {/* Sub-view switcher (Interactive Action Cards vs Category Accordion) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFeedbackViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  feedbackViewMode === "cards"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <FaTasks className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Action Task Engine</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackViewMode("breakdown")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  feedbackViewMode === "breakdown"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <FaListUl className="w-3 h-3 text-slate-500" />
                <span>Pillar Breakdown</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
              {totalFixesCount} Improvements Recommended
            </span>
          </div>

          {feedbackViewMode === "cards" ? (
            <ResumeActionSuggestions
              feedback={feedback}
              resumeId={resumeId}
              jobTitle={jobTitle}
              companyName={companyName}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Category Segmented Filter */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1">
                {(
                  [
                    { id: "all", label: "All Pillars" },
                    { id: "tone", label: "Tone & Style" },
                    { id: "content", label: "Content Impact" },
                    { id: "structure", label: "Structure" },
                    { id: "skills", label: "Skills" },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      activeCategoryTab === cat.id
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Accordion Views */}
              <Accordion>
                {(activeCategoryTab === "all" || activeCategoryTab === "tone") && (
                  <AccordionItem id="tone-style">
                    <AccordionHeader itemId="tone-style">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">
                          Tone & Professional Style
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
                          {toneScore}/100
                        </span>
                      </div>
                    </AccordionHeader>
                    <AccordionContent itemId="tone-style">
                      <div className="space-y-3 pt-2">
                        {feedback.toneAndStyle.tips.map((tip, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              tip.type === "good"
                                ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                                : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{tip.tip}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{tip.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {(activeCategoryTab === "all" || activeCategoryTab === "content") && (
                  <AccordionItem id="content">
                    <AccordionHeader itemId="content">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">
                          Content Impact & Measurable Metrics
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
                          {contentScore}/100
                        </span>
                      </div>
                    </AccordionHeader>
                    <AccordionContent itemId="content">
                      <div className="space-y-3 pt-2">
                        {feedback.content.tips.map((tip, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              tip.type === "good"
                                ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                                : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{tip.tip}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{tip.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {(activeCategoryTab === "all" || activeCategoryTab === "structure") && (
                  <AccordionItem id="structure">
                    <AccordionHeader itemId="structure">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">
                          Structure, Sections & Layout
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
                          {structureScore}/100
                        </span>
                      </div>
                    </AccordionHeader>
                    <AccordionContent itemId="structure">
                      <div className="space-y-3 pt-2">
                        {feedback.structure.tips.map((tip, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              tip.type === "good"
                                ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                                : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{tip.tip}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{tip.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {(activeCategoryTab === "all" || activeCategoryTab === "skills") && (
                  <AccordionItem id="skills">
                    <AccordionHeader itemId="skills">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">
                          Technical & Industry Skills
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
                          {skillsScore}/100
                        </span>
                      </div>
                    </AccordionHeader>
                    <AccordionContent itemId="skills">
                      <div className="space-y-3 pt-2">
                        {feedback.skills.tips.map((tip, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              tip.type === "good"
                                ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                                : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{tip.tip}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{tip.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CAREER GROWTH & BENCHMARKS */}
      {activeTab === "growth" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <CareerGrowthAdviceModule
            resumeId={resumeId}
            jobTitle={jobTitle}
            companyName={companyName}
            initialAdvice={(feedback as any)?.careerGrowth || null}
          />
        </div>
      )}

      {/* TAB 5: DOCUMENT PREVIEW */}
      {activeTab === "preview" && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          {previewUrl ? (
            <div className="w-full max-w-4xl p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col items-center">
              <img
                src={previewUrl}
                alt="Uploaded resume document"
                className="w-full h-auto max-h-[82vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <FaFileAlt className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-medium">Document preview not stored for this session.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. EXPORT & PRINT REPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Export Resume Analysis Report
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate a client-ready audit summary for recruiters or career coaches
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Quick summary view */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">AUDIT TARGET:</span>
                <span>{jobTitle} @ {companyName}</span>
              </div>
              <div className="flex justify-between">
                <span>OVERALL QUALITY SCORE:</span>
                <span className="font-bold text-slate-900 dark:text-white">{overallScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span>ATS COMPATIBILITY RATING:</span>
                <span className="font-bold text-slate-900 dark:text-white">{atsScore}/100 ({atsRating.label})</span>
              </div>
              <div className="flex justify-between">
                <span>PRIORITY ACTION ITEMS:</span>
                <span className="font-bold text-amber-600">{totalFixesCount} High-Impact Suggestions</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyAudit}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <AiOutlineCopy className="w-4 h-4 text-slate-500" />
                <span>{copiedSummary ? "Copied to Clipboard!" : "Copy Text Summary"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <AiOutlinePrinter className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysisDashboard;
