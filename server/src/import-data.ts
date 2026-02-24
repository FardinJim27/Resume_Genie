import { db } from "./db/index.js";
import { users, resumes } from "./db/schema.js";
import fs from "fs/promises";

async function importData() {
  try {
    console.log("Reading export file...");
    const data = JSON.parse(await fs.readFile("data-export.json", "utf-8"));

    console.log(
      `Found ${data.users.length} users and ${data.resumes.length} resumes to import`,
    );

    // Import users
    if (data.users.length > 0) {
      console.log("Importing users...");
      for (const user of data.users) {
        // Convert date strings to Date objects
        const userToInsert = {
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        };
        await db.insert(users).values(userToInsert).onConflictDoNothing();
      }
      console.log(`✅ Imported ${data.users.length} users`);
    }

    // Import resumes
    if (data.resumes.length > 0) {
      console.log("Importing resumes...");
      for (const resume of data.resumes) {
        // Convert date strings to Date objects
        const resumeToInsert = {
          ...resume,
          createdAt: new Date(resume.createdAt),
          updatedAt: new Date(resume.updatedAt),
        };
        await db.insert(resumes).values(resumeToInsert).onConflictDoNothing();
      }
      console.log(`✅ Imported ${data.resumes.length} resumes`);
    }

    console.log("✅ Import completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

importData();
