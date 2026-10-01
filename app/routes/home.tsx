import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import ResumeScoreComparison from "~/components/ResumeScoreComparison";
import { getAnalysesHistory } from "~/lib/historyStorage";
import { useApiStore } from "~/lib/api";
import {
  FaBalanceScale,
  FaThLarge,
  FaList,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaFileAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { AiOutlineDelete, AiOutlineDownload } from "react-icons/ai";
import Swal from "sweetalert2";
import { exportResumeAnalysisToPDF } from "~/lib/pdfExport";

export const meta = () => [
  { title: "Resume Genie | Home" },
  { name: "description", content: "AI-powered resume analysis" },
];

const Home = () => {
  const { isAuthenticated, isLoading, getAllResumes, deleteResume } =
    useApiStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);

  useEffect(() => {
    setHistoryCount(getAnalysesHistory().length);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const loadResumes = async () => {
      let backendData: any[] = [];
      try {
        backendData = await getAllResumes();
      } catch (err) {
        console.warn("Could not fetch resumes from backend:", err);
      }

      const localAnalyses = getAnalysesHistory();
      setHistoryCount(localAnalyses.length);

      // Merge backend resumes with local storage analyses seamlessly
      const mergedMap = new Map<string, any>();

      // 1. Process backend resumes
      if (Array.isArray(backendData)) {
        for (const item of backendData) {
          if (item && item.id) {
            mergedMap.set(item.id, item);
          }
        }
      }

      // 2. Process local storage analyses so previously analyzed resumes are never lost
      if (Array.isArray(localAnalyses)) {
        for (const local of localAnalyses) {
          const key = local.resumeId || local.id;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, {
              id: key,
              companyName: local.companyName || "Target Company",
              jobTitle: local.jobTitle || "Target Role",
              imagePath: "",
              resumePath: "",
              feedback: local.feedback,
              createdAt: new Date(local.timestamp).toISOString(),
              isLocal: true,
            });
          } else {
            // Enrich existing record with feedback if missing
            const existing = mergedMap.get(key);
            if (!existing.feedback && local.feedback) {
              mergedMap.set(key, { ...existing, feedback: local.feedback });
            }
          }
        }
      }

      const finalList = Array.from(mergedMap.values());
      setResumes(finalList);

      // Background-sync local analyses to backend if token is available
      const token = useApiStore.getState().token;
      if (token && localAnalyses.length > 0) {
        fetch("/api/resumes/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ analyses: localAnalyses }),
        }).catch(() => {});
      }
    };

    if (isAuthenticated) {
      loadResumes();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id: string, skipConfirm = false) => {
    if (!skipConfirm) {
      const result = await Swal.fire({
        title: "Delete Resume?",
        text: "This will remove the resume and its analysis from the database.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e11d48",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete it",
      });
      if (!result.isConfirmed) return;
    }

    setDeletingId(id);

    // 1. Trigger database removal
    try {
      await deleteResume(id);
    } catch (err) {
      console.warn("Failed to delete resume from backend database:", err);
    }

    // 2. Remove from local storage
    try {
      const history = getAnalysesHistory();
      const updated = history.filter(
        (item) => item.id !== id && item.resumeId !== id,
      );
      localStorage.setItem(
        "resume_genie_analyses_history_v1",
        JSON.stringify(updated),
      );
      setHistoryCount(updated.length);
    } catch {}

    // 3. Immediately update UI state
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
    setDeletingId(null);

    if (!skipConfirm) {
      Swal.fire({
        title: "Deleted!",
        text: "Resume successfully removed from database.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleExportResumePdf = async (resume: any) => {
    setExportingPdfId(resume.id);
    try {
      let fb = resume.feedback;
      if (!fb) {
        const full = await useApiStore.getState().getResume(resume.id);
        fb = full?.feedback || null;
      }
      if (fb) {
        await exportResumeAnalysisToPDF({
          resumeId: resume.id,
          feedback: fb,
          companyName: resume.companyName || "Target Company",
          jobTitle: resume.jobTitle || "Target Role",
          jobDescription: resume.jobDescription || "",
        });
        Swal.fire({
          title: "Report Downloaded!",
          text: `PDF audit report for ${resume.jobTitle || "Resume"} has been downloaded.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        navigate(`/resume/${resume.id}`);
      }
    } catch (err) {
      console.error("PDF export failed:", err);
      navigate(`/resume/${resume.id}`);
    } finally {
      setExportingPdfId(null);
    }
  };

  return (
    <main className="bg-gradient min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading">
          <h1 className="text-3xl md:text-5xl lg:text-6xl px-4">
            Your Dashboard For
            <br />
            <span className="text-gradient">Applications</span> &{" "}
            <span className="font-bold text-black dark:text-white">Resume Insights</span>.
          </h1>
          <p className="text-base md:text-xl text-gray-600 dark:text-slate-300 mt-4 px-4">
            Review your submissions and access AI-powered feedback.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {historyCount > 0 && (
              <button
                type="button"
                onClick={() => setShowComparisonModal(true)}
                className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <FaBalanceScale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Compare Resume Score Versions</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 text-xs font-bold">
                  {historyCount} saved
                </span>
              </button>
            )}

            <Link
              to="/upload"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm shadow-xs transition-colors"
            >
              + Upload & Analyze
            </Link>
          </div>
        </div>

        {/* Comparison Modal Overlay */}
        {showComparisonModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[92vh] flex flex-col">
              <ResumeScoreComparison
                isModal={true}
                onClose={() => setShowComparisonModal(false)}
                onDelete={(deletedId) => handleDelete(deletedId, true)}
              />
            </div>
          </div>
        )}

        {/* RESUME HISTORY SECTION */}
        <div className="mt-8 md:mt-12 px-4 max-w-7xl mx-auto w-full">
          {/* Controls row */}
          {resumes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-slate-800 gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Resume History & ATS Results</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold border border-amber-200 dark:border-amber-800">
                    {resumes.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Select a resume to inspect detailed ATS metrics or remove it from your database
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900"
                  }`}
                >
                  <FaThLarge className="w-3.5 h-3.5" />
                  <span>Card Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900"
                  }`}
                >
                  <FaList className="w-3.5 h-3.5" />
                  <span>History List</span>
                </button>
              </div>
            </div>
          )}

          {resumes.length > 0 ? (
            viewMode === "grid" ? (
              /* GRID CARDS VIEW */
              <div className="resumes-section">
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    id={resume.id}
                    companyName={resume.companyName}
                    jobTitle={resume.jobTitle}
                    imagePath={resume.imagePath}
                    resumePath={resume.resumePath}
                    score={
                      resume.feedback?.overallScore ||
                      resume.feedback?.ATS?.score ||
                      resume.overallScore ||
                      resume.score ||
                      0
                    }
                    feedback={resume.feedback}
                    onDelete={(id) => handleDelete(id, true)}
                  />
                ))}
              </div>
            ) : (
              /* COMPACT HISTORY LIST VIEW (With explicit Delete button on each item) */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {resumes.map((resume) => {
                    const score =
                      resume.feedback?.overallScore ||
                      resume.feedback?.ATS?.score ||
                      resume.overallScore ||
                      resume.score ||
                      0;
                    const atsScore = resume.feedback?.ATS?.score ?? score;
                    const dateStr = resume.createdAt
                      ? new Date(resume.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently";

                    return (
                      <div
                        key={resume.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Title & Info */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                            <FaFileAlt className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/resume/${resume.id}`}
                              className="text-base font-bold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors block truncate"
                            >
                              {resume.companyName || "Target Company"}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                              {resume.jobTitle || "Role"} • Analyzed {dateStr}
                            </p>
                          </div>
                        </div>

                        {/* Scores & Actions */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          {/* ATS Score pill */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                                atsScore >= 80
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : atsScore >= 60
                                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              }`}
                            >
                              ATS {atsScore}%
                            </span>
                            <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                              Overall: <strong>{score}/100</strong>
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {/* DOWNLOAD PDF REPORT BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleExportResumePdf(resume)}
                              disabled={exportingPdfId === resume.id}
                              className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                              title="Download PDF feedback report"
                            >
                              <AiOutlineDownload className={`w-3.5 h-3.5 ${exportingPdfId === resume.id ? "animate-bounce" : "text-amber-600 dark:text-amber-400"}`} />
                              <span>{exportingPdfId === resume.id ? "PDF..." : "PDF Report"}</span>
                            </button>

                            <Link
                              to={`/resume/${resume.id}`}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <span>View Review</span>
                              <FaExternalLinkAlt className="w-2.5 h-2.5 text-gray-400" />
                            </Link>

                            {/* DELETE BUTTON: Triggers database removal & updates UI */}
                            <button
                              type="button"
                              onClick={() => handleDelete(resume.id)}
                              disabled={deletingId === resume.id}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete resume from database"
                            >
                              <FaTrashAlt className="w-3 h-3 text-rose-500" />
                              <span>{deletingId === resume.id ? "Deleting..." : "Delete"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="col-span-full text-center py-12 w-full bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs">
              <FaFileAlt className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-slate-300 text-xl font-bold mb-1">
                No resumes analyzed yet
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 max-w-sm mx-auto mb-6">
                Upload your resume to get instant ATS parsing, score meter, and AI-powered recommendations.
              </p>
              <Link
                to="/upload"
                className="inline-block primary-button max-w-xs text-sm"
              >
                Upload your first resume
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;

