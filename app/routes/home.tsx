import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { useApiStore } from "~/lib/api";

export const meta = () => [
  { title: "Resume Genie | Home" },
  { name: "description", content: "AI-powered resume analysis" },
];

const Home = () => {
  const { isAuthenticated, isLoading, getAllResumes, deleteResume } =
    useApiStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);

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
          <h1 className="text-5xl md:text-6xl">
            Your Dashboard For
            <br />
            <span className="text-gradient">Applications</span> &{" "}
            <span className="font-bold text-black">Resume Insights</span>.
          </h1>
          <p className="text-xl text-gray-600 mt-4">
            Review your submissions and access AI-powered feedback.
          </p>
        </div>

        <div className="resumes-section mt-12">
          {resumes.length > 0 ? (
            resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                id={resume.id}
                companyName={resume.companyName}
                jobTitle={resume.jobTitle}
                imagePath={resume.imagePath}
                score={resume.feedback?.overallScore || 0}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 w-full">
              <p className="text-gray-600 text-xl mb-4">
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
