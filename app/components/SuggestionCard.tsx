import { useState } from "react";
import {
  type ResumeSuggestion,
  type SuggestionStatus,
} from "~/lib/suggestionsEngine";
import {
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineCopy,
  AiOutlineEdit,
  AiOutlineUndo,
  AiOutlineArrowRight,
  AiOutlineBulb,
} from "react-icons/ai";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaBriefcase,
  FaFileAlt,
  FaTools,
  FaThList,
  FaGraduationCap,
  FaRobot,
} from "react-icons/fa";

export interface SuggestionCardProps {
  suggestion: ResumeSuggestion;
  onAccept: (id: string, customSnippet?: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  className?: string;
}

export const SuggestionCard = ({
  suggestion,
  onAccept,
  onDismiss,
  onRestore,
  className = "",
}: SuggestionCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    suggestion.userEditedSnippet || suggestion.proposedChange,
  );
  const [copied, setCopied] = useState(false);

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "experience":
        return <FaBriefcase className="w-3.5 h-3.5 text-blue-500" />;
      case "summary":
        return <FaFileAlt className="w-3.5 h-3.5 text-indigo-500" />;
      case "skills":
        return <FaTools className="w-3.5 h-3.5 text-amber-500" />;
      case "structure":
        return <FaThList className="w-3.5 h-3.5 text-purple-500" />;
      case "education":
        return <FaGraduationCap className="w-3.5 h-3.5 text-emerald-500" />;
      case "ats":
        return <FaRobot className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <AiOutlineBulb className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            High Impact
          </span>
        );
      case "medium":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Medium Impact
          </span>
        );
      case "low":
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Quick Win
          </span>
        );
    }
  };

  const handleCopy = () => {
    const textToCopy = editedText || suggestion.proposedChange;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndAccept = () => {
    onAccept(suggestion.id, editedText);
    setIsEditing(false);
  };

  const isAccepted = suggestion.status === "accepted";
  const isDismissed = suggestion.status === "dismissed";

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isAccepted
          ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs"
          : isDismissed
          ? "border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 opacity-60 hover:opacity-100"
          : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-600/60 shadow-xs hover:shadow-md"
      } ${className}`}
    >
      {/* Top Meta Bar */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          {getSectionIcon(suggestion.section)}
          <span className="text-xs font-bold text-gray-700 dark:text-slate-200">
            {suggestion.sectionLabel}
          </span>
          <span className="text-gray-300 dark:text-slate-600">•</span>
          {getImpactBadge(suggestion.impact)}
        </div>

        <div className="flex items-center gap-1.5">
          {isAccepted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-transparent dark:border-emerald-800/60">
              <FaCheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Accepted
            </span>
          )}
          {isDismissed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-slate-400 bg-gray-200 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-transparent dark:border-slate-700">
              <FaTimesCircle className="w-3 h-3 text-gray-400" />
              Dismissed
            </span>
          )}
          {suggestion.status === "pending" && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
              Needs Review
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Title & Rationale */}
        <div>
          <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug">
            {suggestion.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">
            {suggestion.rationale}
          </p>
        </div>

        {/* Before / After Proposal Box */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 text-xs">
          {/* Current / Original */}
          {suggestion.originalSnippet && (
            <div className="p-3 bg-rose-50/40 dark:bg-rose-950/25 border-b border-gray-100 dark:border-slate-800 flex items-start gap-2.5">
              <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 flex-shrink-0 mt-0.5">
                Current
              </div>
              <p className="text-gray-600 dark:text-slate-300 italic leading-relaxed">
                "{suggestion.originalSnippet}"
              </p>
            </div>
          )}

          {/* Proposed Improvement */}
          <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/25 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 flex-shrink-0">
                  Proposed Improvement
                </span>
                <span className="text-[11px] text-gray-400 dark:text-slate-400 hidden sm:inline">
                  (Ready to paste into resume)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <AiOutlineEdit className="w-3 h-3" />
                  {isEditing ? "Done" : "Edit Text"}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    copied
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950"
                      : "text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {copied ? (
                    <>
                      <AiOutlineCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <AiOutlineCopy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 font-mono text-[11px] text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Customize this bullet point..."
              />
            ) : (
              <p className="font-mono text-xs sm:text-[11px] text-gray-900 dark:text-slate-100 bg-white/80 dark:bg-slate-800/90 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50 leading-relaxed font-medium">
                "{editedText || suggestion.proposedChange}"
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-slate-800">
          {suggestion.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => onDismiss(suggestion.id)}
                className="px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <AiOutlineClose className="w-3 h-3" />
                <span>Dismiss</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700"
                >
                  <AiOutlineCopy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndAccept}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <AiOutlineCheck className="w-3.5 h-3.5" />
                  <span>Accept Change</span>
                </button>
              </div>
            </>
          )}

          {isAccepted && (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <FaCheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Accepted to resume revision</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <AiOutlineCopy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy Snippet"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRestore(suggestion.id)}
                  className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Undo accept"
                >
                  <AiOutlineUndo className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              </div>
            </>
          )}

          {isDismissed && (
            <>
              <span className="text-xs text-gray-400 dark:text-slate-500 italic">
                Suggestion dismissed from active list
              </span>
              <button
                type="button"
                onClick={() => onRestore(suggestion.id)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-300 dark:border-slate-700"
              >
                <AiOutlineUndo className="w-3 h-3" />
                <span>Restore Suggestion</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;
