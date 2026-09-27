import { useState, useEffect, useMemo } from "react";
import {
  type ResumeSuggestion,
  type ResumeSection,
  type SuggestionStatus,
  buildResumeSuggestions,
  saveStoredSuggestionsState,
  getStoredSuggestionsState,
} from "~/lib/suggestionsEngine";
import SuggestionCard from "~/components/SuggestionCard";
import {
  AiOutlineCheck,
  AiOutlineCopy,
  AiOutlineFilter,
  AiOutlineSearch,
  AiOutlineReload,
  AiOutlineThunderbolt,
  AiOutlineDownload,
} from "react-icons/ai";
import {
  FaTasks,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
} from "react-icons/fa";

export interface ResumeActionSuggestionsProps {
  feedback: Feedback | null;
  resumeId: string;
  jobTitle?: string;
  companyName?: string;
  className?: string;
}

export const ResumeActionSuggestions = ({
  feedback,
  resumeId,
  jobTitle = "Target Role",
  companyName = "Target Company",
  className = "",
}: ResumeActionSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [statusFilter, setStatusFilter] = useState<"pending" | "all" | "accepted" | "dismissed">("pending");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize suggestions from feedback and saved local storage state
  useEffect(() => {
    if (feedback && resumeId) {
      const list = buildResumeSuggestions(feedback, resumeId, jobTitle);
      setSuggestions(list);
    }
  }, [feedback, resumeId, jobTitle]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state to localStorage whenever suggestions status changes
  const persistState = (updatedList: ResumeSuggestion[]) => {
    const stateObj: Record<string, { status: SuggestionStatus; userEditedSnippet?: string }> = {};
    updatedList.forEach((item) => {
      stateObj[item.id] = {
        status: item.status,
        userEditedSnippet: item.userEditedSnippet,
      };
    });
    saveStoredSuggestionsState(resumeId, stateObj);
  };

  // Action handlers
  const handleAccept = (id: string, customSnippet?: string) => {
    setSuggestions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "accepted" as SuggestionStatus,
            userEditedSnippet: customSnippet || s.userEditedSnippet,
            acceptedAt: Date.now(),
          };
        }
        return s;
      });
      persistState(updated);
      return updated;
    });
    showToast("Change accepted! Added to your revision plan.");
  };

  const handleDismiss = (id: string) => {
    setSuggestions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          return { ...s, status: "dismissed" as SuggestionStatus };
        }
        return s;
      });
      persistState(updated);
      return updated;
    });
    showToast("Suggestion dismissed.");
  };

  const handleRestore = (id: string) => {
    setSuggestions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) {
          return { ...s, status: "pending" as SuggestionStatus };
        }
        return s;
      });
      persistState(updated);
      return updated;
    });
    showToast("Suggestion restored to Pending Review.");
  };

  const handleAcceptAllHighImpact = () => {
    setSuggestions((prev) => {
      const updated = prev.map((s) => {
        if (s.status === "pending" && s.impact === "high") {
          return { ...s, status: "accepted" as SuggestionStatus, acceptedAt: Date.now() };
        }
        return s;
      });
      persistState(updated);
      return updated;
    });
    showToast("Accepted all High Impact suggestions!");
  };

  const handleExportAccepted = () => {
    const accepted = suggestions.filter((s) => s.status === "accepted");
    if (accepted.length === 0) {
      showToast("No changes accepted yet. Accept suggestions first!");
      return;
    }

    // Group by section
    const grouped: Record<string, string[]> = {};
    accepted.forEach((item) => {
      if (!grouped[item.sectionLabel]) {
        grouped[item.sectionLabel] = [];
      }
      const text = item.userEditedSnippet || item.proposedChange;
      grouped[item.sectionLabel].push(`- ${item.title}:\n  "${text}"`);
    });

    let exportText = `# Resume Revision Plan for ${jobTitle} (${companyName})\n\n`;
    exportText += `Total Accepted Changes: ${accepted.length}\n`;
    exportText += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    Object.entries(grouped).forEach(([section, items]) => {
      exportText += `## ${section}\n`;
      exportText += items.join("\n\n") + "\n\n";
    });

    navigator.clipboard.writeText(exportText);
    showToast(`Copied ${accepted.length} accepted revisions to clipboard!`);
  };

  const handleResetAll = () => {
    if (confirm("Reset all suggestions back to Pending?")) {
      const updated = suggestions.map((s) => ({
        ...s,
        status: "pending" as SuggestionStatus,
        userEditedSnippet: undefined,
      }));
      setSuggestions(updated);
      persistState(updated);
      showToast("All suggestions reset.");
    }
  };

  // Metrics
  const totalCount = suggestions.length;
  const acceptedCount = suggestions.filter((s) => s.status === "accepted").length;
  const dismissedCount = suggestions.filter((s) => s.status === "dismissed").length;
  const pendingCount = suggestions.filter((s) => s.status === "pending").length;
  const completionPercentage =
    totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  // Filtered List
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((item) => {
      // Status filter
      if (statusFilter === "pending" && item.status !== "pending") return false;
      if (statusFilter === "accepted" && item.status !== "accepted") return false;
      if (statusFilter === "dismissed" && item.status !== "dismissed") return false;

      // Section filter
      if (sectionFilter !== "all" && item.section !== sectionFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.rationale.toLowerCase().includes(q) ||
          item.proposedChange.toLowerCase().includes(q) ||
          item.sectionLabel.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [suggestions, statusFilter, sectionFilter, searchQuery]);

  return (
    <div
      className={`rounded-2xl shadow-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <FaTasks className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Actionable Resume Suggestions
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Review section-by-section improvements. Accept recommended bullets or dismiss as needed.
              </p>
            </div>
          </div>

          {/* Quick Progress Indicator */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                Revisions Accepted
              </p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-tight">
                {acceptedCount} / {totalCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 dark:border-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-400">
              {completionPercentage}%
            </div>
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div className="mt-4 w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(acceptedCount / (totalCount || 1)) * 100}%` }}
            title="Accepted"
          />
          <div
            className="bg-gray-400 dark:bg-slate-600 h-full transition-all duration-300"
            style={{ width: `${(dismissedCount / (totalCount || 1)) * 100}%` }}
            title="Dismissed"
          />
        </div>

        {/* Status Toast */}
        {toastMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
            <AiOutlineCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Metric Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div
            onClick={() => setStatusFilter("pending")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === "pending"
                ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/40 shadow-xs ring-1 ring-amber-400"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold mb-1">
              <span>Pending Review</span>
              <FaClipboardList className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{pendingCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter("accepted")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === "accepted"
                ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-400"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">
              <span>Accepted Changes</span>
              <FaCheckCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{acceptedCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter("dismissed")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === "dismissed"
                ? "border-gray-400 bg-gray-100 dark:bg-slate-800 shadow-xs ring-1 ring-gray-400"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-bold mb-1">
              <span>Dismissed</span>
              <FaTimesCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black text-gray-600 dark:text-slate-300">{dismissedCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter("all")}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === "all"
                ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-400"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-bold mb-1">
              <span>All Action Items</span>
              <FaTasks className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{totalCount}</span>
          </div>
        </div>

        {/* Filter & Batch Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
          {/* Section Filter & Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <AiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action items..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-slate-100"
              />
            </div>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="text-xs py-1.5 px-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-gray-700 dark:text-slate-200"
            >
              <option value="all">All Sections</option>
              <option value="experience">Work Experience</option>
              <option value="summary">Summary & Tone</option>
              <option value="skills">Skills & Stack</option>
              <option value="structure">Structure & Format</option>
              <option value="ats">ATS Compliance</option>
            </select>
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleAcceptAllHighImpact}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Accept all high impact items at once"
              >
                <AiOutlineThunderbolt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Accept High Impact</span>
              </button>
            )}

            {acceptedCount > 0 && (
              <button
                type="button"
                onClick={handleExportAccepted}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Copy all accepted revised bullets to clipboard"
              >
                <AiOutlineCopy className="w-3.5 h-3.5" />
                <span>Export {acceptedCount} Accepted</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetAll}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Reset all suggestions"
            >
              <AiOutlineReload className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Suggestion Cards Feed */}
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 space-y-2">
            <FaTasks className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-gray-600 dark:text-slate-300">
              No suggestions in "{statusFilter}"
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 max-w-sm mx-auto">
              {statusFilter === "pending"
                ? "Great job! You have reviewed all pending action items for this resume."
                : "Try switching filters to view other suggestions."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((item) => (
              <SuggestionCard
                key={item.id}
                suggestion={item}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onRestore={handleRestore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeActionSuggestions;
