/**
 * One-time migration: clears imagePath for any resume record that stores a
 * plain filename (not a base64 data URL).  After this, the frontend will show
 * "Preview unavailable / Re-upload" instead of looping through 404 requests.
 *
 * Run:  npx tsx src/fix-stale-images.ts
 */

import { db } from "./db/index.js";
import { resumes } from "./db/schema.js";

async function fixStaleImages() {
  console.log("[fix-stale-images] Fetching all resume records…");
  const all = await db.select().from(resumes);

  const stale = all.filter(
    (r) => r.imagePath && !r.imagePath.startsWith("data:"),
  );

  if (stale.length === 0) {
    console.log("[fix-stale-images] No stale records found. Nothing to do.");
    process.exit(0);
  }

  console.log(
    `[fix-stale-images] Found ${stale.length} record(s) with filename-based imagePath:`,
  );
  stale.forEach((r) =>
    console.log(`  - ${r.id}  imagePath="${r.imagePath.slice(0, 60)}"`),
  );

  for (const resume of stale) {
    const { eq } = await import("drizzle-orm");
    await db
      .update(resumes)
      .set({ imagePath: "" })
      .where(eq(resumes.id, resume.id));
    console.log(`[fix-stale-images] ✓ Cleared imagePath for ${resume.id}`);
  }

  console.log("[fix-stale-images] Done.");
  process.exit(0);
}

fixStaleImages().catch((err) => {
  console.error("[fix-stale-images] Error:", err);
  process.exit(1);
});
