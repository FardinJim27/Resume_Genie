import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import ResumeScoreComparison from "~/components/ResumeScoreComparison";
import { getAnalysesHistory } from "~/lib/historyStorage";
import { useApiStore } from "~/lib/api";
import { FaBalanceScale } from "react-icons/fa";

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
      const data = await getAllResumes();
      setResumes(data);
    };

    if (isAuthenticated) {
      loadResumes();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id: string) => {
    const success = await deleteResume(id);
    if (success) {
      // Remove the deleted resume from the local state
      setResumes(resumes.filter((resume) => resume.id !== id));
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

          {historyCount > 0 && (
            <div className="mt-6 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowComparisonModal(true)}
                className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <FaBalanceScale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Compare Resume Score Versions</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 text-xs font-bold">
                  {historyCount} in local storage
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Comparison Modal Overlay */}
        {showComparisonModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[92vh] flex flex-col">
              <ResumeScoreComparison
                isModal={true}
                onClose={() => setShowComparisonModal(false)}
              />
            </div>
          </div>
        )}

        <div className="resumes-section mt-8 md:mt-12 px-4">
          {resumes.length > 0 ? (
            resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                id={resume.id}
                companyName={resume.companyName}
                jobTitle={resume.jobTitle}
                imagePath={resume.imagePath}
                resumePath={resume.resumePath}
                score={resume.feedback?.overallScore || 0}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 w-full">
              <p className="text-gray-600 dark:text-slate-300 text-xl mb-4">
                No resumes analyzed yet
              </p>
              <Link
                to="/upload"
                className="inline-block primary-button max-w-xs"
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
