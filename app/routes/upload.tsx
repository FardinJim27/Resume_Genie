import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { useApiStore } from "~/lib/api";
import { useNavigate } from "react-router";
import { convertPdfToImage, convertPdfToThumbnail } from "~/lib/pdf2img";
import { validateFileIntegrity } from "~/lib/fileValidation";
import type { ParsedResumeData } from "~/lib/resumeParser";
import Swal from "sweetalert2";

const Upload = () => {
  const { isLoading, uploadResume } = useApiStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setParsedData(null);
    }
  };

  const handleParsed = (data: ParsedResumeData | null, selectedFile: File | null) => {
    setParsedData(data);
    if (selectedFile) {
      setFile(selectedFile);
    }
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

    // Validate file integrity before any processing
    const validation = await validateFileIntegrity(file);
    if (!validation.isValid) {
      Swal.fire({
        title: "Invalid File!",
        text: validation.error || "The selected file is corrupted or not a valid document.",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      setIsProcessing(false);
      return;
    }

    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    let imageResult: { file: File | null; error?: string } = { file: null };
    let thumbnailDataUrl = parsedData?.previewUrl || "";

    if (isPdf) {
      setStatusText("Generating preview image...");
      imageResult = await convertPdfToImage(file);
      if (!thumbnailDataUrl) {
        thumbnailDataUrl = await convertPdfToThumbnail(file);
      }
    }

    setStatusText("Uploading and preparing resume...");
    const resumeId = await uploadResume(
      file,
      imageResult.file,
      companyName,
      jobTitle,
      jobDescription,
      thumbnailDataUrl || undefined,
      parsedData?.cleanText || undefined,
    );

    if (!resumeId) {
      const storeError = useApiStore.getState().error;
      Swal.fire({
        title: "Upload Failed!",
        text: storeError || "Failed to upload resume. Please try again.",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      setIsProcessing(false);
      return;
    }

    setStatusText("Analyzing with AI, redirecting...");

    Swal.fire({
      title: "Upload Successful!",
      text: "Your resume is being analyzed...",
      icon: "success",
      timer: 1800,
      showConfirmButton: false,
    });

    setTimeout(() => {
      navigate(`/resume/${resumeId}`);
    }, 1800);
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
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-8 md:py-16">
          <h1 className="px-4">Smart feedback for your dream job</h1>
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4 my-8">
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                alt="Scanning resume"
                className="w-full max-w-md rounded-2xl shadow-lg border border-amber-200"
              />
            </div>
          ) : (
            <h2 className="px-4">
              Drop Your PDF or DOCX Resume for Instant Text Extraction, ATS Scoring, and AI Analysis
            </h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-6 md:mt-8 w-full max-w-2xl px-4"
            >
              <div className="form-div">
                <label htmlFor="company-name">Target Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="e.g. Google, Stripe, Microsoft"
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Target Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="e.g. Senior Frontend Engineer"
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description / Requirements</label>
                <textarea
                  rows={4}
                  name="job-description"
                  placeholder="Paste the target job description or requirements here..."
                  id="job-description"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload & Parse Resume (PDF or DOCX)</label>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  onParsed={handleParsed}
                />
              </div>

              <button
                className="primary-button mt-2"
                type="submit"
                disabled={!file || isProcessing}
              >
                Analyze Resume with AI
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
