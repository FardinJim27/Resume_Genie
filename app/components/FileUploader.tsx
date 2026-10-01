import ResumePdfUploader, {
  type ResumePdfUploaderProps,
} from "./ResumePdfUploader";
import ResumeParserUploader, {
  type ResumeParserUploaderProps,
} from "./ResumeParserUploader";
import type { ParsedResumeData } from "../lib/resumeParser";
import type { BackendParseResponse } from "../lib/api";

export interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
  onParsed?: (data: (BackendParseResponse & Partial<ParsedResumeData>) | any | null, file: File | null) => void;
  className?: string;
  initialFile?: File | null;
}

const FileUploader = ({
  onFileSelect,
  onParsed,
  initialFile,
  className = "",
}: FileUploaderProps) => {
  return (
    <ResumePdfUploader
      onFileSelect={onFileSelect}
      onParsed={onParsed}
      initialFile={initialFile}
      className={className}
    />
  );
};

export default FileUploader;
export { ResumePdfUploader, ResumeParserUploader };
export type {
  ParsedResumeData,
  BackendParseResponse,
  ResumePdfUploaderProps,
  ResumeParserUploaderProps,
};

