import fs from "fs";
import path from "path";

export interface FileValidationResult {
  isValid: boolean;
  fileType: "pdf" | "docx" | "unknown";
  error?: string;
  details?: {
    size: number;
    detectedMagic?: string;
  };
}

/**
 * Validates file buffer directly in-memory before writing to disk or processing.
 */
export function validateFileBuffer(
  buffer: Buffer,
  originalFilename?: string,
): FileValidationResult {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "Invalid file buffer: Data is missing or corrupted.",
      };
    }

    if (buffer.length === 0) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "The uploaded file is empty (0 bytes).",
      };
    }

    if (buffer.length < 64) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File is too small to be a valid PDF or Word document.",
      };
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB limit
    if (buffer.length > MAX_SIZE) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File size exceeds the 20MB maximum limit.",
      };
    }

    const ext = originalFilename
      ? path.extname(originalFilename).toLowerCase()
      : "";

    // Check PDF magic header: %PDF- (hex: 25 50 44 46)
    const headerAscii = buffer.subarray(0, Math.min(1024, buffer.length)).toString("latin1");
    const isPdfMagic =
      headerAscii.startsWith("%PDF") || headerAscii.includes("%PDF-");

    // Check DOCX magic header: PK\x03\x04 (ZIP format)
    const isDocxMagic =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
      (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

    if (ext === ".pdf") {
      if (!isPdfMagic) {
        return {
          isValid: false,
          fileType: "unknown",
          error: "Invalid PDF format: File header signature (%PDF) is missing or corrupted.",
        };
      }
      return { isValid: true, fileType: "pdf", details: { size: buffer.length, detectedMagic: "%PDF" } };
    }

    if (ext === ".docx") {
      if (!isDocxMagic) {
        return {
          isValid: false,
          fileType: "unknown",
          error: "Invalid DOCX format: The document is corrupted or not a valid Word file.",
        };
      }
      return { isValid: true, fileType: "docx", details: { size: buffer.length, detectedMagic: "PK" } };
    }

    if (isPdfMagic) {
      return { isValid: true, fileType: "pdf", details: { size: buffer.length, detectedMagic: "%PDF" } };
    }

    if (isDocxMagic) {
      return { isValid: true, fileType: "docx", details: { size: buffer.length, detectedMagic: "PK" } };
    }

    return {
      isValid: false,
      fileType: "unknown",
      error: `Unsupported file type "${ext || "unknown"}". Please upload a valid PDF or DOCX document.`,
    };
  } catch (error) {
    return {
      isValid: false,
      fileType: "unknown",
      error: `Buffer validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Validates the physical file integrity, size, and magic bytes signature
 * to prevent corrupted, spoofed, or unparseable files from reaching parsers.
 */
export async function validateUploadedFile(
  filePath: string,
): Promise<FileValidationResult> {
  let fd: fs.promises.FileHandle | null = null;
  try {
    if (!filePath || typeof filePath !== "string") {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File path is missing or invalid.",
      };
    }

    if (!fs.existsSync(filePath)) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "Uploaded file does not exist on disk.",
      };
    }

    const stats = await fs.promises.stat(filePath);

    // Reject empty files
    if (stats.size === 0) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "The uploaded file is empty (0 bytes).",
      };
    }

    // Minimum reasonable size for a valid PDF or DOCX structure
    if (stats.size < 64) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File is too small to be a valid PDF or Word document.",
      };
    }

    // Max size check: 20MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (stats.size > MAX_SIZE) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File size exceeds maximum allowed limit (20MB).",
      };
    }

    // Read the first 2048 bytes for signature header verification
    fd = await fs.promises.open(filePath, "r");
    const readLength = Math.min(2048, stats.size);
    const buffer = Buffer.alloc(readLength);
    await fd.read(buffer, 0, readLength, 0);
    await fd.close();
    fd = null;

    const ext = path.extname(filePath).toLowerCase();

    // Check PDF magic header: %PDF-
    const headerStr = buffer.subarray(0, 1024).toString("latin1");
    const isPdfMagic =
      buffer.subarray(0, 5).toString("ascii").startsWith("%PDF") ||
      headerStr.includes("%PDF-");

    // Check DOCX magic header: PK\x03\x04 (ZIP format)
    const isDocxMagic =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
      (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

    if (ext === ".pdf") {
      if (!isPdfMagic) {
        return {
          isValid: false,
          fileType: "unknown",
          error:
            "Invalid PDF format: File header signature (%PDF) is missing or corrupted.",
        };
      }
      return {
        isValid: true,
        fileType: "pdf",
        details: { size: stats.size, detectedMagic: "%PDF" },
      };
    }

    if (ext === ".docx") {
      if (!isDocxMagic) {
        return {
          isValid: false,
          fileType: "unknown",
          error:
            "Invalid DOCX format: The document is corrupted or not a valid Word file.",
        };
      }
      return {
        isValid: true,
        fileType: "docx",
        details: { size: stats.size, detectedMagic: "PK" },
      };
    }

    // If extension is not specified or ambiguous, determine from magic bytes
    if (isPdfMagic) {
      return {
        isValid: true,
        fileType: "pdf",
        details: { size: stats.size, detectedMagic: "%PDF" },
      };
    }
    if (isDocxMagic) {
      return {
        isValid: true,
        fileType: "docx",
        details: { size: stats.size, detectedMagic: "PK" },
      };
    }

    return {
      isValid: false,
      fileType: "unknown",
      error: `Unsupported file type "${ext}". Please upload a valid PDF or DOCX document.`,
    };
  } catch (error) {
    return {
      isValid: false,
      fileType: "unknown",
      error: `File validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  } finally {
    if (fd) {
      try {
        await fd.close();
      } catch {
        // ignore close error
      }
    }
  }
}
