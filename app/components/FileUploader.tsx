import ResumeParserUploader, {
  type ResumeParserUploaderProps,
} from "./ResumeParserUploader";
import type { ParsedResumeData } from "../lib/resumeParser";

export interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
  onParsed?: (data: ParsedResumeData | null, file: File | null) => void;
  className?: string;
}

const FileUploader = ({
  onFileSelect,
  onParsed,
  className = "",
}: FileUploaderProps) => {
  return (
    <ResumeParserUploader
      onFileSelect={onFileSelect}
      onParsed={onParsed}
      className={className}
    />
  );
};

export default FileUploader;
export { ResumeParserUploader };
export type { ParsedResumeData };
