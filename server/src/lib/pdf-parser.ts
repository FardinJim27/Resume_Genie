import fs from "fs/promises";

export interface PdfParseResult {
  text: string;
  numpages?: number;
  info?: any;
}

/**
 * Server-side PDF text parser using the `pdf-parse` library with
 * fallback mechanisms to guarantee reliable text extraction.
 *
 * @param pdfBuffer The raw binary Buffer of the PDF document.
 * @returns Promise<PdfParseResult> containing the extracted text and metadata.
 */
export async function parsePdfBuffer(pdfBuffer: Buffer): Promise<PdfParseResult> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    return { text: "", numpages: 0 };
  }

  // 1. Primary: Use pdf-parse library
  try {
    const pdfParseModule: any = await import("pdf-parse");

    // Case A: pdf-parse v2+ (exports class PDFParse)
    if (typeof pdfParseModule.PDFParse === "function") {
      const parser = new pdfParseModule.PDFParse({ data: pdfBuffer });
      const result = await parser.getText();
      const text = typeof result === "string" ? result : result?.text || "";
      if (text && text.trim().length > 0) {
        return {
          text: text.trim(),
          numpages: result?.total || result?.pages?.length || 1,
          info: result?.info,
        };
      }
    }

    // Case B: pdf-parse v1 (callable function or default export)
    const parseFn =
      typeof pdfParseModule === "function"
        ? pdfParseModule
        : typeof pdfParseModule.default === "function"
        ? pdfParseModule.default
        : null;

    if (parseFn) {
      const result = await parseFn(pdfBuffer);
      if (result && typeof result.text === "string" && result.text.trim().length > 0) {
        return {
          text: result.text.trim(),
          numpages: result.numpages || 1,
          info: result.info,
        };
      }
    }
  } catch (err) {
    console.warn("[PDF-Parse] pdf-parse parser encountered warning, trying pdfjs-dist fallback:", err);
  }

  // 2. Secondary Fallback: Use pdfjs-dist legacy loader
  try {
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    if (!pdfDocument || typeof pdfDocument.numPages !== "number" || pdfDocument.numPages <= 0) {
      return { text: "", numpages: 0 };
    }

    let extractedText = "";
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      if (!page) continue;

      const textContent = await page.getTextContent();
      if (!textContent || !Array.isArray(textContent.items)) continue;

      const pageText = textContent.items
        .filter((item: any) => item != null && typeof item.str === "string")
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) {
        extractedText += pageText + "\n";
      }
    }

    return {
      text: extractedText.trim(),
      numpages: pdfDocument.numPages,
    };
  } catch (pdfjsErr) {
    console.warn("[PDF-Parse] Secondary fallback also failed:", pdfjsErr);
    return { text: "", numpages: 0 };
  }
}

/**
 * Parses a PDF file from a local filesystem path using `pdf-parse`.
 *
 * @param filePath Absolute path to the PDF file on disk.
 * @returns Promise<PdfParseResult> containing the extracted text.
 */
export async function parsePdfFile(filePath: string): Promise<PdfParseResult> {
  if (!filePath || typeof filePath !== "string") {
    return { text: "", numpages: 0 };
  }
  const buffer = await fs.readFile(filePath);
  return parsePdfBuffer(buffer);
}
