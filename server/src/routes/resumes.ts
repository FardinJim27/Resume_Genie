import express from "express";
import type { Request, Response } from "express";
import fileUpload from "express-fileupload";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { resumes } from "../db/schema.js";
import { analyzeResume, analyzeResumeWithGemini, generateCareerGrowthAdvice } from "../lib/ai.js";
import { convertPdfToImage } from "../lib/pdf-to-image.js";
import { validateUploadedFile } from "../lib/file-validator.js";
import { parsePdfBuffer, parsePdfFile } from "../lib/pdf-parser.js";
import { eq, and, desc } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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

      if (!req.files || (!req.files.resume && !req.files.file && !req.files.pdf)) {
        res.status(400).json({ error: "No resume file provided" });
        return;
      }

      const resumeFile = (req.files.resume || req.files.file || req.files.pdf) as fileUpload.UploadedFile;
      const { companyName, jobTitle, jobDescription, extractedText } = req.body;

      if (!companyName || !jobTitle || !jobDescription) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Save file with appropriate extension (.docx or .pdf)
      const timestamp = Date.now();
      const originalName = (resumeFile.name || "").toLowerCase();
      const isDocx = originalName.endsWith(".docx");
      const isPdf = originalName.endsWith(".pdf");

      if (!isDocx && !isPdf) {
        res.status(400).json({
          error: "Unsupported file type. Please upload a PDF or DOCX file.",
        });
        return;
      }

      const ext = isDocx ? "docx" : "pdf";
      const resumeFileName = `${req.user.userId}_${timestamp}_resume.${ext}`;
      const resumePath = path.join(UPLOAD_DIR, resumeFileName);
      await resumeFile.mv(resumePath);

      // Validate file integrity, non-emptiness, and magic byte headers before proceeding
      const validation = await validateUploadedFile(resumePath);
      if (!validation.isValid) {
        // Clean up unparseable or malicious file immediately
        await fs.unlink(resumePath).catch(() => {});
        res.status(400).json({
          error:
            validation.error ||
            "The uploaded resume file failed integrity verification.",
        });
        return;
      }

      // Extract text using pdf-parse if it's a PDF and extractedText wasn't provided or is brief
      let textToUse =
        extractedText && typeof extractedText === "string" && extractedText.trim().length > 20
          ? extractedText.trim()
          : "";

      if (!textToUse && isPdf) {
        try {
          const parsed = await parsePdfBuffer(resumeFile.data || (await fs.readFile(resumePath)));
          textToUse = parsed.text || "";
          console.log(`[Upload] Extracted ${textToUse.length} characters using pdf-parse`);
        } catch (pdfErr) {
          console.warn("[Upload] pdf-parse extraction warning:", pdfErr);
        }
      }

      // Determine image storage: prefer client-sent base64 data URL (persists across restarts)
      let imageStorageValue = "";
      if (
        req.body.imageData &&
        typeof req.body.imageData === "string" &&
        req.body.imageData.startsWith("data:")
      ) {
        // Store data URL directly in DB — no filesystem dependency
        imageStorageValue = req.body.imageData;
        console.log("[Upload] Storing base64 thumbnail in DB");
      } else {
        // Fallback: generate image server-side and save to file
        const imageFileName = `${req.user.userId}_${timestamp}_image.png`;
        const imagePath = path.join(UPLOAD_DIR, imageFileName);
        let imageGenerated = false;
        if (req.files.image) {
          try {
            const imageFile = req.files.image as fileUpload.UploadedFile;
            await imageFile.mv(imagePath);
            imageGenerated = true;
            console.log("[Upload] Using client-uploaded image file");
          } catch (error) {
            console.error("[Upload] Failed to save client image:", error);
          }
        }
        if (!imageGenerated && !isDocx) {
          try {
            await convertPdfToImage(resumePath, imagePath);
            imageGenerated = true;
            console.log("[Upload] PDF converted to image successfully");
          } catch (error) {
            console.error("[Upload] Failed to convert PDF to image:", error);
          }
        }
        if (imageGenerated) {
          imageStorageValue = imageFileName;
        }
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
          imagePath: imageStorageValue,
        })
        .returning();

      // Check if synchronous analysis requested (e.g. ?sync=true or body.sync = true)
      const isSync =
        req.query.sync === "true" || req.body.sync === true || req.body.sync === "true";

      if (isSync) {
        console.log(`[Upload] Synchronous analysis requested for resume ${resume.id}...`);
        const feedback = await analyzeResumeWithGemini(textToUse, jobTitle, jobDescription);
        await db.update(resumes).set({ feedback }).where(eq(resumes.id, resume.id));
        res.status(200).json({
          id: resume.id,
          message: "Resume analyzed successfully with Gemini",
          extractedText: textToUse,
          charCount: textToUse.length,
          feedback,
        });
        return;
      }

      // Analyze resume in background (with parsed text passed directly)
      analyzeResume(
        resume.id,
        resumePath,
        jobTitle,
        jobDescription,
        textToUse,
      ).catch((err: any) => console.error("Analysis failed:", err));

      res.status(201).json({
        id: resume.id,
        message: "Resume uploaded, analysis in progress",
        extractedTextLength: textToUse.length,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload resume" });
    }
  },
);

/**
 * Server-side file upload handler to accept and parse PDF resume files using pdf-parse,
 * then pass the extracted text to the Gemini API for analysis.
 */
