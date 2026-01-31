import { convertPdfToImage } from "./lib/pdf-to-image";
import { db } from "./db/index";
import { resumes } from "./db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

async function regenerateImages() {
  console.log(
    "[Regenerate] Starting image regeneration for existing resumes...",
  );

  const allResumes = await db.select().from(resumes);

  for (const resume of allResumes) {
    if (!resume.imagePath || resume.imagePath === "") {
      console.log(`[Regenerate] Processing resume ${resume.id}...`);

      const pdfPath = path.join(UPLOAD_DIR, resume.resumePath);
      const imageFileName = resume.resumePath
        .replace(".pdf", ".png")
        .replace("resume", "image");
      const imagePath = path.join(UPLOAD_DIR, imageFileName);

      try {
        // Check if PDF exists
        await fs.access(pdfPath);

        // Convert PDF to image
        await convertPdfToImage(pdfPath, imagePath);

        // Update database
        await db
          .update(resumes)
          .set({ imagePath: imageFileName })
          .where(eq(resumes.id, resume.id));

        console.log(`[Regenerate] ✓ Created image for resume ${resume.id}`);
      } catch (error) {
        console.error(`[Regenerate] ✗ Failed for resume ${resume.id}:`, error);
      }
    } else {
      console.log(
        `[Regenerate] Skipping resume ${resume.id} - already has image`,
      );
    }
  }

  console.log("[Regenerate] Image regeneration complete!");
  process.exit(0);
}

regenerateImages().catch(console.error);
