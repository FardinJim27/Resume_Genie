/**
 * Client-side file integrity and signature validator for PDF and DOCX uploads.
 * Validates file existence, size constraints, and magic byte headers before
 * any parsing or network upload occurs.
 */

export interface ClientFileValidationResult {
  isValid: boolean;
  fileType: "pdf" | "docx" | "unknown";
  error?: string;
  fileSizeFormatted?: string;
}

/**
 * Validates the physical integrity and binary header signatures of an uploaded File.
 * Prevents corrupted files, zero-byte files, and renamed files from triggering
 * parser null reference errors or server exceptions.
 */
export async function validateFileIntegrity(
  file: unknown,
): Promise<ClientFileValidationResult> {
  // 1. Basic existence and type check
  if (!file || !(file instanceof File)) {
    return {
      isValid: false,
      fileType: "unknown",
      error: "No valid file selected. Please choose a PDF or DOCX resume.",
    };
  }

  const fileName = file.name || "";
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  // 2. Extension check
  if (ext !== ".pdf" && ext !== ".docx") {
    return {
      isValid: false,
      fileType: "unknown",
      error: `Unsupported file extension "${ext || "unknown"}". Only .pdf and .docx documents are accepted.`,
    };
  }

  // 3. File size constraints
  if (file.size === 0) {
    return {
      isValid: false,
      fileType: "unknown",
      error: "The selected file is empty (0 bytes). Please upload a complete document.",
    };
  }

  if (file.size < 64) {
    return {
      isValid: false,
      fileType: "unknown",
      error: "The file is too small to be a valid document (under 64 bytes).",
    };
  }

  const MAX_SIZE = 20 * 1024 * 1024; // 20 MB limit
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      fileType: "unknown",
      error: "File size exceeds the 20MB limit. Please upload a smaller resume.",
    };
  }

  // 4. Binary header / Magic byte signature verification
  try {
    const headerBytesToRead = Math.min(1024, file.size);
    const headerBlob = file.slice(0, headerBytesToRead);
    const arrayBuffer = await headerBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (bytes.length < 4) {
      return {
        isValid: false,
        fileType: "unknown",
        error: "File header could not be verified (file is corrupted or unreadable).",
      };
    }

    // PDF verification: %PDF- (hex: 25 50 44 46)
    if (ext === ".pdf") {
      let isPdfSignature = false;
      const headerString = new TextDecoder("ascii", { fatal: false }).decode(bytes);

      if (headerString.startsWith("%PDF")) {
        isPdfSignature = true;
      } else if (headerString.includes("%PDF-")) {
        // Some PDF generators include a UTF-8 BOM or leading comment
        isPdfSignature = true;
      }

      if (!isPdfSignature) {
        return {
          isValid: false,
          fileType: "unknown",
          error:
            "Invalid PDF format: File is corrupted or does not contain a valid %PDF header signature.",
        };
      }

      return {
        isValid: true,
        fileType: "pdf",
      };
    }

    // DOCX verification: PK\x03\x04 or PK\x05\x06 (ZIP archive format)
    // Hex: 50 4B 03 04 or 50 4B 05 06 or 50 4B 07 08
    if (ext === ".docx") {
      const isZip =
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
        (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);

      if (!isZip) {
        return {
          isValid: false,
          fileType: "unknown",
          error:
            "Invalid Word document: File is corrupted or does not contain a valid DOCX (OpenXML) signature.",
        };
      }

      return {
        isValid: true,
        fileType: "docx",
      };
    }

    return {
      isValid: false,
      fileType: "unknown",
      error: "Unrecognized file format.",
    };
  } catch (readError) {
    return {
      isValid: false,
      fileType: "unknown",
      error: `Failed to read file for verification: ${readError instanceof Error ? readError.message : "Unknown read error"}`,
    };
  }
}
