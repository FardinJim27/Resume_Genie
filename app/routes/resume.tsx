import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useApiStore } from "~/lib/api";
import { convertPdfToImage } from "~/lib/pdf2img";
import ResumeAnalysisDashboard from "~/components/ResumeAnalysisDashboard";
import ResumeScoreComparison from "~/components/ResumeScoreComparison";
import ThemeToggle from "~/components/ThemeToggle";
import { saveAnalysisToHistory, getAnalysesHistory } from "~/lib/historyStorage";
import {
  FaChartPie,
  FaFileAlt,
  FaExpand,
  FaTimes,
  FaRocket,
  FaColumns,
} from "react-icons/fa";

export const meta = () => [
  { title: "Resume Genie | Analysis Dashboard" },
  { name: "description", content: "Executive ATS scoring and resume analysis dashboard" },
];

const Resume = () => {
  const { isAuthenticated, isLoading, getResume, getFileUrl, retryAnalysis } =
    useApiStore();
  const { id } = useParams();
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [polling, setPolling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [resumeMeta, setResumeMeta] = useState<{
    companyName: string;
    jobTitle: string;
    jobDescription: string;
  }>({
    companyName: "",
    jobTitle: "",
    jobDescription: "",
  });
  const [showComparison, setShowComparison] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [mobileTab, setMobileTab] = useState<"analysis" | "preview">("analysis");
  const [workspaceMode, setWorkspaceMode] = useState<"split" | "full" | "preview">("split");
  const [isExpandedPreview, setIsExpandedPreview] = useState(false);
  const resumePathRef = useRef("");
  const navigate = useNavigate();

  useEffect(() => {
    setHistoryCount(getAnalysesHistory().length);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading, isAuthenticated]);

  const handleRetry = async () => {
    if (!id || retrying) return;
    setRetrying(true);
    const updated = await retryAnalysis(id);
    if (updated?.feedback && !("error" in updated.feedback)) {
      setFeedback(updated.feedback);
      saveAnalysisToHistory(
        updated.id,
        updated.companyName || "",
        updated.jobTitle || "",
        updated.feedback,
      );
      setHistoryCount(getAnalysesHistory().length);
    }
    setRetrying(false);
  };

  useEffect(() => {
    const loadResume = async () => {
      if (!id) return;

      const resume = await getResume(id);
      if (!resume) return;

      // Set image URL directly; onError on the <img> handles fallback rendering
      if (resume.imagePath) {
        resumePathRef.current = resume.resumePath || "";
        setPreviewUrl(getFileUrl(resume.imagePath));
      } else if (resume.resumePath) {
        setLoadingImage(true);
        try {
          const pdfUrl = getFileUrl(resume.resumePath);
          const res = await fetch(pdfUrl);
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], "resume.pdf", {
              type: "application/pdf",
            });
            const result = await convertPdfToImage(file);
            if (result.imageUrl) setPreviewUrl(result.imageUrl);
            else setPreviewError(true);
          } else {
            setPreviewError(true);
          }
        } catch (err) {
          console.error("Failed to render PDF preview:", err);
          setPreviewError(true);
        } finally {
          setLoadingImage(false);
        }
      } else {
        setPreviewError(true);
      }

      // Store metadata
      setResumeMeta({
        companyName: resume.companyName || "",
        jobTitle: resume.jobTitle || "",
        jobDescription: resume.jobDescription || "",
      });

      // Set feedback or handle error auto-recovery / start polling if not ready
      if (resume.feedback) {
        if ("error" in resume.feedback) {
          // Attempt automatic recovery once
          setRetrying(true);
          const recovered = await retryAnalysis(id);
          if (recovered?.feedback && !("error" in recovered.feedback)) {
            setFeedback(recovered.feedback);
            saveAnalysisToHistory(
              recovered.id,
              recovered.companyName || "",
              recovered.jobTitle || "",
              recovered.feedback,
            );
            setHistoryCount(getAnalysesHistory().length);
          } else {
            setFeedback(resume.feedback);
          }
          setRetrying(false);
        } else {
          setFeedback(resume.feedback);
          saveAnalysisToHistory(
            resume.id,
            resume.companyName || "",
            resume.jobTitle || "",
            resume.feedback,
          );
          setHistoryCount(getAnalysesHistory().length);
        }
        setPolling(false);
      } else {
        setPolling(true);
      }
    };

    loadResume();
  }, [id]);

  // Poll for feedback
  useEffect(() => {
    if (!polling || !id) return;

    const interval = setInterval(async () => {
      const resume = await getResume(id);
      if (resume?.feedback) {
        setFeedback(resume.feedback);
        setPolling(false);
        saveAnalysisToHistory(
          resume.id,
          resume.companyName || "",
          resume.jobTitle || "",
          resume.feedback,
        );
        setHistoryCount(getAnalysesHistory().length);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [polling, id]);

  const handleImageError = () => {
    const pdfPath = resumePathRef.current;
    if (!pdfPath || previewUrl.startsWith("data:")) {
      setPreviewError(true);
      return;
    }
    const pdfUrl = getFileUrl(pdfPath);
    if (pdfUrl.startsWith("data:")) {
      setPreviewError(true);
      return;
    }
    setLoadingImage(true);
    fetch(pdfUrl)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.blob();
      })
      .then((blob) => {
        const file = new File([blob], "resume.pdf", {
          type: "application/pdf",
        });
        return convertPdfToImage(file);
      })
      .then((result) => {
        if (result.imageUrl) setPreviewUrl(result.imageUrl);
        else setPreviewError(true);
      })
      .catch(() => setPreviewError(true))
      .finally(() => setLoadingImage(false));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* TOP BAR CONTRACT: Brand, Nav Links, Theme & Actions */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand Zone */}
        <Link to="/" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>Resume Genie</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
            ATS Pro
          </span>
        </Link>

        {/* 4-6 Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
          <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            All Applications
          </Link>
          <Link to="/upload" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Upload & Analyze
          </Link>
        </nav>

        {/* Action Zone */}
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link
            to="/upload"
            className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs transition-colors"
          >
            New Resume
          </Link>
        </div>
      </header>

      {/* MOBILE STICKY VIEW TOGGLE (<lg) */}
      <div className="lg:hidden sticky top-[53px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileTab("analysis")}
            className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === "analysis"
                ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <FaChartPie className="w-3.5 h-3.5" />
            <span>Analysis Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === "preview"
                ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <FaFileAlt className="w-3.5 h-3.5" />
            <span>Resume Document</span>
          </button>
        </div>
      </div>

      {/* COMPARISON MODAL */}
      {showComparison && feedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col">
            <ResumeScoreComparison
              currentResumeId={id}
              currentFeedback={feedback}
              companyName={resumeMeta.companyName}
              jobTitle={resumeMeta.jobTitle}
              isModal={true}
              onClose={() => setShowComparison(false)}
            />
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {isExpandedPreview && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 text-white border-b border-white/20">
            <div className="flex items-center gap-2">
              <FaFileAlt className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm sm:text-base">Document Inspector</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpandedPreview(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4">
            <img
              src={previewUrl}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white"
              alt="Resume full view"
            />
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 w-full">
        {/* Loading / Polling state */}
        {polling || (!feedback && !previewError && !retrying) ? (
          <div className="max-w-xl mx-auto py-24 px-4 text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Auditing Resume Structure & ATS Grammar...
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Evaluating {resumeMeta.jobTitle || "your resume"} against applicant tracking benchmarks.
              </p>
            </div>
            <div className="w-full max-w-sm bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : feedback && "error" in feedback ? (
          /* Error recovery state */
          <div className="max-w-xl mx-auto py-16 px-4">
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Analysis Recovery Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {(feedback as any).message && !(feedback as any).message.includes("Analysis failed")
                  ? (feedback as any).message
                  : "The evaluation service encountered a temporary timeout. Click below to run instant heuristic ATS scoring."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <FaRocket className="w-3.5 h-3.5" />
                  <span>{retrying ? "Analyzing..." : "Retry Analysis Now"}</span>
                </button>
                <Link
                  to="/upload"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Upload Another File
                </Link>
              </div>
            </div>
          </div>
        ) : feedback ? (
          /* Populated Analysis Dashboard State */
          <div className="w-full">
            {workspaceMode === "full" ? (
              /* FULL DASHBOARD VIEW (Maximum 1440px analytical layout) */
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <ResumeAnalysisDashboard
                  resumeId={id || ""}
                  feedback={feedback}
                  companyName={resumeMeta.companyName}
                  jobTitle={resumeMeta.jobTitle}
                  jobDescription={resumeMeta.jobDescription}
                  previewUrl={previewUrl}
                  onRetry={handleRetry}
                  isRetrying={retrying}
                  onToggleComparison={() => setShowComparison((prev) => !prev)}
                  historyCount={historyCount}
                  workspaceMode={workspaceMode}
                  setWorkspaceMode={setWorkspaceMode}
                />
              </div>
            ) : (
              /* SPLIT VIEW (Document Preview on Left, Dashboard on Right) */
              <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-57px)]">
                {/* Left Column: Document Preview */}
                <aside
                  className={`lg:w-[380px] xl:w-[440px] 2xl:w-[480px] shrink-0 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] border-r border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-4 sm:p-6 flex flex-col items-center justify-between overflow-y-auto ${
                    mobileTab === "preview" ? "flex" : "hidden lg:flex"
                  }`}
                >
                  <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Document Source
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExpandedPreview(true)}
                      className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                      title="Open Fullscreen Inspector"
                    >
                      <FaExpand className="w-2.5 h-2.5" />
                      <span>Full View</span>
                    </button>
                  </div>

                  <div className="flex-1 w-full flex items-center justify-center my-auto">
                    {loadingImage ? (
                      <p className="text-xs text-slate-400 animate-pulse">Rendering document...</p>
                    ) : previewUrl ? (
                      <div className="w-full max-h-[72vh] flex items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Resume Preview"
                          className="w-full h-auto max-h-[70vh] object-contain rounded"
                          onError={handleImageError}
                        />
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <FaFileAlt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                        <p className="text-xs">Document thumbnail not saved on disk</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode("full")}
                      className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <FaColumns className="w-3 h-3" />
                      <span>Expand Dashboard</span>
                    </button>
                    <span className="font-mono text-[11px] text-slate-400">PDF / DOCX</span>
                  </div>
                </aside>

                {/* Right Column: Dashboard Layout */}
                <section
                  className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto ${
                    mobileTab === "analysis" ? "block" : "hidden lg:block"
                  }`}
                >
                  <ResumeAnalysisDashboard
                    resumeId={id || ""}
                    feedback={feedback}
                    companyName={resumeMeta.companyName}
                    jobTitle={resumeMeta.jobTitle}
                    jobDescription={resumeMeta.jobDescription}
                    previewUrl={previewUrl}
                    onRetry={handleRetry}
                    isRetrying={retrying}
                    onToggleComparison={() => setShowComparison((prev) => !prev)}
                    historyCount={historyCount}
                    workspaceMode={workspaceMode}
                    setWorkspaceMode={setWorkspaceMode}
                  />
                </section>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Resume;
