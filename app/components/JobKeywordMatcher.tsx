import { useState, useMemo } from "react";
import {
  analyzeJobDescriptionKeywords,
  checkKeywordInText,
  type KeywordAnalysisItem,
  type KeywordAnalysisResult,
} from "~/lib/keywordMatcher";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  AiOutlineCheck,
  AiOutlineCopy,
  AiOutlineSearch,
  AiOutlineExclamationCircle,
  AiOutlineEdit,
  AiOutlineFilter,
  AiOutlineFire,
} from "react-icons/ai";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaCode,
  FaTools,
  FaUserTie,
  FaLightbulb,
} from "react-icons/fa";

export interface JobKeywordMatcherProps {
  jobDescription?: string;
  resumeText?: string;
  jobTitle?: string;
  companyName?: string;
  feedback?: Feedback;
  className?: string;
}

export const JobKeywordMatcher = ({
  jobDescription: initialJobDescription = "",
  resumeText: initialResumeText = "",
  jobTitle = "Target Role",
  companyName = "Target Company",
  feedback,
  className = "",
}: JobKeywordMatcherProps) => {
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [isEditingJD, setIsEditingJD] = useState(false);
  const [tempJD, setTempJD] = useState(initialJobDescription);

  const [filterTab, setFilterTab] = useState<"all" | "missing" | "matched">("missing");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Custom keyword tester
  const [customWord, setCustomWord] = useState("");
  const [customWordResult, setCustomWordResult] = useState<{
    word: string;
    inResume: boolean;
    count: number;
  } | null>(null);

  // Extract skills from feedback if available to supplement resume text
  const feedbackSkills = useMemo(() => {
    const list: string[] = [];
    if (feedback?.skills?.tips) {
      feedback.skills.tips.forEach((t) => {
        list.push(t.tip);
        if (t.explanation) list.push(t.explanation);
      });
    }
    return list;
  }, [feedback]);

  // Compute keyword analysis
  const analysis: KeywordAnalysisResult = useMemo(() => {
    return analyzeJobDescriptionKeywords(
      jobDescription,
      initialResumeText,
      feedbackSkills,
    );
  }, [jobDescription, initialResumeText, feedbackSkills]);

  // Filtered keywords based on active filters
  const filteredKeywords = useMemo(() => {
    return analysis.keywords.filter((item) => {
      // Tab filter
      if (filterTab === "missing" && item.matched) return false;
      if (filterTab === "matched" && !item.matched) return false;

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.keyword.toLowerCase().includes(q) ||
          item.whyItMatters.toLowerCase().includes(q) ||
          item.suggestedBullet.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [analysis, filterTab, categoryFilter, searchQuery]);

  const handleCopyBullet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTestCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWord.trim()) return;
    const combined = `${initialResumeText} ${feedbackSkills.join(" ")}`;
    const check = checkKeywordInText(combined, customWord.trim());
    setCustomWordResult({
      word: customWord.trim(),
      inResume: check.matched,
      count: check.count,
    });
  };

  const handleSaveJD = () => {
    setJobDescription(tempJD);
    setIsEditingJD(false);
  };

  // Recharts Category Match Data
  const chartData = [
    {
      name: "Technical",
      matchRate: analysis.categories.technical.percentage,
      matched: analysis.categories.technical.matched,
      total: analysis.categories.technical.total,
    },
    {
      name: "Tools & CI",
      matchRate: analysis.categories.tools.percentage,
      matched: analysis.categories.tools.matched,
      total: analysis.categories.tools.total,
    },
    {
      name: "Soft Skills",
      matchRate: analysis.categories.soft_skills.percentage,
      matched: analysis.categories.soft_skills.matched,
      total: analysis.categories.soft_skills.total,
    },
    {
      name: "Domain",
      matchRate: analysis.categories.domain.percentage,
      matched: analysis.categories.domain.matched,
      total: analysis.categories.domain.total,
    },
  ].filter((d) => d.total > 0);

  const getMatchColor = (pct: number) => {
    if (pct >= 75) return "#10b981"; // Emerald
    if (pct >= 50) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  return (
    <div
      className={`rounded-2xl shadow-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden transition-all ${className}`}
    >
      {/* Top Banner / Match Rate Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white dark:from-amber-950/20 dark:via-orange-950/10 dark:to-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <FaKey className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Job Description Keyword Matcher
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Comparing required keywords against your resume for{" "}
                <span className="font-semibold text-gray-800 dark:text-slate-200">
                  {jobTitle || "Target Role"}
                </span>{" "}
                {companyName && <span>at {companyName}</span>}
              </p>
            </div>
          </div>

          {/* Quick Match Indicator */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                Keyword Match Rate
              </p>
              <p
                className="text-lg font-black leading-tight"
                style={{ color: getMatchColor(analysis.matchPercentage) }}
              >
                {analysis.matchPercentage}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-xs"
              style={{
                borderColor: getMatchColor(analysis.matchPercentage),
                color: getMatchColor(analysis.matchPercentage),
              }}
            >
              {analysis.matchedCount}/{analysis.totalCount}
            </div>
          </div>
        </div>

        {/* Highlighted Warning Box if Critical Keywords Missing */}
        {analysis.criticalMissingCount > 0 && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-3 text-xs text-rose-800 dark:text-rose-200">
            <AiOutlineFire className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="font-bold">
                {analysis.criticalMissingCount} Critical {analysis.criticalMissingCount === 1 ? "Keyword" : "Keywords"} Missing:
              </span>{" "}
              Applicant Tracking Systems frequently filter out candidates lacking these core terms.
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterTab("missing");
                setCategoryFilter("all");
              }}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer flex-shrink-0"
            >
              View Missing
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Metric Counters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setFilterTab("missing")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterTab === "missing"
                ? "border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 shadow-sm ring-1 ring-rose-400"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">
              <span>Missing Keywords</span>
              <FaTimesCircle className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
                {analysis.missingCount}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-400">
                ({analysis.criticalMissingCount} high priority)
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterTab("matched")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterTab === "matched"
                ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-400"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
              <span>Matched Keywords</span>
              <FaCheckCircle className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {analysis.matchedCount}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-400">found in resume</span>
            </div>
          </div>

          <div
            onClick={() => setFilterTab("all")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              filterTab === "all"
                ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/40 shadow-sm ring-1 ring-amber-400"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold mb-1">
              <span>Total Extracted</span>
              <FaKey className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {analysis.totalCount}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-400">from JD</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-semibold mb-1">
              <span>Job Description</span>
              <button
                type="button"
                onClick={() => setIsEditingJD(!isEditingJD)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <AiOutlineEdit className="w-3.5 h-3.5" />
                {isEditingJD ? "Cancel" : "Edit"}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {jobDescription ? `${jobDescription.slice(0, 45)}...` : "Default JD analyzed"}
            </p>
          </div>
        </div>

        {/* Collapsible Edit Job Description Form */}
        {isEditingJD && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Paste / Modify Job Description
              </h4>
              <span className="text-[11px] text-gray-500">
                Keywords and match rate will re-calculate dynamically
              </span>
            </div>
            <textarea
              rows={4}
              value={tempJD}
              onChange={(e) => setTempJD(e.target.value)}
              placeholder="Paste target job requirements, qualifications, and role description..."
              className="w-full text-xs p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingJD(false)}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJD}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Update & Re-scan Keywords
              </button>
            </div>
          </div>
        )}

        {/* Category Match Rate Mini Chart */}
        {chartData.length > 0 && (
          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                Match Distribution by Category
              </span>
              <span className="text-[11px] text-gray-400 dark:text-slate-400">
                Passing goal: ≥75% per category
              </span>
            </div>
            <div className="w-full h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 45, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${item.payload.matched}/${item.payload.total} matched)`,
                      "Match Rate",
                    ]}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "11px",
                      borderColor: "#334155",
                    }}
                  />
                  <Bar dataKey="matchRate" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getMatchColor(entry.matchRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterTab("missing")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                filterTab === "missing"
                  ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              <span>Missing ({analysis.missingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("matched")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                filterTab === "matched"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              <span>Matched ({analysis.matchedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                filterTab === "all"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              <span>All ({analysis.totalCount})</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-52">
              <AiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter keywords..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-1.5 px-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-gray-700 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical Stack</option>
              <option value="tools">Tools & CI/CD</option>
              <option value="soft_skills">Soft Skills</option>
              <option value="domain">Domain & Practices</option>
            </select>
          </div>
        </div>

        {/* Keywords Grid / Cards */}
        {filteredKeywords.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No keywords match the selected filter or search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredKeywords.map((item) => {
              const isExpanded = expandedId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.matched
                      ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700"
                      : item.priority === "critical"
                      ? "border-rose-300 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-700 shadow-xs"
                      : "border-amber-200 dark:border-amber-800/60 bg-amber-50/15 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {item.keyword}
                        </span>

                        {/* Status Badge */}
                        {item.matched ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-transparent dark:border-emerald-800/60">
                            <FaCheckCircle className="w-2.5 h-2.5" />
                            In Resume ({item.matchCountInResume}x)
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.priority === "critical"
                                ? "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60"
                                : item.priority === "important"
                                ? "text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-transparent dark:border-amber-800/60"
                                : "text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-700"
                            }`}
                          >
                            <FaTimesCircle className="w-2.5 h-2.5" />
                            Missing • {item.priority.toUpperCase()}
                          </span>
                        )}

                        {/* Frequency Tag */}
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          {item.frequencyInJD}x in JD
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {item.whyItMatters}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded transition-colors flex-shrink-0 cursor-pointer"
                      title="Toggle bullet suggestion"
                    >
                      <FaLightbulb className={`w-3.5 h-3.5 ${isExpanded ? "text-amber-500" : ""}`} />
                    </button>
                  </div>

                  {/* Suggested Bullet Box (Always visible for missing, or toggleable) */}
                  {(!item.matched || isExpanded) && (
                    <div className="mt-3 pt-3 border-t border-gray-100/80 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-400 mb-1">
                        <span className="font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1">
                          <FaLightbulb className="w-3 h-3 text-amber-500" />
                          Recommended Bullet Point:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyBullet(item.id, item.suggestedBullet)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            isCopied
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <AiOutlineCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <AiOutlineCopy className="w-3 h-3" />
                              Copy Bullet
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/90 p-2.5 rounded-lg border border-gray-200/70 dark:border-slate-700 font-mono text-[11px] leading-relaxed">
                        "{item.suggestedBullet}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Custom Keyword Tester Strip */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
          <form
            onSubmit={handleTestCustomWord}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <AiOutlineSearch className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">
                Test Any Custom Keyword:
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:max-w-md">
              <input
                type="text"
                value={customWord}
                onChange={(e) => setCustomWord(e.target.value)}
                placeholder="e.g. AWS, Figma, GraphQL, Microservices"
                className="flex-1 text-xs p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-bold text-white bg-gray-800 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
              >
                Check
              </button>
            </div>

            {customWordResult && (
              <div
                className={`w-full text-xs font-bold p-2 rounded-lg flex items-center gap-2 ${
                  customWordResult.inResume
                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60"
                    : "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60"
                }`}
              >
                {customWordResult.inResume ? (
                  <>
                    <FaCheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      "{customWordResult.word}" was found in your resume (
                      {customWordResult.count} occurrence
                      {customWordResult.count === 1 ? "" : "s"})
                    </span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>
                      "{customWordResult.word}" was NOT detected in your resume.
                    </span>
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobKeywordMatcher;
