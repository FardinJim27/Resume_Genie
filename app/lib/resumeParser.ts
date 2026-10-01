import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import { validateFileIntegrity } from "./fileValidation";

export interface DetectedContact {
  emails: string[];
  phones: string[];
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface DetectedSections {
  summary: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
  certifications: boolean;
}

export interface AtsCheck {
  label: string;
  passed: boolean;
  note: string;
}

export interface ParsedResumeData {
  rawText: string;
  cleanText: string;
  fileName: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  pageCount: number;
  wordCount: number;
  charCount: number;
  estimatedReadTimeMinutes: number;
  contact: DetectedContact;
  sections: DetectedSections;
  atsReadiness: {
    score: number; // 0 - 100
    level: "poor" | "fair" | "good" | "excellent";
    checks: AtsCheck[];
  };
  previewUrl?: string;
  extractedSkills: string[];
}

let pdfjsLib: any = null;
let pdfLoadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (pdfLoadPromise) return pdfLoadPromise;

  pdfLoadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
    pdfjsLib = lib;
    return lib;
  });

  return pdfLoadPromise;
}

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java",
  "C++", "C#", "Go", "Rust", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "GraphQL", "REST API", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
  "CI/CD", "Git", "GitHub", "Linux", "Tailwind CSS", "HTML", "CSS", "Redux",
  "Zustand", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
  "Agile", "Scrum", "Jira", "Figma", "Unit Testing", "Jest", "Cypress"
];

function analyzeExtractedResume(
  rawText: string,
  fileName: string,
  fileType: "pdf" | "docx",
  fileSize: number,
  pageCount: number,
  previewUrl?: string,
): ParsedResumeData {
  // Normalize whitespace & remove excessive empty lines
  const safeText = typeof rawText === "string" ? rawText : "";
  const cleanText = safeText
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Words & Chars
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = cleanText.length;
  const estimatedReadTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Contact info detection
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const emails = Array.from(new Set(cleanText.match(emailRegex) || []));

  const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gi;
  const phoneMatches = cleanText.match(phoneRegex) || [];
  const phones = Array.from(new Set(phoneMatches.map(p => p.trim()).filter(p => p.length >= 7 && p.replace(/\D/g, "").length >= 7))).slice(0, 2);

  const linkedinMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:dev|me|io|com)\b/i);

  const contact: DetectedContact = {
    emails,
    phones,
    linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
    github: githubMatch ? githubMatch[0] : undefined,
    portfolio: portfolioMatch && !portfolioMatch[0].includes("linkedin") && !portfolioMatch[0].includes("github")
      ? portfolioMatch[0]
      : undefined,
  };

  // Section heading detection
  const lowerText = cleanText.toLowerCase();
  const sections: DetectedSections = {
    summary: /(summary|professional summary|about me|profile|overview|objective)/i.test(lowerText),
    experience: /(experience|work experience|employment history|work history|professional experience)/i.test(lowerText),
    education: /(education|academic background|qualifications|degrees?|university|college)/i.test(lowerText),
    skills: /(skills|technical skills|technologies|competencies|expertise|proficiencies)/i.test(lowerText),
    projects: /(projects|personal projects|key projects|portfolio projects)/i.test(lowerText),
    certifications: /(certifications|licenses|certificates|credentials)/i.test(lowerText),
  };

  // Skills keyword extraction
  const extractedSkills: string[] = [];
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
    if (regex.test(cleanText)) {
      extractedSkills.push(skill);
    }
  }

  // ATS Readiness Evaluation
  const checks: AtsCheck[] = [];
  let score = 0;

  // Check 1: Adequate length
  if (wordCount >= 250 && wordCount <= 1200) {
    score += 25;
    checks.push({ label: "Optimal Word Count", passed: true, note: `${wordCount} words (ideal ATS range: 250 - 1,200 words)` });
  } else if (wordCount >= 100) {
    score += 15;
    checks.push({ label: "Word Count", passed: false, note: `${wordCount} words (${wordCount < 250 ? "Short resume" : "Quite long for a standard resume"})` });
  } else {
    checks.push({ label: "Insufficient Text", passed: false, note: "Under 100 words detected; resume may be incomplete or an image" });
  }

  // Check 2: Contact info
  if (emails.length > 0) {
    score += 15;
    checks.push({ label: "Email Address", passed: true, note: `Detected: ${emails[0]}` });
  } else {
    checks.push({ label: "Email Address", passed: false, note: "No valid email address found in the document header" });
  }

  if (phones.length > 0) {
    score += 10;
    checks.push({ label: "Phone Number", passed: true, note: `Detected: ${phones[0]}` });
  } else {
    checks.push({ label: "Phone Number", passed: false, note: "No contact phone number detected" });
  }

  // Check 3: Work experience section
  if (sections.experience) {
    score += 20;
    checks.push({ label: "Experience Section", passed: true, note: "Standard employment/work history heading detected" });
  } else {
    checks.push({ label: "Experience Section", passed: false, note: "Could not find a standard 'Experience' or 'Work History' heading" });
  }

  // Check 4: Education section
  if (sections.education) {
    score += 15;
    checks.push({ label: "Education Section", passed: true, note: "Education / academic credentials heading found" });
  } else {
    checks.push({ label: "Education Section", passed: false, note: "No 'Education' or 'Academic' section heading identified" });
  }

  // Check 5: Skills section
  if (sections.skills || extractedSkills.length >= 3) {
    score += 15;
    checks.push({ label: "Skills & Keywords", passed: true, note: `${extractedSkills.length} key competencies detected` });
  } else {
    checks.push({ label: "Skills Section", passed: false, note: "No dedicated skills section or industry keywords detected" });
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let level: "poor" | "fair" | "good" | "excellent" = "poor";
  if (finalScore >= 85) level = "excellent";
  else if (finalScore >= 70) level = "good";
  else if (finalScore >= 50) level = "fair";

  return {
    rawText,
    cleanText,
    fileName,
    fileType,
    fileSize,
    pageCount,
    wordCount,
    charCount,
    estimatedReadTimeMinutes,
    contact,
    sections,
    atsReadiness: {
      score: finalScore,
      level,
      checks,
    },
    previewUrl,
    extractedSkills,
  };
}

