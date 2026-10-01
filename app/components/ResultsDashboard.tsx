import React, { useState, useMemo } from "react";
import {
  AiOutlineSearch,
  AiOutlineCheck,
  AiOutlineCopy,
  AiOutlineFilePdf,
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineInfoCircle,
  AiOutlineReload,
  AiOutlineDownload,
  AiOutlineFilter,
} from "react-icons/ai";
import {
  FaCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaTasks,
  FaChartBar,
  FaLayerGroup,
  FaBriefcase,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaCode,
  FaLightbulb,
} from "react-icons/fa";
import { ScoreMeter } from "./ScoreMeter";
import { exportResumeAnalysisToPDF } from "~/lib/pdfExport";
import Swal from "sweetalert2";

export interface TipItem {
  id: string;
  category: "ATS Compatibility" | "Tone & Style" | "Content Impact" | "Structure & Layout" | "Skills & Keywords";
  categoryKey: "ATS" | "toneAndStyle" | "content" | "structure" | "skills";
  type: "good" | "improve";
  tip: string;
  explanation?: string;
  recommendation?: string;
  score?: number;
}

export interface ResultsDashboardProps {
  /**
   * The parsed data from the backend. Can be:
   * 1. Direct feedback object (Feedback)
   * 2. Full backend upload payload: { success: boolean, fileName: string, charCount: number, pageCount: number, extractedText: string, feedback: Feedback }
   * 3. Stored resume object: { id: string, feedback: Feedback, companyName?: string, jobTitle?: string, ... }
   */
  data?: any;
  /** Explicit feedback object if not passed via `data` */
  feedback?: Feedback | null;
  /** Name of the uploaded file */
  fileName?: string;
  /** Extracted character count from backend */
  charCount?: number;
  /** Page count from backend pdf-parse */
  pageCount?: number;
  /** Raw extracted text from backend pdf-parse */
  extractedText?: string;
  /** Target company name */
  companyName?: string;
  /** Target job title */
  jobTitle?: string;
  /** Target job description */
  jobDescription?: string;
  /** Callback to trigger re-analysis */
  onRetry?: () => void;
  /** Whether analysis is currently re-running */
  isRetrying?: boolean;
  /** Optional custom CSS classes */
  className?: string;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  data,
  feedback: propFeedback,
  fileName: propFileName,
  charCount: propCharCount,
  pageCount: propPageCount,
  extractedText: propExtractedText,
  companyName: propCompanyName,
  jobTitle: propJobTitle,
  jobDescription: propJobDescription,
  onRetry,
  isRetrying = false,
  className = "",
}) => {
  // Normalize data from backend payload or direct props
  const resolvedFeedback: Feedback | null = useMemo(() => {
    if (propFeedback) return propFeedback;
    if (!data) return null;
    if (data.feedback && typeof data.feedback === "object") return data.feedback;
    if (data.ATS && (data.toneAndStyle || data.content || data.structure || data.skills)) {
      return data as Feedback;
    }
    return null;
  }, [data, propFeedback]);

  const fileName = propFileName || data?.fileName || data?.name || "Uploaded Resume.pdf";
  const charCount = propCharCount ?? data?.charCount ?? (data?.extractedText ? data.extractedText.length : undefined);
  const pageCount = propPageCount ?? data?.pageCount ?? 1;
  const extractedText = propExtractedText || data?.extractedText || "";
  const companyName = propCompanyName || data?.companyName || "Target Company";
  const jobTitle = propJobTitle || data?.jobTitle || "Target Role";
  const jobDescription = propJobDescription || data?.jobDescription || "";

  // View state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "improve" | "good">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [copiedTipId, setCopiedTipId] = useState<string | null>(null);
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!resolvedFeedback) return;
    setIsExportingPdf(true);
    try {
      await exportResumeAnalysisToPDF({
        resumeId: data?.id || "analysis",
        feedback: resolvedFeedback,
        companyName,
        jobTitle,
        jobDescription,
      });
      Swal.fire({
        title: "Report Downloaded!",
        text: "Your resume analysis & ATS compliance report has been exported successfully.",
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("PDF export error:", err);
      Swal.fire({
        title: "Export Failed",
        text: "Could not generate PDF report. Please try again.",
        icon: "error",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Scores
  const atsScore = resolvedFeedback?.ATS?.score ?? 0;
  const overallScore = resolvedFeedback?.overallScore ?? atsScore;

  // Flatten and categorize all feedback tips from backend
  const allTips = useMemo(() => {
    if (!resolvedFeedback) return [];
    const list: TipItem[] = [];

    // 1. ATS Tips
    (resolvedFeedback.ATS?.tips || []).forEach((t, i) => {
      list.push({
        id: `ats-${i}`,
        category: "ATS Compatibility",
        categoryKey: "ATS",
        type: t.type,
        tip: t.tip,
        score: resolvedFeedback.ATS?.score,
        explanation:
          t.type === "good"
            ? "Your formatting cleanly adheres to standard Applicant Tracking System parser specifications."
            : "Applicant Tracking Systems (ATS) may struggle to parse or may penalize this section.",
        recommendation:
          t.type === "improve"
            ? "Use standard section headings ('Experience', 'Education', 'Skills'), plain bullet characters, and standard dates."
            : undefined,
      });
    });

    // 2. Tone & Style
    (resolvedFeedback.toneAndStyle?.tips || []).forEach((t, i) => {
      list.push({
        id: `tone-${i}`,
        category: "Tone & Style",
        categoryKey: "toneAndStyle",
        type: t.type,
        tip: t.tip,
        score: resolvedFeedback.toneAndStyle?.score,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Begin bullet points with active power verbs ('Spearheaded', 'Engineered', 'Optimized') and eliminate passive voice."
            : undefined,
      });
    });

    // 3. Content Impact
    (resolvedFeedback.content?.tips || []).forEach((t, i) => {
      list.push({
        id: `content-${i}`,
        category: "Content Impact",
        categoryKey: "content",
        type: t.type,
        tip: t.tip,
        score: resolvedFeedback.content?.score,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Apply the Google X-Y-Z formula: Accomplished [X], as measured by [Y], by doing [Z] with measurable metrics (%, $, time)."
            : undefined,
      });
    });

    // 4. Structure & Layout
    (resolvedFeedback.structure?.tips || []).forEach((t, i) => {
      list.push({
        id: `structure-${i}`,
        category: "Structure & Layout",
        categoryKey: "structure",
        type: t.type,
        tip: t.tip,
        score: resolvedFeedback.structure?.score,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Ensure consistent chronological order, clean margins (0.5 - 0.75 in), and concise 1-2 line bullet points."
            : undefined,
      });
    });

    // 5. Skills & Keywords
    (resolvedFeedback.skills?.tips || []).forEach((t, i) => {
      list.push({
        id: `skills-${i}`,
        category: "Skills & Keywords",
        categoryKey: "skills",
        type: t.type,
        tip: t.tip,
        score: resolvedFeedback.skills?.score,
        explanation: t.explanation,
        recommendation:
          t.type === "improve"
            ? "Integrate industry-standard keywords and job requirements verbatim in your skills and experience sections."
            : undefined,
      });
    });

    return list;
  }, [resolvedFeedback]);

  // Filtered tips
  const filteredTips = useMemo(() => {
    return allTips.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.categoryKey !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && item.type !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTip = item.tip.toLowerCase().includes(query);
        const matchesExplanation = (item.explanation || "").toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesTip && !matchesExplanation && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [allTips, selectedCategory, selectedStatus, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    const improveCount = allTips.filter((t) => t.type === "improve").length;
    const goodCount = allTips.filter((t) => t.type === "good").length;
    return {
      total: allTips.length,
      improve: improveCount,
      good: goodCount,
      atsTotal: allTips.filter((t) => t.categoryKey === "ATS").length,
      atsImprove: allTips.filter((t) => t.categoryKey === "ATS" && t.type === "improve").length,
      atsGood: allTips.filter((t) => t.categoryKey === "ATS" && t.type === "good").length,
    };
  }, [allTips]);

  // Categories config with individual backend scores
  const categoryTabs = [
    {
      key: "all",
      label: "All Findings",
      score: overallScore,
      count: allTips.length,
      improveCount: counts.improve,
    },
    {
      key: "ATS",
      label: "ATS Compatibility",
      score: resolvedFeedback?.ATS?.score ?? 0,
      count: allTips.filter((t) => t.categoryKey === "ATS").length,
      improveCount: allTips.filter((t) => t.categoryKey === "ATS" && t.type === "improve").length,
    },
    {
      key: "toneAndStyle",
      label: "Tone & Style",
      score: resolvedFeedback?.toneAndStyle?.score ?? 0,
      count: allTips.filter((t) => t.categoryKey === "toneAndStyle").length,
      improveCount: allTips.filter((t) => t.categoryKey === "toneAndStyle" && t.type === "improve").length,
    },
    {
      key: "content",
      label: "Content Impact",
      score: resolvedFeedback?.content?.score ?? 0,
      count: allTips.filter((t) => t.categoryKey === "content").length,
      improveCount: allTips.filter((t) => t.categoryKey === "content" && t.type === "improve").length,
    },
    {
      key: "structure",
      label: "Structure & Layout",
      score: resolvedFeedback?.structure?.score ?? 0,
      count: allTips.filter((t) => t.categoryKey === "structure").length,
      improveCount: allTips.filter((t) => t.categoryKey === "structure" && t.type === "improve").length,
    },
    {
      key: "skills",
      label: "Skills & Keywords",
      score: resolvedFeedback?.skills?.score ?? 0,
      count: allTips.filter((t) => t.categoryKey === "skills").length,
      improveCount: allTips.filter((t) => t.categoryKey === "skills" && t.type === "improve").length,
    },
  ];

  const handleCopyTip = (item: TipItem) => {
    const textToCopy = `[${item.category}] ${item.tip}\n${item.explanation ? `\nWhy: ${item.explanation}` : ""}${
      item.recommendation ? `\nAction: ${item.recommendation}` : ""
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTipId(item.id);
    setTimeout(() => setCopiedTipId(null), 2000);
  };

  const handleCopyRawText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  if (!resolvedFeedback) {
    return (
      <div className={`p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <AiOutlineInfoCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Parsed Data Available</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
          Please upload and parse a PDF resume file to view ATS scoring and categorized feedback.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <AiOutlineReload className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Processing..." : "Retry Analysis"}</span>
          </button>
        )}
      </div>
    );
  }

  // ATS Theme and status
  const getAtsStatusBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: "ATS Ready (High Pass Rate)",
        badgeClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        description: "Your resume structure, keywords, and typography conform strictly to automated applicant tracking systems.",
      };
    }
    if (score >= 60) {
      return {
        label: "Moderate ATS Risk",
        badgeClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        description: "Your resume parses successfully, but lacks optimal keyword density or standard section structure.",
      };
    }
    return {
      label: "High ATS Rejection Risk",
      badgeClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      description: "Format anomalies or missing standard headers may cause automated ATS parsers to misread or drop your application.",
    };
  };

  const atsStatus = getAtsStatusBadge(atsScore);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. DOCUMENT & BACKEND EXTRACTION METADATA HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <AiOutlineFilePdf className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {fileName}
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Backend Parsed
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                {companyName && (
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <FaBuilding className="w-3 h-3 text-slate-400" />
                    {companyName}
                  </span>
                )}
                {jobTitle && (
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <FaBriefcase className="w-3 h-3 text-slate-400" />
                    {jobTitle}
                  </span>
                )}
                {charCount !== undefined && (
                  <span className="font-mono text-slate-500">
                    {charCount.toLocaleString()} chars
                  </span>
                )}
                {pageCount > 0 && (
                  <span className="font-mono text-slate-500">
                    {pageCount} {pageCount === 1 ? "page" : "pages"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {resolvedFeedback && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-3.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                title="Download PDF feedback and ATS report"
              >
                <AiOutlineDownload className={`w-3.5 h-3.5 ${isExportingPdf ? "animate-bounce" : "text-amber-600 dark:text-amber-400"}`} />
                <span>{isExportingPdf ? "Exporting PDF..." : "Export PDF Report"}</span>
              </button>
            )}
            {extractedText && (
              <button
                type="button"
                onClick={() => setShowExtractedText((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View the raw text parsed by backend pdf-parse"
              >
                <FaCode className="w-3 h-3 text-slate-400" />
                <span>{showExtractedText ? "Hide Parsed Text" : "Inspect Parsed Text"}</span>
              </button>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <AiOutlineReload className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                <span>{isRetrying ? "Analyzing..." : "Re-Analyze"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Raw Text Inspector */}
        {showExtractedText && extractedText && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Raw Extracted Text (passed to Gemini API for analysis):
              </span>
              <button
                type="button"
                onClick={handleCopyRawText}
                className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedRawText ? (
                  <>
                    <AiOutlineCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <AiOutlineCopy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-all">
              {extractedText}
            </div>
          </div>
        )}
      </div>

      {/* 2. ATS SCORE METER HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ATS Score Radial Meter Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>ATS Compatibility Meter</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Automated Scanner
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates algorithmic parsing readability and keyword indexing
              </p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${atsStatus.badgeClass}`}>
              {atsStatus.label}
            </span>
          </div>

          {/* Interactive Meter */}
          <div className="py-2 flex flex-col items-center justify-center">
            <ScoreMeter
              score={atsScore}
              label="ATS Score"
              size="lg"
              showNeedle={true}
              showSubcategories={false}
            />
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 max-w-md mt-1">
              {atsStatus.description}
            </p>
          </div>

          {/* ATS Mini Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Total ATS Checks
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                {counts.atsTotal}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <span className="block text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Passed Checks
              </span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                {counts.atsGood}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
              <span className="block text-[11px] font-medium text-rose-700 dark:text-rose-400">
                Action Items
              </span>
              <span className="text-sm font-bold text-rose-700 dark:text-rose-300 mt-0.5 block">
                {counts.atsImprove}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Score & 5 Pillars Summary Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                5-Pillar Executive Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI evaluation calibrated against {jobTitle} benchmark
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Overall Composite</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {overallScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          {/* Pillars List */}
          <div className="space-y-3.5 py-3">
            {[
              { label: "ATS Compatibility", score: resolvedFeedback.ATS?.score ?? 0, key: "ATS" },
              { label: "Tone & Style", score: resolvedFeedback.toneAndStyle?.score ?? 0, key: "toneAndStyle" },
              { label: "Content Impact", score: resolvedFeedback.content?.score ?? 0, key: "content" },
              { label: "Structure & Layout", score: resolvedFeedback.structure?.score ?? 0, key: "structure" },
              { label: "Skills & Keywords", score: resolvedFeedback.skills?.score ?? 0, key: "skills" },
            ].map((pillar) => {
              const scoreVal = pillar.score;
              const colorClass =
                scoreVal >= 80 ? "bg-emerald-500" : scoreVal >= 60 ? "bg-amber-500" : "bg-rose-500";
              const textClass =
                scoreVal >= 80
                  ? "text-emerald-600 dark:text-emerald-400"
                  : scoreVal >= 60
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400";

              return (
                <div key={pillar.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{pillar.label}</span>
                    <span className={`font-mono font-bold ${textClass}`}>{scoreVal}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                      style={{ width: `${Math.max(5, Math.min(100, scoreVal))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Actionable findings: <strong className="text-rose-600 dark:text-rose-400">{counts.improve} improvements</strong>
            </span>
            <span>
              Confirmed strengths: <strong className="text-emerald-600 dark:text-emerald-400">{counts.good} passed</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. CATEGORIZED FEEDBACK LISTS SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FaTasks className="w-4 h-4 text-amber-500" />
              <span>Categorized Feedback Lists</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specific, actionable recommendations categorized across critical resume dimensions
            </p>
          </div>

          {/* Status Filter Badges (All / Improve / Good) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatus === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("improve")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === "improve"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <AiOutlineWarning className="w-3.5 h-3.5 text-rose-500" />
              <span>Needs Work ({counts.improve})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("good")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === "good"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <AiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Strengths ({counts.good})</span>
            </button>
          </div>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="space-y-4">
          {/* Scrollable Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categoryTabs.map((tab) => {
              const isSelected = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected
                        ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900 font-bold"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                  {tab.improveCount > 0 && !isSelected && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title={`${tab.improveCount} issues`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <AiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback items (e.g., 'keywords', 'verbs', 'margins', 'metrics')..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Feedback Cards List */}
        <div className="space-y-3.5">
          {filteredTips.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No feedback items match your selected category, status, or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredTips.map((item) => {
              const isImprove = item.type === "improve";
              const isCopied = copiedTipId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isImprove
                      ? "bg-rose-50/30 dark:bg-rose-950/15 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-800"
                      : "bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Status Icon */}
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isImprove
                            ? "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isImprove ? (
                          <FaExclamationTriangle className="w-3 h-3" />
                        ) : (
                          <FaCheck className="w-3 h-3" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              isImprove
                                ? "bg-rose-100/70 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                : "bg-emerald-100/70 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            {isImprove ? "Improvement" : "Strength"}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {item.category}
                          </span>
                        </div>

                        {/* Tip Headline */}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {item.tip}
                        </h4>

                        {/* Explanation */}
                        {item.explanation && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                            {item.explanation}
                          </p>
                        )}

                        {/* Action Recommendation */}
                        {item.recommendation && (
                          <div className="mt-2 p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                            <FaLightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white mr-1">
                                Recommended Action:
                              </span>
                              <span>{item.recommendation}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Copy action */}
                    <button
                      type="button"
                      onClick={() => handleCopyTip(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                      title="Copy recommendation"
                    >
                      {isCopied ? (
                        <AiOutlineCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AiOutlineCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
