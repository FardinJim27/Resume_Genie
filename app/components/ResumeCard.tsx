import { Link, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import ScoreCircle from "~/components/ScoreCircle";
import { useApiStore } from "~/lib/api";
import { convertPdfToImage } from "~/lib/pdf2img";
import Swal from "sweetalert2";

interface ResumeCardProps {
  id: string;
  companyName: string;
  jobTitle: string;
  imagePath: string;
  resumePath: string;
  score: number;
  onDelete?: (id: string) => void;
}

const ResumeCard = ({
  id,
  companyName,
  jobTitle,
  imagePath,
  resumePath,
  score,
  onDelete,
}: ResumeCardProps) => {
  const { getFileUrl } = useApiStore();
  const navigate = useNavigate();
  // getFileUrl handles both data URLs (new records) and filename URLs (legacy)
  const imageUrl = imagePath ? getFileUrl(imagePath) : "";
  const pdfUrl = resumePath ? getFileUrl(resumePath) : "";
  const [previewUrl, setPreviewUrl] = useState(imageUrl);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreviewUrl(imageUrl || "");
  }, [imageUrl]);

  const handleImageError = () => {
    // For old records where server files are gone, try PDF fallback
    if (!pdfUrl || pdfUrl.startsWith("data:")) return;
    fetch(pdfUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "resume.pdf", { type: "application/pdf" });
        return convertPdfToImage(file);
      })
      .then((result) => {
        if (result.imageUrl) setPreviewUrl(result.imageUrl);
      })
      .catch(() => setPreviewUrl(""));
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
              <h2 className="!text-2xl !text-black font-bold break-words">
                {companyName}
              </h2>
            )}
            {jobTitle && (
              <p className="text-base text-gray-500 font-normal">{jobTitle}</p>
            )}
            {!companyName && !jobTitle && (
              <h2 className="!text-2xl !text-black font-bold">Resume</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ScoreCircle score={score} />
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="More options"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleOpen}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
                    Open
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
        {previewUrl && (
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
        )}
      </Link>
    </div>
  );
};

export default ResumeCard;