export async function handleParseAndAnalyzeResume(req: Request, res: Response): Promise<void> {
  try {
    if (!req.files) {
      res.status(400).json({ error: "No file provided in upload" });
      return;
    }

    const file = (req.files.resume ||
      req.files.file ||
      req.files.pdf ||
      Object.values(req.files)[0]) as fileUpload.UploadedFile;

    if (!file) {
      res.status(400).json({ error: "No resume document found in request" });
      return;
    }

    const filename = (file.name || "resume.pdf").toLowerCase();
    const isPdf = filename.endsWith(".pdf");
    const isDocx = filename.endsWith(".docx");

    if (!isPdf && !isDocx) {
      res.status(400).json({ error: "Please upload a valid PDF or DOCX file." });
      return;
    }

    // 1. Accept and parse PDF file using pdf-parse library
    let extractedText = "";
    let pageCount = 1;

    if (isPdf) {
      const parseResult = await parsePdfBuffer(file.data);
      extractedText = parseResult.text;
      pageCount = parseResult.numpages || 1;
      console.log(
        `[parse-and-analyze] Parsed PDF (${pageCount} pages, ${extractedText.length} chars) using pdf-parse`,
      );
    } else {
      const mammoth = await import("mammoth");
      const docResult = await mammoth.default.extractRawText({ buffer: file.data });
      extractedText = docResult?.value || "";
    }

    if (!extractedText || extractedText.trim().length === 0) {
      res.status(422).json({
        error: "Could not extract any readable text from the uploaded PDF document.",
      });
      return;
    }

    const jobTitle = req.body.jobTitle || "Software Engineer";
    const companyName = req.body.companyName || "Target Company";
    const jobDescription =
      req.body.jobDescription ||
      "Seeking a qualified candidate with relevant experience and technical skills.";

    // 2. Pass the extracted text to the Gemini API for analysis
    console.log(`[parse-and-analyze] Passing extracted text to Gemini API for analysis...`);
    const feedback = await analyzeResumeWithGemini(extractedText, jobTitle, jobDescription);

    res.status(200).json({
      success: true,
      fileName: file.name,
      charCount: extractedText.length,
      pageCount,
      extractedText,
      feedback,
    });
  } catch (error: any) {
    console.error("[parse-and-analyze] Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to parse resume and analyze with Gemini API",
    });
  }
}

router.post(
  ["/parse-and-analyze", "/parse", "/analyze-file"],
  handleParseAndAnalyzeResume,
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
        if (resume.imagePath && !resume.imagePath.startsWith("data:")) {
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

// AI-generated Career Growth Advice and Industry-Standard Skill Suggestions
router.post(
  "/:id/career-growth",
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
      const { targetRole, refresh } = req.body || {};

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

      const existingFeedback = (resume.feedback || {}) as any;

      // Return cached career growth if available and not explicitly requesting refresh or different target role
      if (
        !refresh &&
        existingFeedback.careerGrowth &&
        (!targetRole || existingFeedback.careerGrowthTargetRole === targetRole)
      ) {
        res.json({ careerGrowth: existingFeedback.careerGrowth });
        return;
      }

      // Read resume file text or extract from file
      const resumeFilePath = path.join(UPLOAD_DIR, resume.resumePath);
      let resumeText = "";
      try {
        const isDocx = resume.resumePath.toLowerCase().endsWith(".docx");
        if (isDocx) {
          const buffer = await fs.readFile(resumeFilePath);
          const mammoth = await import("mammoth");
          const result = await mammoth.default.extractRawText({ buffer });
          resumeText = (result.value || "").trim();
        } else {
          const pdfData = await fs.readFile(resumeFilePath);
          const uint8Array = new Uint8Array(pdfData);
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
          const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
          const pdfDocument = await loadingTask.promise;
          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            resumeText +=
              textContent.items.map((item: any) => item.str).join(" ") + " ";
          }
          resumeText = resumeText.trim();
        }
      } catch (readErr) {
        console.warn("[CareerGrowth] Warning reading resume file:", readErr);
      }

      const advice = await generateCareerGrowthAdvice(
        resumeText,
        resume.jobTitle,
        resume.jobDescription,
        targetRole,
      );

      // Save into DB
      const updatedFeedback = {
        ...existingFeedback,
        careerGrowth: advice,
        careerGrowthTargetRole: targetRole || resume.jobTitle,
        careerGrowthGeneratedAt: new Date().toISOString(),
      };

      await db
        .update(resumes)
        .set({ feedback: updatedFeedback })
        .where(eq(resumes.id, resumeId));

      res.json({ careerGrowth: advice });
    } catch (error: any) {
      console.error("[CareerGrowth] Error generating advice:", error);
      res.status(500).json({ error: "Failed to generate career growth advice" });
    }
  },
);

// Re-analyze / Retry Resume Analysis
router.post(
  "/:id/retry",
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

      const resumeFilePath = path.join(UPLOAD_DIR, resume.resumePath);

      // Trigger analysis immediately
      await analyzeResume(
        resume.id,
        resumeFilePath,
        resume.jobTitle,
        resume.jobDescription,
      );

      // Fetch updated record
      const [updated] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.id, resumeId))
        .limit(1);

      res.json({ message: "Analysis completed", resume: updated });
    } catch (error) {
      console.error("[Resume Retry] Error reanalyzing resume:", error);
      res.status(500).json({ error: "Failed to reanalyze resume" });
    }
  },
);

// Preview / Direct Career Growth Advice without saved resume
router.post(
  "/career-growth/direct",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { resumeText, jobTitle, jobDescription, targetRole } =
        req.body || {};
      if (!resumeText || resumeText.trim().length < 15) {
        res.status(400).json({ error: "Resume text is required" });
        return;
      }

      const advice = await generateCareerGrowthAdvice(
        resumeText,
        jobTitle || "Software Engineer",
        jobDescription || "",
        targetRole,
      );

      res.json({ careerGrowth: advice });
    } catch (error: any) {
      console.error("[CareerGrowth] Direct generation error:", error);
      res.status(500).json({ error: "Failed to generate career advice" });
    }
  },
);

export default router;
