import { db } from "./db/index.js";
import { users, resumes } from "./db/schema.js";
import fs from "fs/promises";

async function exportData() {
  try {
    console.log("Exporting users...");
    const allUsers = await db.select().from(users);
    
    console.log("Exporting resumes...");
    const allResumes = await db.select().from(resumes);
    
    const exportData = {
      users: allUsers,
      resumes: allResumes,
      exportedAt: new Date().toISOString(),
    };
    
    await fs.writeFile(
      "data-export.json",
      JSON.stringify(exportData, null, 2)
    );
    
    console.log(`✅ Exported ${allUsers.length} users and ${allResumes.length} resumes`);
    console.log("📁 Saved to: data-export.json");
    
    process.exit(0);
  } catch (error) {
    console.error("Export failed:", error);
    process.exit(1);
  }
}

exportData();
