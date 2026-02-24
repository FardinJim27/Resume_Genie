import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { useApiStore } from "~/lib/api";
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
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [polling, setPolling] = useState(false);
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

      // Set file URLs
      if (resume.resumePath) {
        setResumeUrl(getFileUrl(resume.resumePath));
      }

      if (resume.imagePath) {
        setImageUrl(getFileUrl(resume.imagePath));
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
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                  alt="Resume preview"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (resumeUrl && !img.dataset.retried) {
                      img.dataset.retried = "true";
                      import("~/lib/pdf2img").then(({ convertPdfToImage }) => {
                        fetch(resumeUrl)
                          .then((res) => res.blob())
                          .then((blob) => {
                            const file = new File([blob], "resume.pdf", {
                              type: "application/pdf",
                            });
                            return convertPdfToImage(file);
                          })
                          .then((result) => {
                            if (result.imageUrl) {
                              img.src = result.imageUrl;
                            }
                          })
                          .catch(console.error);
                      });
                    }
                  }}
                />
              </a>
            </div>
          )}
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
