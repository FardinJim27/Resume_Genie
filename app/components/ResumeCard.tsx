import { Link, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import ScoreCircle from "~/components/ScoreCircle";
import { useApiStore } from "~/lib/api";
import { convertPdfToImage } from "~/lib/pdf2img";
import Swal from "sweetalert2";
import { FaRocket, FaFilePdf } from "react-icons/fa";
import { AiOutlineDelete, AiOutlineDownload } from "react-icons/ai";
import { exportResumeAnalysisToPDF } from "~/lib/pdfExport";

interface ResumeCardProps {
  id: string;
  companyName: string;
  jobTitle: string;
  imagePath: string;
  resumePath: string;
  score: number;
  feedback?: Feedback | null;
  onDelete?: (id: string) => void;
}

const ResumeCard = ({
  id,
  companyName,
  jobTitle,
  imagePath,
  resumePath,
  score,
  feedback,
  onDelete,
}: ResumeCardProps) => {
  const { getFileUrl } = useApiStore();
  const navigate = useNavigate();
  // getFileUrl handles both data URLs (new records) and filename URLs (legacy)
  const imageUrl = imagePath ? getFileUrl(imagePath) : "";
  const pdfUrl = resumePath ? getFileUrl(resumePath) : "";
  const [previewUrl, setPreviewUrl] = useState(imageUrl);
  const [previewError, setPreviewError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreviewUrl(imageUrl || "");
    setPreviewError(false);
    // No stored image — try rendering from the PDF immediately
    if (!imageUrl && pdfUrl && !pdfUrl.startsWith("data:")) {
      fetch(pdfUrl)
        .then((res) => {
          if (!res.ok) throw new Error("PDF not found");
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
        .catch(() => setPreviewError(true));
    } else if (!imageUrl && !pdfUrl) {
      setPreviewError(true);
    }
  }, [imageUrl, pdfUrl]);

  const handleImageError = () => {
    // For old records where server files are gone, try PDF fallback
    if (!pdfUrl || pdfUrl.startsWith("data:")) {
      setPreviewError(true);
      return;
    }
    fetch(pdfUrl)
      .then((res) => {
        if (!res.ok) throw new Error("PDF not found");
        return res.blob();
      })
      .then((blob) => {
        const file = new File([blob], "resume.pdf", { type: "application/pdf" });
        return convertPdfToImage(file);
      })
      .then((result) => {
        if (result.imageUrl) setPreviewUrl(result.imageUrl);
        else setPreviewError(true);
      })
      .catch(() => setPreviewError(true));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/resume/${id}`);
  };

  const handleExportPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);

    try {
      let fb = feedback;
      if (!fb) {
        const full = await useApiStore.getState().getResume(id);
        fb = full?.feedback || null;
      }
      if (fb) {
        await exportResumeAnalysisToPDF({
          resumeId: id,
          feedback: fb,
          companyName,
          jobTitle,
        });
        Swal.fire({
          title: "Report Downloaded!",
          text: `PDF report for ${jobTitle} has been downloaded.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        navigate(`/resume/${id}`);
      }
    } catch (err) {
      console.error("Failed to export PDF from card:", err);
      navigate(`/resume/${id}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      onDelete?.(id);
      Swal.fire({
        title: "Deleted!",
        text: "Your resume has been deleted.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    }
    setShowMenu(false);
  };

  return (
    <div className="resume-card animate-in fade-in duration-1000 hover:scale-[1.02] transition-transform relative">
      <Link to={`/resume/${id}`} className="block">
        <div className="resume-card-header">
          <div className="flex flex-col gap-1 flex-1">
            {companyName && (
              <h2 className="!text-2xl !text-black dark:!text-white font-bold break-words">
                {companyName}
              </h2>
            )}
            {jobTitle && (
              <p className="text-base text-gray-500 dark:text-slate-400 font-normal">{jobTitle}</p>
            )}
            {!companyName && !jobTitle && (
              <h2 className="!text-2xl !text-black dark:!text-white font-bold">Resume</h2>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <ScoreCircle score={score} />
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
              title="Delete resume from database"
              aria-label="Delete resume"
            >
              <AiOutlineDelete className="w-5 h-5" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                aria-label="More options"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-slate-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                  <button
                    onClick={handleOpen}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Open Review
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="w-full px-4 py-2 text-left text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <AiOutlineDownload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Download PDF Report
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/resume/${id}#career-growth`);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <FaRocket className="w-3.5 h-3.5" />
                    Career Growth & Skills
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {previewError ? (
          <div className="gradient-border animate-in fade-in duration-500 flex-1">
            <div className="w-full h-full bg-gray-50 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-2 py-8">
              <svg
                className="w-10 h-10 text-gray-300"
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
              <p className="text-gray-400 text-xs text-center px-4">
                Preview unavailable
              </p>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="gradient-border animate-in fade-in duration-1000 flex-1">
            <div className="w-full h-full bg-white rounded-xl overflow-hidden">
              <img
                src={previewUrl}
                alt="resume preview"
                className="w-full h-full object-contain"
                onError={handleImageError}
              />
            </div>
          </div>
        ) : null}
      </Link>
    </div>
  );
};

export default ResumeCard;
