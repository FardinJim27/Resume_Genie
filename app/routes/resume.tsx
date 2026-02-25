import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useApiStore } from "~/lib/api";
import { convertPdfToImage } from "~/lib/pdf2img";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

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
  const resumePathRef = useRef("");
  const navigate = useNavigate();

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
          }
        } catch (err) {
          console.error("Failed to render PDF preview:", err);
        } finally {
          setLoadingImage(false);
        }
      }

      // Set feedback or start polling if not ready
      if (resume.feedback) {
        setFeedback(resume.feedback);
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
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
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
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <img
                src={previewUrl}
                className="w-full h-full object-contain rounded-2xl"
                title="resume"
                alt="Resume preview"
                onError={handleImageError}
              />
            </div>
          ) : null}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {feedback && !("error" in feedback) ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS?.score || 0}
                suggestions={feedback.ATS?.tips || []}
              />
              <Details feedback={feedback} />
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
    </main>
  );
};

export default Resume;
