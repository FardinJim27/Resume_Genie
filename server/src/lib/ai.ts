import Groq from "groq-sdk";
import { db } from "../db/index.js";
import { resumes } from "../db/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const AIResponseFormat = `
interface Feedback {
  overallScore: number; //max 100
  ATS: {
    score: number; //rate based on ATS suitability
    tips: {
      type: "good" | "improve";
      tip: string; //give 3-4 tips
    }[];
  };
  toneAndStyle: {
    score: number; //max 100
    tips: {
      type: "good" | "improve";
      tip: string; //make it a short "title" for the actual explanation
      explanation: string; //explain in detail here
    }[]; //give 3-4 tips
  };
  content: {
    score: number; //max 100
    tips: {
      type: "good" | "improve";
      tip: string; //make it a short "title" for the actual explanation
      explanation: string; //explain in detail here
    }[]; //give 3-4 tips
  };
  structure: {
    score: number; //max 100
    tips: {
      type: "good" | "improve";
      tip: string; //make it a short "title" for the actual explanation
      explanation: string; //explain in detail here
    }[]; //give 3-4 tips
  };
  skills: {
    score: number; //max 100
    tips: {
      type: "good" | "improve";
      tip: string; //make it a short "title" for the actual explanation
      explanation: string; //explain in detail here
    }[]; //give 3-4 tips
  };
}`;

export const preparePrompt = (
  jobTitle: string,
  jobDescription: string,
): string => {
  return `You are an expert in ATS (Applicant Tracking System) and resume analysis.
Please analyze and rate this resume and suggest how to improve it.
The rating can be low if the resume is bad.
Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
If available, use the job description for the job user is applying to to give more detailed feedback.
If provided, take the job description into consideration.
The job title is: ${jobTitle}
The job description is: ${jobDescription}
Provide the feedback using the following format: ${AIResponseFormat}
Return the analysis as a JSON object, without any other text and without the backticks.
Do not include any other text or comments.`;
};

export const analyzeResume = async (
  resumeId: string,
  resumePath: string,
  jobTitle: string,
  jobDescription: string,
): Promise<void> => {
  try {
    console.log(`[AI] Starting analysis for resume ${resumeId}...`);

    // Read the PDF file
    const pdfData = await fs.readFile(resumePath);
    console.log(
      `[AI] PDF loaded, size: ${(pdfData.length / 1024).toFixed(2)} KB`,
    );

    // Extract text from PDF using pdfjs-dist
    console.log(`[AI] Extracting text from PDF...`);
    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(pdfData);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    let resumeText = "";
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    console.log(`[AI] Extracted ${resumeText.length} characters from PDF`);

    console.log(`[AI] Calling Groq API...`);
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Here is a resume:\n\n${resumeText}\n\n${preparePrompt(jobTitle, jobDescription)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 8000,
    });

    const text = completion.choices[0]?.message?.content || "";

    console.log(`[AI] Received response from Groq`);
    console.log(`[AI] Parsing JSON response...`);
    console.log(`[AI] Response preview: ${text.substring(0, 200)}...`);

    // Try to extract JSON from the response (in case it's wrapped in markdown)
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Parse the JSON response
    const feedback = JSON.parse(jsonText);

    console.log(`[AI] Updating database...`);

    // Update database with feedback
    await db.update(resumes).set({ feedback }).where(eq(resumes.id, resumeId));

    console.log(`[AI] ✓ Analysis complete for resume ${resumeId}`);
  } catch (error) {
    console.error(`[AI] ✗ Analysis failed for resume ${resumeId}:`, error);

    // Store error in database so frontend knows it failed
    try {
      await db
        .update(resumes)
        .set({
          feedback: {
            error: true,
            message: error instanceof Error ? error.message : "Analysis failed",
          } as any,
        })
        .where(eq(resumes.id, resumeId));
    } catch (dbError) {
      console.error(`[AI] Failed to update database with error:`, dbError);
    }

    throw error;
  }
};
