import { useState, useEffect, useId } from "react";
import { useTheme } from "~/lib/theme";
import {
  type SavedAnalysis,
  getAnalysesHistory,
  saveAnalysisToHistory,
  deleteAnalysisFromHistory,
  updateAnalysisLabel,
} from "~/lib/historyStorage";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiOutlineMinus,
  AiOutlineSwap,
  AiOutlineSave,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineCheck,
  AiOutlineHistory,
  AiOutlineClose,
} from "react-icons/ai";
import { FaBalanceScale, FaAward } from "react-icons/fa";

export interface ResumeScoreComparisonProps {
  currentResumeId?: string;
  currentFeedback?: Feedback;
  companyName?: string;
  jobTitle?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const ResumeScoreComparison = ({
  currentResumeId,
  currentFeedback,
  companyName = "Current Target",
  jobTitle = "Role",
  onClose,
  isModal = false,
}: ResumeScoreComparisonProps) => {
  const chartId = useId();
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [selectedAId, setSelectedAId] = useState<string>("");
  const [selectedBId, setSelectedBId] = useState<string>("");
  const [newLabelInput, setNewLabelInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const refreshHistory = () => {
    const list = getAnalysesHistory();
    setHistory(list);
    return list;
  };

  useEffect(() => {
    const list = refreshHistory();

    // Auto-save current feedback if provided and not yet in history
    if (currentResumeId && currentFeedback) {
      const saved = saveAnalysisToHistory(
        currentResumeId,
        companyName,
        jobTitle,
        currentFeedback,
      );
      const updatedList = refreshHistory();

      // Default selection: Version B is current, Version A is the most recent previous version
      setSelectedBId(saved.id);
      const previousOne = updatedList.find((item) => item.id !== saved.id);
      if (previousOne) {
        setSelectedAId(previousOne.id);
      } else {
        setSelectedAId(saved.id);
      }
    } else if (list.length >= 2) {
      setSelectedAId(list[1].id);
      setSelectedBId(list[0].id);
    } else if (list.length === 1) {
      setSelectedAId(list[0].id);
      setSelectedBId(list[0].id);
    }
  }, [currentResumeId, currentFeedback, companyName, jobTitle]);

  const versionA = history.find((h) => h.id === selectedAId);
  const versionB = history.find((h) => h.id === selectedBId);

  const handleSaveCurrentAsVersion = () => {
    if (!currentFeedback || !currentResumeId) return;
    const label = newLabelInput.trim() || `Version ${history.length + 1}`;
    const newEntry = saveAnalysisToHistory(
      currentResumeId,
      companyName,
      jobTitle,
      currentFeedback,
      label,
    );
    setNewLabelInput("");
    refreshHistory();
    setSelectedBId(newEntry.id);
    setSaveSuccessMsg(`Saved as "${label}"`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDeleteVersion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAnalysisFromHistory(id);
    const updated = refreshHistory();
    if (selectedAId === id && updated.length > 0) {
      setSelectedAId(updated[0].id);
    }
    if (selectedBId === id && updated.length > 0) {
      setSelectedBId(updated[0].id);
    }
  };

  const handleSaveLabel = (id: string) => {
    if (!editingLabel.trim()) return;
    updateAnalysisLabel(id, editingLabel.trim());
    setEditingId(null);
    refreshHistory();
  };

  const getDeltaBadge = (delta: number) => {
    if (delta > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          <AiOutlineArrowUp className="w-3 h-3" />+{delta} pts
        </span>
      );
    }
    if (delta < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
          <AiOutlineArrowDown className="w-3 h-3" />
          {delta} pts
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        <AiOutlineMinus className="w-3 h-3" />
        No change
      </span>
    );
  };

  // Prepare chart comparison data
  const comparisonData = [
    {
      metric: "Overall Score",
      short: "Overall",
      versionA: versionA?.overallScore ?? 0,
      versionB: versionB?.overallScore ?? 0,
      delta: (versionB?.overallScore ?? 0) - (versionA?.overallScore ?? 0),
    },
    {
      metric: "ATS Parsability",
      short: "ATS",
      versionA: versionA?.atsScore ?? 0,
      versionB: versionB?.atsScore ?? 0,
      delta: (versionB?.atsScore ?? 0) - (versionA?.atsScore ?? 0),
    },
    {
      metric: "Impact & Content",
      short: "Content",
      versionA: versionA?.breakdown.content ?? 0,
      versionB: versionB?.breakdown.content ?? 0,
      delta: (versionB?.breakdown.content ?? 0) - (versionA?.breakdown.content ?? 0),
    },
    {
      metric: "Structure & Layout",
      short: "Structure",
      versionA: versionA?.breakdown.structure ?? 0,
      versionB: versionB?.breakdown.structure ?? 0,
      delta: (versionB?.breakdown.structure ?? 0) - (versionA?.breakdown.structure ?? 0),
    },
    {
      metric: "Skills Match",
      short: "Skills",
      versionA: versionA?.breakdown.skills ?? 0,
      versionB: versionB?.breakdown.skills ?? 0,
      delta: (versionB?.breakdown.skills ?? 0) - (versionA?.breakdown.skills ?? 0),
    },
    {
      metric: "Tone & Style",
      short: "Tone",
      versionA: versionA?.breakdown.toneAndStyle ?? 0,
      versionB: versionB?.breakdown.toneAndStyle ?? 0,
      delta: (versionB?.breakdown.toneAndStyle ?? 0) - (versionA?.breakdown.toneAndStyle ?? 0),
    },
  ];

  const overallDelta =
    (versionB?.overallScore ?? 0) - (versionA?.overallScore ?? 0);
  const atsDelta = (versionB?.atsScore ?? 0) - (versionA?.atsScore ?? 0);

  const CustomComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const vAVal = payload.find((p: any) => p.dataKey === "versionA")?.value ?? 0;
      const vBVal = payload.find((p: any) => p.dataKey === "versionB")?.value ?? 0;
      const diff = vBVal - vAVal;

      return (
        <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-700 text-xs">
          <p className="font-bold text-gray-200 border-b border-gray-700 pb-1 mb-2">
            {label}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">
                {versionA?.versionLabel || "Version A"}:
              </span>
              <span className="font-semibold text-slate-300">{vAVal}/100</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">
                {versionB?.versionLabel || "Version B"}:
              </span>
              <span className="font-bold text-amber-400">{vBVal}/100</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-gray-800">
              <span className="text-gray-300 font-medium">Difference:</span>
              <span
                className={`font-bold ${
                  diff > 0
                    ? "text-emerald-400"
                    : diff < 0
                    ? "text-rose-400"
                    : "text-gray-400"
                }`}
              >
                {diff > 0 ? `+${diff} pts` : `${diff} pts`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden transition-all ${
        isModal ? "max-h-[90vh] flex flex-col" : "w-full"
      }`}
    >
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white dark:from-amber-950/30 dark:via-amber-950/15 dark:to-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <FaBalanceScale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Resume Version Score Comparison
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-800/60">
                Local History ({history.length})
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Compare ATS scores and dimension metrics between different resume revisions
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Comparison"
          >
            <AiOutlineClose className="w-5 h-5" />
          </button>
        )}
      </div>

      <div
        className={`p-5 sm:p-6 space-y-6 ${
          isModal ? "overflow-y-auto flex-1" : ""
        }`}
      >
        {history.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <AiOutlineHistory className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-gray-700 dark:text-slate-200 text-sm">
              No saved analysis snapshots yet
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Once resumes are analyzed, snapshots are automatically saved to your browser's local storage so you can track progress over time.
            </p>
          </div>
        ) : (
          <>
            {/* Version Selectors Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
              {/* Baseline / Version A */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Baseline (Version A)
                  </label>
                  <span className="text-[11px] text-gray-400 dark:text-slate-400">Earlier revision</span>
                </div>
                <select
                  value={selectedAId}
                  onChange={(e) => setSelectedAId(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {history.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.versionLabel} • Overall: {item.overallScore} • ATS: {item.atsScore} (
                      {new Date(item.timestamp).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Comparison / Version B */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Target Revision (Version B)
                  </label>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Newer revision</span>
                </div>
                <select
                  value={selectedBId}
                  onChange={(e) => setSelectedBId(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {history.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.versionLabel} • Overall: {item.overallScore} • ATS: {item.atsScore} (
                      {new Date(item.timestamp).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Score Delta Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Overall Delta Card */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                    Overall Resume Score
                  </span>
                  {getDeltaBadge(overallDelta)}
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {versionB?.overallScore ?? 0}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    vs {versionA?.overallScore ?? 0}
                  </span>
                </div>
              </div>

              {/* ATS Delta Card */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                    ATS Passability Score
                  </span>
                  {getDeltaBadge(atsDelta)}
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {versionB?.atsScore ?? 0}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    vs {versionA?.atsScore ?? 0}
                  </span>
                </div>
              </div>

              {/* Biggest Improvement */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 sm:col-span-2 md:col-span-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                    Greatest Shift
                  </span>
                  <FaAward className="text-amber-500 w-3.5 h-3.5" />
                </div>
                <div className="mt-2 text-xs">
                  {(() => {
                    const nonOverall = comparisonData.filter(
                      (d) => d.metric !== "Overall Score",
                    );
                    const best = [...nonOverall].sort(
                      (a, b) => b.delta - a.delta,
                    )[0];
                    if (!best || best.delta === 0) {
                      return <span className="text-gray-500 dark:text-slate-400">Scores are currently identical</span>;
                    }
                    return (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 dark:text-white truncate">
                          {best.metric}
                        </span>
                        <span
                          className={`font-bold ${
                            best.delta > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {best.delta > 0 ? `+${best.delta}` : best.delta} pts
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Recharts Side-by-Side Bar Chart */}
            <div className="p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100">
                  Visual Metric Comparison
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                    {versionA?.versionLabel || "Version A"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                    {versionB?.versionLabel || "Version B"}
                  </span>
                </div>
              </div>

              <div className="w-full h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
                    key={`compare-${chartId}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#f1f5f9"} vertical={false} />
                    <XAxis
                      dataKey="short"
                      tick={{ fill: isDark ? "#cbd5e1" : "#64748b", fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: isDark ? "#64748b" : "#94a3b8", fontSize: 10 }}
                    />
                    <Tooltip content={<CustomComparisonTooltip />} />
                    <ReferenceLine
                      y={75}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{
                        value: "Target 75",
                        position: "right",
                        fill: "#10b981",
                        fontSize: 10,
                      }}
                    />
                    <Bar
                      dataKey="versionA"
                      name={versionA?.versionLabel || "Version A"}
                      fill={isDark ? "#64748b" : "#94a3b8"}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="versionB"
                      name={versionB?.versionLabel || "Version B"}
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3.5">Dimension</th>
                    <th className="py-2.5 px-3.5">
                      {versionA?.versionLabel || "Version A"}
                    </th>
                    <th className="py-2.5 px-3.5">
                      {versionB?.versionLabel || "Version B"}
                    </th>
                    <th className="py-2.5 px-3.5">Change</th>
                    <th className="py-2.5 px-3.5 hidden sm:table-cell">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {comparisonData.map((row) => (
                    <tr key={row.metric} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold text-gray-800 dark:text-slate-200">
                        {row.metric}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-600 dark:text-slate-300">
                        {row.versionA}/100
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-gray-900 dark:text-white">
                        {row.versionB}/100
                      </td>
                      <td className="py-2.5 px-3.5">{getDeltaBadge(row.delta)}</td>
                      <td className="py-2.5 px-3.5 text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                        {row.delta > 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Improved</span>
                        ) : row.delta < 0 ? (
                          <span className="text-rose-700 dark:text-rose-400 font-medium">Needs Attention</span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">Unchanged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save Current as Named Snapshot Section */}
            {currentFeedback && currentResumeId && (
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
                    Save New Version Snapshot
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Give this revision a descriptive tag (e.g., "After adding metrics", "Tailored for Stripe")
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Version 2 - Added Impact"
                    value={newLabelInput}
                    onChange={(e) => setNewLabelInput(e.target.value)}
                    className="text-xs p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[200px]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsVersion}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <AiOutlineSave className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 rounded-lg flex items-center gap-2">
                <AiOutlineCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {saveSuccessMsg}
              </div>
            )}

            {/* Manage Saved Versions Accordion / List */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
              <h5 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Saved Local Revisions ({history.length})
              </h5>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            className="text-xs p-1 border rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveLabel(item.id)}
                            className="text-green-600 dark:text-emerald-400 p-1 cursor-pointer"
                          >
                            <AiOutlineCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-slate-200">
                            {item.versionLabel}
                          </span>
                          <span className="text-gray-400 dark:text-slate-500 text-[11px] ml-2">
                            {item.companyName} • {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-700 dark:text-slate-300">
                        {item.overallScore}/100
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditingLabel(item.versionLabel);
                        }}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                        title="Rename version"
                      >
                        <AiOutlineEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteVersion(item.id, e)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 cursor-pointer"
                        title="Delete snapshot"
                      >
                        <AiOutlineDelete className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeScoreComparison;
