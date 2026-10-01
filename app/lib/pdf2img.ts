import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { validateFileIntegrity } from "./fileValidation";

export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  // Vite resolves pdfjsWorkerUrl at build time — always matches the installed pdfjs-dist version
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File,
): Promise<PdfConversionResult> {
  try {
    if (!file) {
      return {
        imageUrl: "",
        file: null,
        error: "No file provided for PDF image conversion.",
      };
    }

    // Validate file integrity before invoking PDF.js renderer
    const validation = await validateFileIntegrity(file);
    if (!validation.isValid) {
      return {
        imageUrl: "",
        file: null,
        error: validation.error || "File failed PDF integrity validation.",
      };
    }

    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return {
        imageUrl: "",
        file: null,
        error: "PDF file is empty or could not be read.",
      };
    }

    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    if (!pdf || typeof pdf.numPages !== "number" || pdf.numPages <= 0) {
      return {
        imageUrl: "",
        file: null,
        error: "PDF contains no renderable pages.",
      };
    }

    const page = await pdf.getPage(1);
    if (!page) {
      return {
        imageUrl: "",
        file: null,
        error: "Unable to retrieve the first page of the PDF.",
      };
    }

    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Canvas 2D context is not supported in this environment.",
      };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    await page.render({ canvasContext: context, viewport }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File from the blob with the same name as the pdf
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob from canvas.",
            });
          }
        },
        "image/png",
        1.0,
      );
    });
  } catch (err) {
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Renders the first page of a PDF as a compact JPEG data URL (scale 1.5).
 * Used to store the preview image persistently in the database.
 */
export async function convertPdfToThumbnail(file: File): Promise<string> {
  try {
    if (!file) return "";
    const validation = await validateFileIntegrity(file);
    if (!validation.isValid) return "";

    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return "";

    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    if (!pdf || typeof pdf.numPages !== "number" || pdf.numPages <= 0) return "";

    const page = await pdf.getPage(1);
    if (!page) return "";

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return "";

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return "";
  }
}
