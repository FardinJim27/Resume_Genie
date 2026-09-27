import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  parseResumeFile,
  type ParsedResumeData,
} from "../lib/resumeParser";
import { formatSize } from "../lib/utils";
import {
  AiOutlineFilePdf,
  AiOutlineFileWord,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineCopy,
  AiOutlineCheck,
  AiOutlineEdit,
  AiOutlineReload,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaFileAlt,
  FaRobot,
} from "react-icons/fa";

export interface ResumeParserUploaderProps {
  onFileSelect?: (file: File | null) => void;
  onParsed?: (data: ParsedResumeData | null, file: File | null) => void;
  initialFile?: File | null;
  className?: string;
}

export const ResumeParserUploader = ({
  onFileSelect,
  onParsed,
  initialFile,
  className = "",
}: ResumeParserUploaderProps) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "sections" | "preview">("text");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [copied, setCopied] = useState(false);

  const maxFileSize = 20 * 1024 * 1024; // 20MB

  const handleParse = async (targetFile: File) => {
    setIsParsing(true);
    setParseError(null);
    setParsingStep("Reading document...");

    try {
      await new Promise((r) => setTimeout(r, 150));
      setParsingStep("Extracting text and structure...");
      const data = await parseResumeFile(targetFile);

      setParsingStep("Analyzing ATS readability & sections...");
      await new Promise((r) => setTimeout(r, 150));

      setParsedData(data);
      setEditedText(data.cleanText);
      onParsed?.(data, targetFile);
    } catch (err: any) {
      console.error("Resume parsing error:", err);
      const msg = err?.message || "Failed to extract text from resume";
      setParseError(msg);
      setParsedData(null);
      onParsed?.(null, targetFile);
    } finally {
      setIsParsing(false);
      setParsingStep("");
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors?.[0]?.code === "file-too-large") {
          setParseError(`File is too large. Maximum size is ${formatSize(maxFileSize)}.`);
        } else {
          setParseError("Invalid file type. Please upload a PDF (.pdf) or Word document (.docx).");
        }
        return;
      }

      const selected = acceptedFiles[0] || null;
      setFile(selected);
      onFileSelect?.(selected);

      if (selected) {
        await handleParse(selected);
      } else {
        setParsedData(null);
        setEditedText("");
        onParsed?.(null, null);
      }
    },
    [onFileSelect, onParsed, maxFileSize],
  );

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFile(null);
    setParsedData(null);
    setEditedText("");
    setParseError(null);
    setIsEditing(false);
    onFileSelect?.(null);
    onParsed?.(null, null);
  };

  const handleCopyText = async () => {
    const textToCopy = isEditing ? editedText : parsedData?.cleanText || "";
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy to clipboard", err);
    }
  };

  const handleSaveEditedText = () => {
    setIsEditing(false);
    if (parsedData) {
      const updated: ParsedResumeData = {
        ...parsedData,
        cleanText: editedText,
        wordCount: editedText.split(/\s+/).filter(Boolean).length,
        charCount: editedText.length,
      };
      setParsedData(updated);
      onParsed?.(updated, file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: maxFileSize,
    disabled: isParsing,
  });

  const isDocx = file?.name.toLowerCase().endsWith(".docx");

  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      {/* Dropzone Area when no file or when re-uploading */}
      {!file && (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm ${
            isDragActive
              ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 scale-[1.01]"
              : "border-gray-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-gray-50/80 dark:hover:bg-slate-800/80"
          }`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                <AiOutlineFilePdf className="w-8 h-8" />
              </div>
              <div className="text-gray-300 dark:text-slate-600 font-bold text-xl">+</div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <AiOutlineFileWord className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-base md:text-lg font-semibold text-gray-800 dark:text-slate-100">
                <span className="text-amber-600 dark:text-amber-400">Click to upload</span> or drag and drop your resume
              </p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">
                Supports <span className="font-medium text-gray-700 dark:text-slate-300">PDF (.pdf)</span> and{" "}
                <span className="font-medium text-gray-700 dark:text-slate-300">Word (.docx)</span> up to 20MB
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <FaRobot className="w-3.5 h-3.5" />
              Instant text extraction & ATS pre-formatting check
            </div>
          </div>
        </div>
      )}

      {/* Parsing in progress loader */}
      {isParsing && (
        <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">{parsingStep}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Extracting content from {file?.name}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {parseError && !isParsing && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AiOutlineCloseCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Extraction issue</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{parseError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-medium text-red-700 dark:text-red-300 underline hover:text-red-800 dark:hover:text-red-200"
          >
            Try another file
          </button>
        </div>
      )}

      {/* Active File & Extracted Text Dashboard */}
      {file && !isParsing && (
        <div className="border border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all">
          {/* File Header Bar */}
          <div className="p-4 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isDocx
                    ? "bg-blue-600 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {isDocx ? (
                  <AiOutlineFileWord className="w-6 h-6" />
                ) : (
                  <AiOutlineFilePdf className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate max-w-xs md:max-w-md">
                    {file.name}
                  </p>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isDocx
                        ? "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300"
                        : "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {isDocx ? "DOCX" : "PDF"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  <span>{formatSize(file.size)}</span>
                  {parsedData && (
                    <>
                      <span>•</span>
                      <span>
                        {parsedData.pageCount}{" "}
                        {parsedData.pageCount === 1 ? "page" : "pages"}
                      </span>
                      <span>•</span>
                      <span>{parsedData.wordCount.toLocaleString()} words</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => file && handleParse(file)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Re-extract text"
              >
                <AiOutlineReload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reparse</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Quick ATS Pre-Scan Summary Banner */}
          {parsedData && (
            <div className="px-4 py-3 bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-100/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-900 dark:text-amber-300">ATS Parse Score:</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      parsedData.atsReadiness.score >= 80
                        ? "bg-green-100 dark:bg-emerald-950/70 text-green-800 dark:text-emerald-300"
                        : parsedData.atsReadiness.score >= 60
                        ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300"
                        : "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {parsedData.atsReadiness.score}/100
                  </span>
                  <span className="text-gray-600 dark:text-slate-400 capitalize">
                    ({parsedData.atsReadiness.level} scan readability)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <span className="hidden sm:inline">
                  {parsedData.charCount.toLocaleString()} characters extracted
                </span>
                <span>•</span>
                <span>~{parsedData.estimatedReadTimeMinutes} min read</span>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          {parsedData && (
            <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 px-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "text"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                    : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                }`}
              >
                <FaFileAlt className="w-3.5 h-3.5" />
                Extracted Text ({parsedData.wordCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sections")}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === "sections"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                    : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                }`}
              >
                <AiOutlineInfoCircle className="w-3.5 h-3.5" />
                Detected Structure & Skills ({parsedData.extractedSkills.length})
              </button>
              {parsedData.previewUrl && (
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "preview"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                      : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                  }`}
                >
                  <FaGlobe className="w-3.5 h-3.5" />
                  Doc Preview
                </button>
              )}
            </div>
          )}

          {/* Tab Content 1: Extracted Text */}
          {parsedData && activeTab === "text" && (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
                  {isEditing ? "Edit Extracted Resume Text" : "Extracted Clean Text"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <AiOutlineCheck className="w-3.5 h-3.5 text-green-600 dark:text-emerald-400" />
                        <span className="text-green-700 dark:text-emerald-300 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <AiOutlineCopy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handleSaveEditedText}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <AiOutlineCheck className="w-3.5 h-3.5" />
                      Save Edits
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <AiOutlineEdit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={12}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full text-xs font-mono p-3 border border-amber-300 dark:border-amber-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    placeholder="Edit or paste resume text..."
                  />
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Changes made here will be submitted to the AI analyzer for evaluation.
                  </p>
                </div>
              ) : (
                <div className="relative max-h-72 overflow-y-auto p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200/80 dark:border-slate-800 text-xs text-gray-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
                  {parsedData.cleanText || (
                    <span className="text-gray-400 italic">No text extracted.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Detected Structure & Skills */}
          {parsedData && activeTab === "sections" && (
            <div className="p-4 space-y-4">
              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Detected Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-2.5">
                    <FaEnvelope className="text-amber-500 w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate text-gray-800 dark:text-slate-200">
                      {parsedData.contact.emails.length > 0 ? (
                        parsedData.contact.emails.join(", ")
                      ) : (
                        <span className="text-gray-400 italic">No email detected</span>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-2.5">
                    <FaPhoneAlt className="text-amber-500 w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate text-gray-800 dark:text-slate-200">
                      {parsedData.contact.phones.length > 0 ? (
                        parsedData.contact.phones.join(", ")
                      ) : (
                        <span className="text-gray-400 italic">No phone detected</span>
                      )}
                    </span>
                  </div>

                  {parsedData.contact.linkedin && (
                    <div className="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-2.5">
                      <FaLinkedin className="text-blue-600 dark:text-blue-400 w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate text-blue-700 dark:text-blue-300 font-medium">
                        {parsedData.contact.linkedin}
                      </span>
                    </div>
                  )}

                  {parsedData.contact.github && (
                    <div className="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-2.5">
                      <FaGithub className="text-gray-800 dark:text-slate-200 w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate text-gray-800 dark:text-slate-200 font-medium">
                        {parsedData.contact.github}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Sections */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Standard Resume Sections Found
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(parsedData.sections).map(([sec, found]) => (
                    <div
                      key={sec}
                      className={`p-2 rounded-lg border flex items-center gap-2 text-xs capitalize ${
                        found
                          ? "bg-green-50/70 dark:bg-emerald-950/40 border-green-200 dark:border-emerald-800/60 text-green-800 dark:text-emerald-200"
                          : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500"
                      }`}
                    >
                      {found ? (
                        <AiOutlineCheckCircle className="text-green-600 dark:text-emerald-400 w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AiOutlineCloseCircle className="text-gray-400 dark:text-slate-500 w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracted Skills Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Key Competencies Detected ({parsedData.extractedSkills.length})
                  </h4>
                </div>
                {parsedData.extractedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {parsedData.extractedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded-full text-xs font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                    No matching industry keywords detected from common technical skill sets.
                  </p>
                )}
              </div>

              {/* ATS Checks Breakdown */}
              <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  ATS Pre-Scan Checklist
                </h4>
                <div className="space-y-1.5">
                  {parsedData.atsReadiness.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-slate-800/60"
                    >
                      {chk.passed ? (
                        <AiOutlineCheckCircle className="w-4 h-4 text-green-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AiOutlineCloseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{chk.label}: </span>
                        <span className="text-gray-600 dark:text-slate-400">{chk.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Document Preview */}
          {parsedData?.previewUrl && activeTab === "preview" && (
            <div className="p-4 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-slate-800/50">
              <div className="max-w-sm rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <img
                  src={parsedData.previewUrl}
                  alt="Resume preview"
                  className="w-full h-auto object-contain max-h-96"
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-2">
                Page 1 document render preview
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeParserUploader;
