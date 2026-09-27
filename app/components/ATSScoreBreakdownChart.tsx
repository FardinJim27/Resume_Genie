import { useState, useId } from "react";
import { useTheme } from "~/lib/theme";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  AiOutlineBarChart,
  AiOutlineRadarChart,
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import { FaAward, FaTools, FaChartPie } from "react-icons/fa";

export interface ATSScoreBreakdownProps {
  feedback: Feedback;
  className?: string;
}

interface DimensionData {
  dimension: string;
  shortName: string;
  score: number;
  benchmark: number;
  fullMark: number;
  description: string;
  category: "content" | "structure" | "skills" | "tone" | "ats";
  goodTipsCount: number;
  improveTipsCount: number;
}

export const ATSScoreBreakdownChart = ({
  feedback,
  className = "",
}: ATSScoreBreakdownProps) => {
  const [activeView, setActiveView] = useState<"radar" | "bar" | "metrics">("radar");
  const chartId = useId();

  // Extract dimensions from feedback safely with fallbacks
  const contentScore = feedback?.content?.score ?? 0;
  const structureScore = feedback?.structure?.score ?? 0;
  const skillsScore = feedback?.skills?.score ?? 0;
  const toneScore = feedback?.toneAndStyle?.score ?? 0;
  const atsScore = feedback?.ATS?.score ?? 0;

  const countTips = (tips?: { type: "good" | "improve" }[]) => {
    const list = tips || [];
    const good = list.filter((t) => t.type === "good").length;
    const improve = list.filter((t) => t.type === "improve").length;
    return { good, improve };
  };

  const contentTips = countTips(feedback?.content?.tips);
  const structureTips = countTips(feedback?.structure?.tips);
  const skillsTips = countTips(feedback?.skills?.tips);
  const toneTips = countTips(feedback?.toneAndStyle?.tips);
  const atsTips = countTips(feedback?.ATS?.tips);

  const data: DimensionData[] = [
    {
      dimension: "Impact & Content",
      shortName: "Impact",
      score: contentScore,
      benchmark: 75,
      fullMark: 100,
      description: "Action verbs, quantifiable results, and project depth.",
      category: "content",
      goodTipsCount: contentTips.good,
      improveTipsCount: contentTips.improve,
    },
    {
      dimension: "Formatting & Structure",
      shortName: "Formatting",
      score: structureScore,
      benchmark: 80,
      fullMark: 100,
      description: "Section headings, margin cleanliness, and ATS layout parsability.",
      category: "structure",
      goodTipsCount: structureTips.good,
      improveTipsCount: structureTips.improve,
    },
    {
      dimension: "Skills Alignment",
      shortName: "Skills",
      score: skillsScore,
      benchmark: 75,
      fullMark: 100,
      description: "Technical stack match and core job keyword relevancy.",
      category: "skills",
      goodTipsCount: skillsTips.good,
      improveTipsCount: skillsTips.improve,
    },
    {
      dimension: "Tone & Style",
      shortName: "Tone",
      score: toneScore,
      benchmark: 70,
      fullMark: 100,
      description: "Active voice, professional conciseness, and narrative impact.",
      category: "tone",
      goodTipsCount: toneTips.good,
      improveTipsCount: toneTips.improve,
    },
    {
      dimension: "ATS Parsability",
      shortName: "ATS Machine",
      score: atsScore,
      benchmark: 80,
      fullMark: 100,
      description: "Machine readability, contact detection, and standard parsing ease.",
      category: "ats",
      goodTipsCount: atsTips.good,
      improveTipsCount: atsTips.improve,
    },
  ];

  // Highest and lowest dimensions
  const sorted = [...data].sort((a, b) => b.score - a.score);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const getScoreColor = (val: number) => {
    if (val >= 75) return "#10b981"; // Emerald green
    if (val >= 55) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const getScoreBg = (val: number) => {
    if (val >= 75)
      return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
    if (val >= 55)
      return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";
    return "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60";
  };

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Custom Tooltip for Radar & Bar
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload as DimensionData;
      if (!item) return null;
      const diff = item.score - item.benchmark;

      return (
        <div className="bg-gray-900/95 dark:bg-slate-800/95 text-white p-3.5 rounded-xl shadow-xl border border-gray-700 dark:border-slate-700 text-xs max-w-xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 border-b border-gray-700 dark:border-slate-700 pb-1.5 mb-2">
            <span className="font-bold text-sm text-gray-100">{item.dimension}</span>
            <span
              className="px-2 py-0.5 rounded font-bold"
              style={{
                backgroundColor: `${getScoreColor(item.score)}25`,
                color: getScoreColor(item.score),
              }}
            >
              {item.score}/100
            </span>
          </div>

          <p className="text-gray-300 dark:text-slate-300 text-[11px] mb-2 leading-relaxed">
            {item.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-gray-800 dark:border-slate-700 pt-2 text-gray-400">
            <div>
              <span>ATS Benchmark: </span>
              <span className="text-gray-200 dark:text-slate-200 font-semibold">{item.benchmark}/100</span>
            </div>
            <div>
              <span>Status: </span>
              <span
                className={`font-semibold ${
                  diff >= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {diff >= 0 ? `+${diff} above` : `${diff} below`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-2xl shadow-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-amber-50/50 via-white to-orange-50/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <FaChartPie className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              ATS Scoring Breakdown
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-1">
            Multidimensional evaluation comparing your resume to industry ATS standards
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl text-[11px] sm:text-xs font-semibold w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => setActiveView("radar")}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeView === "radar"
                ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <AiOutlineRadarChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Radar View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("bar")}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeView === "bar"
                ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <AiOutlineBarChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Bar Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("metrics")}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeView === "metrics"
                ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <AiOutlineInfoCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/40 text-xs">
        <div className="p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <FaAward className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 dark:text-slate-400 text-[11px] font-medium">Top Strength</p>
            <p className="font-bold text-gray-900 dark:text-white truncate">
              {highest.dimension} ({highest.score}/100)
            </p>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <FaTools className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 dark:text-slate-400 text-[11px] font-medium">Primary Focus</p>
            <p className="font-bold text-gray-900 dark:text-white truncate">
              {lowest.dimension} ({lowest.score}/100)
            </p>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3 sm:col-span-2 md:col-span-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <AiOutlineCheckCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 dark:text-slate-400 text-[11px] font-medium">Benchmark Threshold</p>
            <p className="font-bold text-gray-900 dark:text-white">
              75+ Avg ATS Target
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="p-3 sm:p-6">
        {activeView === "radar" && (
          <div className="flex flex-col items-center">
            <div className="w-full h-72 sm:h-80 md:h-96 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="64%"
                  data={data}
                  key={`radar-${chartId}`}
                >
                  <PolarGrid stroke={isDark ? "#334155" : "#e2e8f0"} strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="shortName"
                    tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: isDark ? "#64748b" : "#94a3b8", fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar
                    name="Target Benchmark"
                    dataKey="benchmark"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    fill="#94a3b8"
                    fillOpacity={0.15}
                  />
                  <Radar
                    name="Your Score"
                    dataKey="score"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="#fbbf24"
                    fillOpacity={0.45}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[11px] sm:text-xs text-gray-400 mt-1">
              Tap vertices to view score vs target ATS benchmark.
            </p>
          </div>
        )}

        {activeView === "bar" && (
          <div className="flex flex-col items-center">
            <div className="w-full h-72 sm:h-80 md:h-96 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 15, right: 10, left: -22, bottom: 20 }}
                  key={`bar-${chartId}`}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontSize: 11, fontWeight: 500 }}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: isDark ? "#64748b" : "#94a3b8", fontSize: 10 }}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={75}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    label={{
                      value: "Target 75",
                      position: "right",
                      fill: "#059669",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="score"
                    name="Your Score"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getScoreColor(entry.score)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs mt-2 text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Strong (75 - 100)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Moderate (55 - 74)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Needs Work (&lt;55)
              </span>
            </div>
          </div>
        )}

        {activeView === "metrics" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.map((item) => {
              const diff = item.score - item.benchmark;
              return (
                <div
                  key={item.category}
                  className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-amber-300 dark:hover:border-amber-500 transition-all hover:shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-gray-800 dark:text-slate-100 text-sm">
                        {item.dimension}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreBg(
                          item.score,
                        )}`}
                      >
                        {item.score}/100
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-gray-400 dark:text-slate-400">
                      Target: {item.benchmark}/100
                    </span>
                    <span
                      className={`font-semibold ${
                        diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {diff >= 0 ? `+${diff} above` : `${diff} below target`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Insight */}
      <div className="px-5 py-3.5 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AiOutlineWarning className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            Resumes scoring <strong>75+ across all 5 dimensions</strong> have a 3.4x higher ATS callback rate.
          </span>
        </div>
        <span className="text-gray-400">AI Powered Analysis</span>
      </div>
    </div>
  );
};

export default ATSScoreBreakdownChart;
