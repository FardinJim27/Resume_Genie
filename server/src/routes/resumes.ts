import { Router, Request, Response } from "express";
import fileUpload from "express-fileupload";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { db } from "../db/index";
import { resumes } from "../db/schema";
import { analyzeResume } from "../lib/ai";
import { convertPdfToImage } from "../lib/pdf-to-image";
import { eq, and, desc } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
);

// Ensure upload directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true });

// Upload and analyze resume
router.post(
  "/upload",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!req.files || !req.files.resume) {
        res.status(400).json({ error: "No resume file provided" });
        return;
      }

      const resumeFile = req.files.resume as fileUpload.UploadedFile;
      const { companyName, jobTitle, jobDescription } = req.body;

      if (!companyName || !jobTitle || !jobDescription) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Save PDF file
      const timestamp = Date.now();
      const resumeFileName = `${req.user.userId}_${timestamp}_resume.pdf`;
      const resumePath = path.join(UPLOAD_DIR, resumeFileName);
      await resumeFile.mv(resumePath);

      // Generate image from PDF
      const imageFileName = `${req.user.userId}_${timestamp}_image.png`;
      const imagePath = path.join(UPLOAD_DIR, imageFileName);

      try {
        await convertPdfToImage(resumePath, imagePath);
        console.log("[Upload] PDF converted to image successfully");
      } catch (error) {
        console.error("[Upload] Failed to convert PDF to image:", error);
        // Continue without image - not critical
      }

      // Create database record
      const [resume] = await db
        .insert(resumes)
        .values({
          userId: req.user.userId,
          companyName,
          jobTitle,
          jobDescription,
          resumePath: resumeFileName,
          imagePath: imageFileName,
        })
        .returning();

      // Analyze resume in background
      analyzeResume(resume.id, resumePath, jobTitle, jobDescription).catch(
        (err: any) => console.error("Analysis failed:", err),
      );

      res
        .status(201)
        .json({
          id: resume.id,
          message: "Resume uploaded, analysis in progress",
        });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload resume" });
    }
  },
);

// Get resume by ID
router.get(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const resumeId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const [resume] = await db
        .select()
        .from(resumes)
        .where(
          and(eq(resumes.id, resumeId), eq(resumes.userId, req.user.userId)),
        )
        .limit(1);

      if (!resume) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }

      res.json(resume);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resume" });
    }
  },
);

// Get all resumes for user
router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const userResumes = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, req.user.userId))
        .orderBy(desc(resumes.createdAt));

      res.json(userResumes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resumes" });
    }
  },
);

// Serve file (resume or image)
router.get(
  "/file/:filename",
  async (req: Request, res: Response): Promise<void> => {
    try {
      let filename = req.params.filename;
      if (Array.isArray(filename)) {
        filename = filename[0];
      }

      // Security: validate filename to prevent directory traversal
      if (
        filename.includes("..") ||
        filename.includes("/") ||
        filename.includes("\\")
      ) {
        res.status(403).json({ error: "Invalid filename" });
        return;
      }

      const filePath = path.join(UPLOAD_DIR, filename);

      try {
        await fs.access(filePath);

        // Set appropriate content type
        const ext = path.extname(filename).toLowerCase();
        if (ext === ".pdf") {
          res.contentType("application/pdf");
        } else if (ext === ".png") {
          res.contentType("image/png");
        } else if (ext === ".jpg" || ext === ".jpeg") {
          res.contentType("image/jpeg");
        }

        res.sendFile(filePath);
      } catch {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      console.error("File serve error:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  },
);

// Delete resume
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const resumeId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const [resume] = await db
        .select()
        .from(resumes)
        .where(
          and(eq(resumes.id, resumeId), eq(resumes.userId, req.user.userId)),
        )
        .limit(1);

      if (!resume) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }

      // Delete files
      try {
        await fs.unlink(path.join(UPLOAD_DIR, resume.resumePath));
        if (resume.imagePath) {
          await fs.unlink(path.join(UPLOAD_DIR, resume.imagePath));
        }
      } catch (err) {
        console.error("Failed to delete files:", err);
      }

      // Delete from database
      await db.delete(resumes).where(eq(resumes.id, resumeId));

      res.json({ message: "Resume deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resume" });
    }
  },
);

export default router;
