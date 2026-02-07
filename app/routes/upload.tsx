import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { useApiStore } from "~/lib/api";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import Swal from "sweetalert2";

const Upload = () => {
  const { isLoading, uploadResume } = useApiStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);

    setStatusText("Converting to image...");
    const imageResult = await convertPdfToImage(file);

    if (imageResult.error) {
      console.error("Image conversion error:", imageResult.error);
    }

    if (!imageResult.file) {
      console.warn("No image file generated, will upload without preview");
    }

    setStatusText("Uploading resume...");
    const resumeId = await uploadResume(
      file,
      imageResult.file,
      companyName,
      jobTitle,
      jobDescription,
    );

    if (!resumeId) {
      Swal.fire({
        title: "Upload Failed!",
        text: "Failed to upload resume. Please try again.",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      setIsProcessing(false);
      return;
    }

    setStatusText("Analysis in progress, redirecting...");

    // Show success message
    Swal.fire({
      title: "Upload Successful!",
      text: "Your resume is being analyzed...",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });

    // Poll for analysis completion
    setTimeout(() => {
      navigate(`/resume/${resumeId}`);
    }, 2000);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-8 md:py-16">
          <h1 className="px-4">Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full max-w-md" />
            </>
          ) : (
            <h2 className="px-4">Drop Your Resume for an ATS Score and Improvement Tips</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 md:gap-4 mt-6 md:mt-8 w-full max-w-2xl px-4"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={!file || isProcessing}
              >
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
