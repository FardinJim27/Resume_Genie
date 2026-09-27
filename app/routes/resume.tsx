import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useApiStore } from "~/lib/api";
import { convertPdfToImage } from "~/lib/pdf2img";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import ATSScoreBreakdownChart from "~/components/ATSScoreBreakdownChart";
import ResumeScoreComparison from "~/components/ResumeScoreComparison";
import JobKeywordMatcher from "~/components/JobKeywordMatcher";
import ThemeToggle from "~/components/ThemeToggle";
import { saveAnalysisToHistory, getAnalysesHistory } from "~/lib/historyStorage";
import { FaBalanceScale, FaChartPie, FaFileAlt, FaExpand, FaTimes } from "react-icons/fa";
import { AiOutlineHistory } from "react-icons/ai";

export const meta = () => [
  { title: "Resume Genie | Review " },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { isAuthenticated, isLoading, getResume, getFileUrl } = useApiStore();
  const { id } = useParams();
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [polling, setPolling] = useState(false);
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

  useEffect(() => {
    const loadResume = async () => {
      if (!id) return;

      const resume = await getResume(id);
      if (!resume) return;

      // Set image URL directly; onError on the <img> handles broken images
      if (resume.imagePath) {
        resumePathRef.current = resume.resumePath || "";
        setPreviewUrl(getFileUrl(resume.imagePath));
      } else if (resume.resumePath) {
        // No image stored — render PDF first page immediately
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
            // PDF file no longer on server (ephemeral disk wiped)
            setPreviewError(true);
          }
        } catch (err) {
          console.error("Failed to render PDF preview:", err);
          setPreviewError(true);
        } finally {
          setLoadingImage(false);
        }
      } else {
        // No image and no PDF path stored at all
        setPreviewError(true);
      }

      // Store metadata
      setResumeMeta({
        companyName: resume.companyName || "",
        jobTitle: resume.jobTitle || "",
        jobDescription: resume.jobDescription || "",
      });

      // Set feedback or start polling if not ready
      if (resume.feedback) {
        setFeedback(resume.feedback);
        setPolling(false);
        saveAnalysisToHistory(
          resume.id,
          resume.companyName || "",
          resume.jobTitle || "",
          resume.feedback,
        );
        setHistoryCount(getAnalysesHistory().length);
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
    }, 3000);

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
    <main className="!pt-0">
      <nav className="resume-nav flex items-center justify-between">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 dark:text-slate-200 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
        </div>
      </nav>
      {/* Mobile Sticky View Switcher */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 shadow-xs">
        <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileTab("analysis")}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === "analysis"
                ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <FaChartPie className="w-3.5 h-3.5" />
            <span>ATS Review & Scores</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === "preview"
                ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <FaFileAlt className="w-3.5 h-3.5" />
            <span>Resume Document</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-65px)]">
        {/* Left Column: Resume Preview */}
        <section
          className={`feedback-section bg-[url('/images/bg-small.svg')] bg-cover items-center justify-center lg:sticky lg:top-0 lg:h-[100vh] lg:flex ${
            mobileTab === "preview" ? "flex min-h-[60vh] py-6" : "hidden lg:flex"
          }`}
        >
          {loadingImage ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">Loading preview...</p>
            </div>
          ) : previewError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-sm font-medium">Preview unavailable</p>
              <p className="text-gray-400 text-xs text-center px-8">
                Re-upload this resume to restore the preview
              </p>
            </div>
          ) : previewUrl ? (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="gradient-border w-full max-w-lg lg:max-w-xl max-h-[75vh] sm:max-h-[85vh] flex items-center justify-center overflow-auto shadow-md">
                <img
                  src={previewUrl}
                  className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain rounded-xl shadow-xs"
                  title="Resume Document Preview"
                  alt="Resume preview"
                  onError={handleImageError}
                />
              </div>

              {/* Quick action bar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpandedPreview(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/95 dark:bg-slate-800/95 border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FaExpand className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                  <span>Full View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("analysis")}
                  className="lg:hidden px-3.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FaChartPie className="w-3 h-3" />
                  <span>View ATS Scores</span>
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Right Column: Feedback, ATS Score Charts & Suggestions */}
        <section
          className={`feedback-section w-full lg:w-1/2 overflow-y-auto ${
            mobileTab === "analysis" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-gray-900 dark:text-white font-bold">
              Resume Review
            </h2>
            {feedback && !("error" in feedback) && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowComparison((prev) => !prev)}
                  className="px-3 sm:px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FaBalanceScale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {showComparison ? "Hide Comparison" : "Compare Versions"}
                  </span>
                  {historyCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-bold">
                      {historyCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("preview")}
                  className="lg:hidden px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="View Resume Document"
                >
                  <FaFileAlt className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                  <span>Document</span>
                </button>
              </div>
            )}
          </div>

          {showComparison && feedback && (
            <div className="w-full my-2 animate-in fade-in duration-300">
              <ResumeScoreComparison
                currentResumeId={id}
                currentFeedback={feedback}
                companyName={resumeMeta.companyName}
                jobTitle={resumeMeta.jobTitle}
                onClose={() => setShowComparison(false)}
              />
            </div>
          )}

          {feedback && !("error" in feedback) ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATSScoreBreakdownChart feedback={feedback} />
              <JobKeywordMatcher
                jobDescription={resumeMeta.jobDescription}
                jobTitle={resumeMeta.jobTitle}
                companyName={resumeMeta.companyName}
                feedback={feedback}
              />
              <ATS
                score={feedback.ATS?.score || 0}
                suggestions={feedback.ATS?.tips || []}
              />
              <Details
                feedback={feedback}
                resumeId={id || ""}
                jobTitle={resumeMeta.jobTitle}
                companyName={resumeMeta.companyName}
              />
            </div>
          ) : feedback && "error" in feedback ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-800 mb-2">
                  Analysis Failed
                </h3>
                <p className="text-red-600">
                  {(feedback as any).message ||
                    "An error occurred during analysis"}
                </p>
                <Link
                  to="/upload"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Try uploading again
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <img src="/images/resume-scan-2.gif" className="w-full" />
              <p className="mt-4 text-gray-600">Analyzing your resume...</p>
            </div>
          )}
        </section>
      </div>

      {/* Fullscreen Expand Preview Modal */}
      {isExpandedPreview && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 text-white border-b border-white/20">
            <div className="flex items-center gap-2">
              <FaFileAlt className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm sm:text-base">Resume Document Preview</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpandedPreview(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              title="Close Fullscreen"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4">
            <img
              src={previewUrl}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white"
              alt="Resume full preview"
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default Resume;
