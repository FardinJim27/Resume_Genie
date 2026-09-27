import React, { useState, useEffect } from "react";
import {
  FaRocket,
  FaChartLine,
  FaLightbulb,
  FaRoad,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCopy,
  FaCheck,
  FaSyncAlt,
  FaCompass,
  FaCoins,
  FaGraduationCap,
  FaBriefcase,
  FaLayerGroup,
  FaArrowRight,
  FaFilter,
  FaBolt,
} from "react-icons/fa";
import { useApiStore, type CareerGrowthAdvice } from "~/lib/api";

interface CareerGrowthAdviceModuleProps {
  resumeId: string;
  jobTitle?: string;
  companyName?: string;
  initialAdvice?: CareerGrowthAdvice | null;
  className?: string;
}

const PRESET_GOALS = [
  "Senior Full-Stack Engineer",
  "Engineering Manager / Tech Lead",
  "AI / ML Solutions Engineer",
  "Cloud Solutions Architect",
  "DevOps & Platform Specialist",
];

export default function CareerGrowthAdviceModule({
  resumeId,
  jobTitle = "",
  companyName = "",
  initialAdvice = null,
  className = "",
}: CareerGrowthAdviceModuleProps) {
  const { getCareerGrowthAdvice } = useApiStore();

  const [advice, setAdvice] = useState<CareerGrowthAdvice | null>(initialAdvice);
  const [loading, setLoading] = useState<boolean>(!initialAdvice);
  const [error, setError] = useState<string | null>(null);

  // Active sub-tab inside module
  const [activeTab, setActiveTab] = useState<
    "skills" | "roadmap" | "pivots" | "playbook"
  >("skills");

  // Target role customizations
  const [targetRole, setTargetRole] = useState<string>(jobTitle || "");
  const [isCustomizingRole, setIsCustomizingRole] = useState<boolean>(false);
  const [customRoleInput, setCustomRoleInput] = useState<string>("");

  // Skill filter
  const [skillFilter, setSkillFilter] = useState<
    "all" | "gap" | "recommended" | "detected"
  >("all");

  // Copied bullet state tracker
  const [copiedBullet, setCopiedBullet] = useState<string | null>(null);

  // Track checked strategic advice items in local storage
  const [checkedAdvice, setCheckedAdvice] = useState<Record<string, boolean>>(
    {},
  );

  // Load advice on mount if not provided
  useEffect(() => {
    if (initialAdvice) {
      setAdvice(initialAdvice);
      setLoading(false);
      return;
    }

    if (!resumeId) return;

    let isMounted = true;
    const fetchAdvice = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCareerGrowthAdvice(resumeId, {
          targetRole: jobTitle || undefined,
        });
        if (isMounted) {
          if (result) {
            setAdvice(result);
          } else {
            setError("Unable to generate career advice at this time.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load career advice");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdvice();

    return () => {
      isMounted = false;
    };
  }, [resumeId, initialAdvice]);

  // Load checked strategic advice items from localStorage
  useEffect(() => {
    if (!resumeId) return;
    try {
      const saved = localStorage.getItem(`resume_genie_advice_${resumeId}`);
      if (saved) {
        setCheckedAdvice(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, [resumeId]);

  const toggleAdviceCheck = (title: string) => {
    const updated = { ...checkedAdvice, [title]: !checkedAdvice[title] };
    setCheckedAdvice(updated);
    try {
      localStorage.setItem(
        `resume_genie_advice_${resumeId}`,
        JSON.stringify(updated),
      );
    } catch {
      // Ignore storage errors
    }
  };

  const handleCopyBullet = (bullet: string) => {
    navigator.clipboard.writeText(bullet);
    setCopiedBullet(bullet);
    setTimeout(() => setCopiedBullet(null), 2500);
  };

  const handleRefreshAdvice = async (customRole?: string) => {
    if (!resumeId) return;
    setLoading(true);
    setError(null);
    try {
      const roleToUse = customRole || targetRole || jobTitle || undefined;
      const result = await getCareerGrowthAdvice(resumeId, {
        targetRole: roleToUse,
        refresh: true,
      });
      if (result) {
        setAdvice(result);
        if (roleToUse) setTargetRole(roleToUse);
      } else {
        setError("Failed to refresh career growth advice.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to refresh advice");
    } finally {
      setLoading(false);
      setIsCustomizingRole(false);
    }
  };

  // Filter skills based on status
  const allSkillCategories = advice?.industryStandardSkills || [];
  const filteredSkillCategories = allSkillCategories
    .map((cat) => ({
      ...cat,
      skills: cat.skills.filter((s) => {
        if (skillFilter === "all") return true;
        return s.status === skillFilter;
      }),
    }))
    .filter((cat) => cat.skills.length > 0);

  const totalSkillsCount = allSkillCategories.reduce(
    (acc, cat) => acc + cat.skills.length,
    0,
  );
  const detectedSkillsCount = allSkillCategories.reduce(
    (acc, cat) =>
      acc + cat.skills.filter((s) => s.status === "detected").length,
    0,
  );
  const gapSkillsCount = allSkillCategories.reduce(
    (acc, cat) => acc + cat.skills.filter((s) => s.status === "gap").length,
    0,
  );

  return (
    <div
      className={`w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-lg overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Module Header Banner */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
        {/* Subtle background circuit / grid glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-xs">
                <FaRocket className="w-3 h-3 text-blue-300" />
                AI Career Strategist
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/20 text-amber-200 border border-amber-300/30">
                <FaBolt className="w-2.5 h-2.5 text-amber-300" />
                Gemini 3.8
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Career Growth & Industry Skill Radar
            </h3>
            <p className="text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Personalized roadmap, competitive skill gap breakdown, and hiring
              playbook tailored to your resume
              {jobTitle ? (
                <>
                  {" "}
                  for{" "}
                  <span className="font-semibold text-white underline decoration-blue-400 underline-offset-2">
                    {targetRole || jobTitle}
                  </span>
                </>
              ) : null}
              {companyName ? ` at ${companyName}` : ""}.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsCustomizingRole(!isCustomizingRole)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <FaCompass className="w-3.5 h-3.5 text-blue-300" />
              <span>
                {isCustomizingRole ? "Close Target" : "Target Specific Role"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleRefreshAdvice()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              title="Re-run AI growth analysis"
            >
              <FaSyncAlt
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          </div>
        </div>

        {/* Target Role Selector Drawer */}
        {isCustomizingRole && (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
              Tailor Growth Analysis to a Target Role
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_GOALS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setCustomRoleInput(preset);
                    handleRefreshAdvice(preset);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    (customRoleInput || targetRole) === preset
                      ? "bg-blue-500 text-white shadow-xs font-bold"
                      : "bg-white/10 text-white/90 hover:bg-white/20"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-lg">
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Or type custom title, e.g. Staff Security Engineer..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 text-white placeholder-blue-200/60 text-xs border border-white/20 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                disabled={loading || !customRoleInput.trim()}
                onClick={() => handleRefreshAdvice(customRoleInput.trim())}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-gray-900 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                Analyze
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading state skeleton */}
      {loading ? (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FaRocket className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              Synthesizing Career Intelligence...
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-md">
              Evaluating resume against current 2026 industry benchmarks,
              detecting skill gaps, and mapping high-velocity promotion
              milestones.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
            <FaExclamationTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => handleRefreshAdvice()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer hover:opacity-90"
          >
            Retry Generation
          </button>
        </div>
      ) : advice ? (
        <div>
          {/* Candidate Market & Salary Benchmark Grid */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Profile Level */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/60 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 flex items-center gap-1.5">
                  <FaBriefcase className="w-3 h-3 text-blue-500" />
                  Estimated Seniority
                </span>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  {advice.candidateProfile?.currentEstimatedLevel ||
                    "Mid-Level Professional"}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {advice.candidateProfile?.primarySpecialization ||
                    "Software Engineering"}
                </p>
              </div>

              {/* Market Demand */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/60 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 flex items-center gap-1.5">
                  <FaChartLine className="w-3 h-3 text-emerald-500" />
                  Market Demand
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    {advice.candidateProfile?.marketDemandRating || "High"}{" "}
                    Demand
                  </p>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {advice.candidateProfile?.salaryBenchmarkRange
                    ?.growthProjection || "Growing +15% YoY"}
                </p>
              </div>

              {/* Target Fit Score */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/60 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 flex items-center gap-1.5">
                  <FaCheckCircle className="w-3 h-3 text-indigo-500" />
                  Target Fit Match
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {advice.candidateProfile?.targetFitScore || 85}%
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {detectedSkillsCount} of {totalSkillsCount} Skills
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    style={{
                      width: `${advice.candidateProfile?.targetFitScore || 85}%`,
                    }}
                  />
                </div>
              </div>

              {/* Salary Benchmarks */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/60 shadow-xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 flex items-center gap-1.5">
                  <FaCoins className="w-3 h-3 text-amber-500" />
                  Industry Compensation
                </span>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  {advice.candidateProfile?.salaryBenchmarkRange
                    ?.medianAnnual || "$130k - $165k"}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate">
                  Top Tier:{" "}
                  {advice.candidateProfile?.salaryBenchmarkRange
                    ?.topTierAnnual || "$190k+"}
                </p>
              </div>
            </div>

            {/* Candidate Experience Synthesis Box */}
            {advice.candidateProfile?.experienceSummary && (
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed flex items-start gap-2.5">
                <span className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0 font-bold">
                  Profile Assessment:
                </span>
                <p>{advice.candidateProfile.experienceSummary}</p>
              </div>
            )}
          </div>

          {/* Module Sub-Tabs Navigation */}
          <div className="px-6 pt-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("skills")}
              className={`pb-3 px-1 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "skills"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <FaLayerGroup className="w-4 h-4" />
              <span>Industry Skill Suggestions</span>
              {gapSkillsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  {gapSkillsCount} Gaps
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("roadmap")}
              className={`pb-3 px-1 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "roadmap"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <FaRoad className="w-4 h-4" />
              <span>Career Growth Roadmap</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pivots")}
              className={`pb-3 px-1 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "pivots"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <FaCompass className="w-4 h-4" />
              <span>Career Pivot Paths</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("playbook")}
              className={`pb-3 px-1 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "playbook"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <FaLightbulb className="w-4 h-4" />
              <span>Strategic Hiring Playbook</span>
            </button>
          </div>

          {/* TAB 1: Industry Standard Skills & Gaps */}
          {activeTab === "skills" && (
            <div className="p-6 space-y-6 animate-in fade-in duration-200">
              {/* Filter pills */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1 mr-1">
                    <FaFilter className="w-3 h-3" /> Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSkillFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      skillFilter === "all"
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    All Skills ({totalSkillsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillFilter("gap")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      skillFilter === "gap"
                        ? "bg-rose-600 text-white font-bold"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    Identified Gaps ({gapSkillsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillFilter("detected")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      skillFilter === "detected"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                  >
                    Detected in Resume ({detectedSkillsCount})
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Tip: Copy suggested bullets directly into your resume to close
                  gaps.
                </p>
              </div>

              {/* Skills Category List */}
              <div className="space-y-6">
                {filteredSkillCategories.map((cat, catIdx) => (
                  <div key={catIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                        {cat.category}
                      </h4>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        ({cat.skills.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {cat.skills.map((skill, sIdx) => {
                        const isGap = skill.status === "gap";
                        const isDetected = skill.status === "detected";

                        return (
                          <div
                            key={sIdx}
                            className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
                              isGap
                                ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50"
                                : isDetected
                                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50"
                                  : "bg-white dark:bg-slate-800/60 border-gray-200 dark:border-slate-700/80"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h5 className="text-base font-bold text-gray-900 dark:text-white">
                                  {skill.name}
                                </h5>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                    isGap
                                      ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-700"
                                      : isDetected
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700"
                                        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700"
                                  }`}
                                >
                                  {isGap
                                    ? "Skill Gap to Bridge"
                                    : isDetected
                                      ? "Verified in Resume"
                                      : "Recommended Upgrade"}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                                  {skill.importance} Priority
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                  Relevance:
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                  {skill.relevanceScore}%
                                </span>
                              </div>
                            </div>

                            {/* Why it matters */}
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mb-3 leading-relaxed">
                              <span className="font-semibold text-gray-900 dark:text-slate-200">
                                Industry Demand:
                              </span>{" "}
                              {skill.marketReason}
                            </p>

                            {/* Learning Path */}
                            {skill.learningPath && (
                              <div className="mb-3 text-xs bg-white/70 dark:bg-slate-800/80 p-2.5 rounded-lg border border-gray-200/60 dark:border-slate-700/60 text-gray-700 dark:text-slate-300 flex items-start gap-2">
                                <FaGraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    Learning Roadmap:
                                  </span>{" "}
                                  {skill.learningPath}
                                </div>
                              </div>
                            )}

                            {/* Suggested Resume Bullet */}
                            {skill.suggestedResumeBullet && (
                              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                    <FaLightbulb className="w-3 h-3 text-amber-500" />
                                    Suggested Resume Bullet Point
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyBullet(
                                        skill.suggestedResumeBullet,
                                      )
                                    }
                                    className="px-2 py-0.5 rounded text-[11px] font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    {copiedBullet ===
                                    skill.suggestedResumeBullet ? (
                                      <>
                                        <FaCheck className="w-3 h-3 text-emerald-500" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaCopy className="w-3 h-3" />
                                        <span>Copy Bullet</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-800 dark:text-slate-200 italic font-mono bg-white/60 dark:bg-slate-900/50 p-2 rounded-md border border-blue-100 dark:border-blue-900/30">
                                  &ldquo;{skill.suggestedResumeBullet}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Phased Career Growth Roadmap */}
          {activeTab === "roadmap" && (
            <div className="p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    Milestone-Driven Execution Roadmap
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Step-by-step career progression targets structured across
                    immediate, medium, and strategic leadership phases.
                  </p>
                </div>
              </div>

              <div className="relative border-l-2 border-blue-300 dark:border-blue-900 ml-4 sm:ml-6 pl-4 sm:pl-8 space-y-8">
                {advice.growthRoadmap?.map((phase, pIdx) => (
                  <div key={pIdx} className="relative group">
                    {/* Circle timeline pin */}
                    <div className="absolute -left-[25px] sm:-left-[41px] top-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                      {pIdx + 1}
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-700/60 pb-3">
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {phase.timeline}
                          </span>
                          <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                            {phase.milestoneTitle}
                          </h5>
                        </div>
                      </div>

                      {/* Focus Areas Pills */}
                      {phase.focusAreas && phase.focusAreas.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-gray-400 dark:text-slate-400 mr-1">
                            Focus Areas:
                          </span>
                          {phase.focusAreas.map((area, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action items */}
                      <div className="space-y-2.5 pt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                          Recommended Action Items:
                        </span>
                        <div className="grid grid-cols-1 gap-2.5">
                          {phase.actionItems?.map((item, iIdx) => (
                            <div
                              key={iIdx}
                              className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200/70 dark:border-slate-700/60 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <FaArrowRight className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                  {item.action}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    item.priority === "critical"
                                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                                      : item.priority === "high"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                                  }`}
                                >
                                  {item.priority}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-slate-300 pl-4.5 leading-relaxed">
                                {item.rationale}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Career Pivot Paths */}
          {activeTab === "pivots" && (
            <div className="p-6 space-y-6 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  Viable Vertical & Lateral Career Progression Paths
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Alternative high-demand roles your current background maps to,
                  ranked by skill overlap and market opportunity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {advice.careerPivotPaths?.map((pivot, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {pivot.fitPercentage}% Skill Fit
                        </span>
                      </div>
                      <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                        {pivot.roleTitle}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                        {pivot.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-slate-700/60 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 block">
                        Bridging Skills to Acquire:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pivot.keyBridgingSkills?.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Strategic Hiring Playbook */}
          {activeTab === "playbook" && (
            <div className="p-6 space-y-6 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  Executive Hiring & Visibility Strategy
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Actionable techniques to stand out to engineering leaders,
                  recruiters, and hiring committees. Mark tasks as done as you
                  progress!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {advice.strategicAdvice?.map((strat, sIdx) => {
                  const isChecked = !!checkedAdvice[strat.title];

                  return (
                    <div
                      key={sIdx}
                      onClick={() => toggleAdviceCheck(strat.title)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                          : "bg-white dark:bg-slate-800/80 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                          {strat.category}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-600 text-white"
                              : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <FaCheck className="w-3 h-3" />}
                        </div>
                      </div>

                      <h5
                        className={`text-base font-bold mb-1.5 ${
                          isChecked
                            ? "line-through text-gray-500 dark:text-slate-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {strat.title}
                      </h5>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${
                          isChecked
                            ? "text-gray-400 dark:text-slate-500"
                            : "text-gray-600 dark:text-slate-300"
                        }`}
                      >
                        {strat.recommendation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
