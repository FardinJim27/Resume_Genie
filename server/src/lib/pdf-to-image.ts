import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";
import { createCanvas } from "canvas";

const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

export async function convertPdfToImage(
  pdfPath: string,
  outputPath: string,
): Promise<void> {
  try {
    // Read the PDF file
    const pdfData = await fs.readFile(pdfPath);
    const uint8Array = new Uint8Array(pdfData);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    // Get the first page
    const page = await pdfDocument.getPage(1);

    // Set scale for high quality
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    // Render PDF page to canvas
    await page.render({
      canvasContext: context as any,
      viewport: viewport,
    }).promise;

    // Save canvas as PNG
    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(outputPath, buffer);

    console.log(
      `[PDF-to-Image] Successfully converted: ${path.basename(pdfPath)} -> ${path.basename(outputPath)}`,
    );
  } catch (error) {
    console.error(`[PDF-to-Image] Failed to convert PDF to image:`, error);
    throw error;
  }
}
