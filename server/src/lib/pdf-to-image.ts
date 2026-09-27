import fs from "fs/promises";
import path from "path";

// Canvas native addon is stripped in AI Studio Node 22 environment.
// The frontend client already captures PDF first-page rendering via browser canvas and sends imageData.
export async function convertPdfToImage(
  pdfPath: string,
  outputPath: string,
): Promise<void> {
  try {
    // Generate a minimal fallback placeholder SVG/image if ever needed
    console.log(
      `[PDF-to-Image] Client-rendered thumbnail preferred. Creating fallback placeholder for: ${path.basename(outputPath)}`,
    );
    // Minimal 1x1 transparent PNG or placeholder
    const transparentPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    await fs.writeFile(outputPath, transparentPng);
  } catch (error) {
    console.warn(`[PDF-to-Image] Fallback generation note:`, error);
  }
}