/**
 * Extracts all text from a PDF file using pdfjs-dist.
 * Also generates a page-1 thumbnail data URL.
 */
export async function extractTextFromPdf(file: File): Promise<ParsedResumeData> {
  const lib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Unable to read PDF file data (file appears empty or unreadable).");
  }

  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  if (!pdf || typeof pdf.numPages !== "number" || pdf.numPages <= 0) {
    throw new Error("PDF document structure is empty or contains no parseable pages.");
  }

  const pageCount = pdf.numPages;
  let fullText = "";

  for (let i = 1; i <= pageCount; i++) {
    try {
      const page = await pdf.getPage(i);
      if (!page) continue;

      const content = await page.getTextContent();
      if (!content || !Array.isArray(content.items)) continue;

      const pageStrings = content.items
        .filter((item: any) => item != null && typeof item.str === "string")
        .map((item: any) => item.str);

      const pageText = pageStrings.join(" ").replace(/\s+/g, " ").trim();
      if (pageText) {
        fullText += (fullText ? `\n\n--- Page ${i} ---\n\n` : "") + pageText;
      }
    } catch (pageErr) {
      console.warn(`[PDF Parser] Error reading page ${i}:`, pageErr);
      // Non-fatal: continue extracting other pages
    }
  }

  // Render thumbnail of page 1 safely
  let previewUrl: string | undefined;
  try {
    const page1 = await pdf.getPage(1);
    if (page1) {
      const viewport = page1.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page1.render({ canvasContext: ctx, viewport }).promise;
        previewUrl = canvas.toDataURL("image/jpeg", 0.85);
      }
    }
  } catch (err) {
    console.warn("Could not generate PDF thumbnail:", err);
  }

  return analyzeExtractedResume(fullText, file.name, "pdf", file.size, pageCount, previewUrl);
}

/**
 * Extracts text from a DOCX file using mammoth.
 * Generates an styled SVG/Canvas document preview thumbnail.
 */
export async function extractTextFromDocx(file: File): Promise<ParsedResumeData> {
  const arrayBuffer = await file.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Unable to read DOCX file data (file appears empty or unreadable).");
  }

  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = (result && typeof result.value === "string") ? result.value : "";

  // Estimate page count for DOCX (~400 words per single-spaced page)
  const words = rawText.split(/\s+/).filter(Boolean);
  const estimatedPages = Math.max(1, Math.ceil(words.length / 400));

  // Generate lightweight preview thumbnail representation
  let previewUrl: string | undefined;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 520;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // White background with subtle border
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 520);

      // Top decorative header line (Word Blue)
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(0, 0, 400, 12);

      // Document title / first line
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 16px sans-serif";
      const firstLine = rawText.split("\n").filter(l => l.trim().length > 0)[0] || file.name.replace(/\.docx$/i, "");
      ctx.fillText(firstLine.slice(0, 32), 30, 45);

      // Simulated text lines representing the doc layout
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      const sampleLines = rawText
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .slice(1, 18);

      let y = 75;
      for (const line of sampleLines) {
        ctx.fillText(line.slice(0, 48), 30, y);
        y += 22;
        if (y > 480) break;
      }

      previewUrl = canvas.toDataURL("image/jpeg", 0.85);
    }
  } catch (err) {
    console.warn("Could not generate DOCX thumbnail:", err);
  }

  return analyzeExtractedResume(rawText, file.name, "docx", file.size, estimatedPages, previewUrl);
}

/**
 * Universal resume parser entry point: supports PDF and DOCX.
 * Pre-validates file integrity, size, and magic byte signatures before parsing.
 */
export async function parseResumeFile(file: File): Promise<ParsedResumeData> {
  const validation = await validateFileIntegrity(file);
  if (!validation.isValid) {
    throw new Error(validation.error || "File integrity validation failed.");
  }

  if (validation.fileType === "pdf") {
    return extractTextFromPdf(file);
  } else if (validation.fileType === "docx") {
    return extractTextFromDocx(file);
  } else {
    throw new Error(`Unsupported file type: ${file.name}. Please upload a PDF or DOCX file.`);
  }
}
