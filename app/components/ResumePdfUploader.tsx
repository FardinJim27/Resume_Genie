import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useApiStore, type BackendParseResponse } from "~/lib/api";
import { formatSize } from "~/lib/utils";
import {
  AiOutlineFilePdf,
  AiOutlineCloudUpload,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineCopy,
  AiOutlineCheck,
  AiOutlineReload,
  AiOutlineInfoCircle,
  AiOutlineEye,
  AiOutlineDelete,
} from "react-icons/ai";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaLinkedin,
  FaGithub,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
  FaServer,
} from "react-icons/fa";

export interface ResumePdfUploaderProps {
  /** Callback fired when a file is selected or cleared */
  onFileSelect?: (file: File | null) => void;
  /** Callback fired when the backend finishes parsing the PDF */
  onParsed?: (data: BackendParseResponse | null, file: File | null) => void;
  /** Optional pre-selected file */
  initialFile?: File | null;
  /** Optional custom styling classes */
  className?: string;
  /** Optional auto-parse on drop (defaults to true) */
  autoParse?: boolean;
}

export const ResumePdfUploader: React.FC<ResumePdfUploaderProps> = ({
  onFileSelect,
  onParsed,
  initialFile = null,
  className = "",
  autoParse = true,
}) => {
  const { parseResumeWithBackend } = useApiStore();
  const [file, setFile] = useState<File | null>(initialFile);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<BackendParseResponse | null>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchWord, setSearchWord] = useState("");

  const maxFileSize = 20 * 1024 * 1024; // 20 MB

  // Handler to parse PDF with backend endpoint
  const parseWithBackend = useCallback(
    async (targetFile: File) => {
      setIsUploading(true);
      setError(null);
      setUploadStep("Connecting to backend PDF parser endpoint...");

      try {
        await new Promise((r) => setTimeout(r, 120));
        setUploadStep("Streaming file & executing pdf-parse extraction...");

        const result = await parseResumeWithBackend(targetFile);

        if (!result || !result.success) {
          throw new Error(
            result?.error || "Backend failed to extract readable text from this PDF.",
          );
        }

        setUploadStep("Extracting contact info & document structure...");
        await new Promise((r) => setTimeout(r, 80));

        const enrichedPayload: any = {
          ...result,
          rawText: result.extractedText,
          cleanText: result.cleanText || result.extractedText,
          contact: {
            emails: result.detectedContact?.email ? [result.detectedContact.email] : [],
            phones: result.detectedContact?.phone ? [result.detectedContact.phone] : [],
            linkedin: result.detectedContact?.linkedin,
            github: result.detectedContact?.github,
          },
          sections: {
            summary: (result.detectedSections || []).some((s) => /summary|objective/i.test(s)),
            experience: (result.detectedSections || []).some((s) => /experience|work/i.test(s)),
            education: (result.detectedSections || []).some((s) => /education/i.test(s)),
            skills: (result.detectedSections || []).some((s) => /skills/i.test(s)),
            projects: (result.detectedSections || []).some((s) => /projects/i.test(s)),
            certifications: (result.detectedSections || []).some((s) => /certifications/i.test(s)),
          },
        };

        setParsedData(result);
        onParsed?.(enrichedPayload, targetFile);
      } catch (err: any) {
        console.error("[ResumePdfUploader] Parse error:", err);
        const errorMsg =
          err?.message ||
          "Could not parse the PDF resume. Ensure the file contains selectable text and is not encrypted.";
        setError(errorMsg);
        setParsedData(null);
        onParsed?.(null, targetFile);
      } finally {
        setIsUploading(false);
        setUploadStep("");
      }
    },
    [parseResumeWithBackend, onParsed],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors?.[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum allowed size is ${formatSize(maxFileSize)}.`);
        } else {
          setError("Invalid format. Please upload a standard PDF (.pdf) resume.");
        }
        return;
      }

      if (acceptedFiles.length === 0) return;

      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setError(null);
      setParsedData(null);
      onFileSelect?.(selectedFile);

      if (autoParse) {
        await parseWithBackend(selectedFile);
      }
    },
    [autoParse, onFileSelect, parseWithBackend],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: maxFileSize,
    disabled: isUploading,
  });

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFile(null);
    setParsedData(null);
    setError(null);
    setShowExtractedText(false);
    onFileSelect?.(null);
    onParsed?.(null, null);
  };

  const handleCopyText = async () => {
    if (!parsedData?.extractedText) return;
    try {
      await navigator.clipboard.writeText(parsedData.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className={`w-full flex flex-col gap-3 font-sans ${className}`}>
      {/* 1. DROPZONE UPLOAD AREA */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
            isDragActive && !isDragReject
              ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 scale-[1.008]"
              : isDragReject
              ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/30"
              : "border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
          } shadow-xs`}
        >
          <input {...getInputProps()} id="resume-pdf-input" aria-label="Upload PDF Resume" />

          {/* Upload Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shadow-xs mb-4">
            <AiOutlineCloudUpload className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {isDragActive
              ? isDragReject
                ? "Unsupported format. Drop a PDF file"
                : "Drop your PDF resume here"
              : "Drag & drop your PDF resume here"}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            or <span className="text-amber-600 dark:text-amber-400 font-semibold underline underline-offset-2">browse files</span> from your device. Supported formats: <strong>PDF</strong>, DOCX (up to 20MB)
          </p>

          <div className="mt-5 flex items-center gap-2 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60">
            <FaServer className="w-3 h-3 text-amber-500" />
            <span>Integrated with backend <code className="text-slate-700 dark:text-slate-300 font-bold">/api/resumes/parse</code></span>
          </div>
        </div>
      ) : (
        /* 2. FILE SELECTED & PARSING / PARSED VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4 animate-in fade-in duration-200">
          {/* File Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 shadow-2xs">
                <AiOutlineFilePdf className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{formatSize(file.size)}</span>
                  <span>•</span>
                  <span>PDF Document</span>
                  {parsedData && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <AiOutlineCheckCircle className="w-3.5 h-3.5" />
                        Backend Parsed
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => parseWithBackend(file)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Re-run backend PDF parser"
                >
                  <AiOutlineReload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Re-parse</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Remove and upload different resume"
              >
                <AiOutlineDelete className="w-3.5 h-3.5 text-rose-500" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* 3. PARSING IN PROGRESS SPINNER */}
          {isUploading && (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Parsing PDF Resume on Server...
                </p>
                <p className="text-amber-700/80 dark:text-amber-300/80 font-mono mt-0.5">
                  {uploadStep}
                </p>
              </div>
            </div>
          )}

          {/* 4. ERROR MESSAGE */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AiOutlineCloseCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Parsing Error: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* 5. BACKEND PARSE RESULTS & METADATA CARDS */}
          {parsedData && !isUploading && (
            <div className="space-y-3 pt-1">
              {/* Document Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Page Count
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {parsedData.pageCount} {parsedData.pageCount === 1 ? "page" : "pages"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Word Count
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {parsedData.wordCount.toLocaleString()} words
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Character Count
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {parsedData.charCount.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Parser Engine
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <AiOutlineCheckCircle className="w-3.5 h-3.5" />
                    pdf-parse API
                  </span>
                </div>
              </div>

              {/* Detected Contact Details (if any detected by backend) */}
              {parsedData.detectedContact &&
                (parsedData.detectedContact.email ||
                  parsedData.detectedContact.phone ||
                  parsedData.detectedContact.linkedin ||
                  parsedData.detectedContact.github) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Detected Contact:
                    </span>
                    {parsedData.detectedContact.email && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
                        <FaEnvelope className="w-3 h-3 text-amber-500" />
                        {parsedData.detectedContact.email}
                      </span>
                    )}
                    {parsedData.detectedContact.phone && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
                        <FaPhoneAlt className="w-3 h-3 text-emerald-500" />
                        {parsedData.detectedContact.phone}
                      </span>
                    )}
                    {parsedData.detectedContact.linkedin && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
                        <FaLinkedin className="w-3 h-3 text-blue-500" />
                        LinkedIn
                      </span>
                    )}
                    {parsedData.detectedContact.github && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
                        <FaGithub className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                        GitHub
                      </span>
                    )}
                  </div>
                )}

              {/* Detected Sections Pills */}
              {parsedData.detectedSections && parsedData.detectedSections.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Recognized Sections:
                  </span>
                  {parsedData.detectedSections.map((sec, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-medium text-[11px]"
                    >
                      ✓ {sec}
                    </span>
                  ))}
                </div>
              )}

              {/* Extracted Text Drawer / Accordion */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowExtractedText((prev) => !prev)}
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    <AiOutlineEye className="w-4 h-4 text-amber-500" />
                    <span>
                      {showExtractedText ? "Hide Extracted Text" : "Inspect Backend Parsed Text"}
                    </span>
                    {showExtractedText ? (
                      <FaChevronUp className="w-2.5 h-2.5 text-slate-400" />
                    ) : (
                      <FaChevronDown className="w-2.5 h-2.5 text-slate-400" />
                    )}
                  </button>

                  {showExtractedText && (
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <AiOutlineCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <AiOutlineCopy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Raw Text</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {showExtractedText && (
                  <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                    <div className="relative">
                      <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-text border border-slate-800 shadow-inner">
                        {parsedData.extractedText}
                      </pre>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      This parsed text will be passed to Gemini API for ATS compatibility scoring and feedback generation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumePdfUploader;
