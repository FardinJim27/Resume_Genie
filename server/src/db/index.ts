import * as schema from "./schema.js";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
}

function extractConditions(cond: any): Array<{ col: string; val: any }> {
  const result: Array<{ col: string; val: any }> = [];
  function recurse(c: any) {
    if (!c) return;
    const chunks = c.queryChunks;
    if (!chunks) return;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk && chunk.name && chunk.table) {
        for (let j = i + 1; j < chunks.length; j++) {
          const next = chunks[j];
          if (next && "value" in next && "encoder" in next) {
            result.push({ col: chunk.name, val: next.value });
            i = j;
            break;
          }
        }
      } else if (chunk && chunk.queryChunks) {
        recurse(chunk);
      }
    }
  }
  recurse(cond);
  return result;
}

function rowMatches(row: any, cond: any): boolean {
  if (!cond) return true;
  const conditions = extractConditions(cond);
  for (const { col, val } of conditions) {
    const rowVal =
      row[col] !== undefined
        ? row[col]
        : row[toCamel(col)];
    if (String(rowVal).toLowerCase() !== String(val).toLowerCase()) {
      return false;
    }
  }
  return true;
}

// Persistent JSON file store path
const DATA_STORE_FILE = path.resolve(__dirname, "../../data-store.json");
const DATA_EXPORT_FILE = path.resolve(__dirname, "../../data-export.json");

// In-memory tables with disk persistence
let memoryUsers: any[] = [];
let memoryResumes: any[] = [];

// Seed users helper
const DEFAULT_PASSWORD_HASH = "$2b$10$2C2gLtFBv3Dkq3r5m/VrFu/Jti2WuBk4xbt520EGN.Ogk4fASUIgm"; // Password123!

function initStore() {
  try {
    if (fs.existsSync(DATA_STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_STORE_FILE, "utf-8"));
      memoryUsers = Array.isArray(parsed.users) ? parsed.users : [];
      memoryResumes = Array.isArray(parsed.resumes) ? parsed.resumes : [];
      console.log(`[DB] Loaded ${memoryUsers.length} users and ${memoryResumes.length} resumes from data-store.json`);
    } else if (fs.existsSync(DATA_EXPORT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_EXPORT_FILE, "utf-8"));
      memoryUsers = Array.isArray(parsed.users) ? parsed.users : [];
      memoryResumes = Array.isArray(parsed.resumes) ? parsed.resumes : [];
      console.log(`[DB] Seeded ${memoryUsers.length} users from data-export.json`);
    }
  } catch (err) {
    console.warn("[DB] Could not load persisted data file, starting fresh:", err);
  }

  // Ensure default demo and primary accounts exist
  const seedAccounts = [
    {
      id: "demo-user-default-id",
      username: "demo_user",
      email: "demo@resumegenie.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "fardin-primary-user-id",
      username: "fardinjim77",
      email: "fardinjim77@gmail.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "1627f9df-fe4d-4353-9c6c-3a9ddf65fb30",
      username: "Fardin_Jim",
      email: "fardinahmed.jim.7@gmail.com",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const seed of seedAccounts) {
    const exists = memoryUsers.some((u) => u.email?.toLowerCase() === seed.email.toLowerCase());
    if (!exists) {
      memoryUsers.push(seed);
    }
  }

  // Ensure default previously analyzed resumes exist if store has no resumes
  if (memoryResumes.length === 0) {
    const defaultResumes = [
      {
        id: "c8205a8c-399f-4e8e-85e5-b095d1b2d357",
        userId: "fardin-primary-user-id",
        companyName: "Google / Cloud",
        jobTitle: "Lead Full Stack Engineer",
        jobDescription:
          "Lead Full Stack Engineer with expertise in React, TypeScript, cloud architecture (AWS/GCP), and distributed systems.",
        resumePath: "c8205a8c-399f-4e8e-85e5-b095d1b2d357_1790541686267_resume.pdf",
        imagePath: "c8205a8c-399f-4e8e-85e5-b095d1b2d357_1790541686267_image.png",
        createdAt: "2026-10-01T17:16:00.000Z",
        updatedAt: "2026-10-01T17:16:00.000Z",
        feedback: {
          overallScore: 89,
          ATS: {
            score: 90,
            tips: [
              {
                type: "good",
                tip: "Excellent keyword density for Lead Full Stack criteria (React, TypeScript, AWS, Kubernetes).",
              },
              {
                type: "good",
                tip: "Education and Degree sections properly labeled and parsed without errors.",
              },
              {
                type: "improve",
                tip: "Ensure date formatting follows standard YYYY-MM or Month YYYY consistently.",
              },
            ],
          },
          toneAndStyle: {
            score: 91,
            tips: [
              {
                type: "good",
                tip: "Executive leadership voice with high-impact power verbs.",
                explanation: "Strong leadership tone reflects lead-level seniority.",
              },
              {
                type: "improve",
                tip: "Minimize jargon in summary statement to appeal to non-technical recruiters.",
                explanation: "Balanced phrasing ensures broad appeal.",
              },
            ],
          },
          content: {
            score: 87,
            tips: [
              {
                type: "good",
                tip: "Concrete architectural milestones demonstrated across cloud and container deployments.",
                explanation: "AWS and Kubernetes experience demonstrates production readiness.",
              },
              {
                type: "improve",
                tip: "Include team leadership metrics (e.g., mentored 6 engineers, managed $500k cloud budget).",
                explanation: "Leadership metrics are critical for Lead/Staff engineer calibrations.",
              },
            ],
          },
          structure: {
            score: 88,
            tips: [
              {
                type: "good",
                tip: "Predictable, ATS-optimized layout with distinct headings.",
                explanation: "Standard headings prevent parser confusion.",
              },
              {
                type: "improve",
                tip: "Standardize spacing between position headers and company names.",
                explanation: "Visual hierarchy helps both automated parsers and human reviewers.",
              },
            ],
          },
          skills: {
            score: 89,
            tips: [
              {
                type: "good",
                tip: "Top-tier full-stack stack coverage (TypeScript, React, Node.js, Kubernetes).",
                explanation: "Covers frontend, backend, and infrastructure.",
              },
              {
                type: "improve",
                tip: "Specify system design and observability tools (Datadog, Prometheus, OpenTelemetry).",
                explanation: "Production telemetry skills highlight mature operational engineering.",
              },
            ],
          },
        },
      },
      {
        id: "6554d478-2bc0-400a-ad68-a44518d8cf53",
        userId: "fardin-primary-user-id",
        companyName: "TechCorp",
        jobTitle: "Senior Software Engineer",
        jobDescription:
          "Senior Software Engineer position requiring TypeScript, React, Node.js, and PostgreSQL expertise.",
        resumePath: "6554d478-2bc0-400a-ad68-a44518d8cf53_1790541415966_resume.pdf",
        imagePath: "6554d478-2bc0-400a-ad68-a44518d8cf53_1790541415966_image.png",
        createdAt: "2026-10-01T17:14:00.000Z",
        updatedAt: "2026-10-01T17:14:00.000Z",
        feedback: {
          overallScore: 85,
          ATS: {
            score: 84,
            tips: [
              {
                type: "good",
                tip: "Standard header formats (Work Experience, Skills) cleanly indexed by ATS parsers.",
              },
              {
                type: "good",
                tip: "Key programming languages (TypeScript, React, Node.js) detected in prominent sections.",
              },
              {
                type: "improve",
                tip: "Include explicit version control and CI/CD tools to match senior engineering filtering rubrics.",
              },
            ],
          },
          toneAndStyle: {
            score: 88,
            tips: [
              {
                type: "good",
                tip: "Strong active verbs used throughout work history.",
                explanation: "Using verbs like 'Architected' and 'Spearheaded' demonstrates proactive ownership.",
              },
              {
                type: "improve",
                tip: "Maintain consistent past tense across all past role bullet points.",
                explanation: "Mixing present and past tense can reduce polish.",
              },
            ],
          },
          content: {
            score: 82,
            tips: [
              {
                type: "good",
                tip: "Key technical achievements quantified with real-world impact.",
                explanation: "Highlights scale and throughput improvements.",
              },
              {
                type: "improve",
                tip: "Add business metrics (revenue impact, latency reduction percentage) to achievements.",
                explanation: "Quantified results dramatically increase recruiter callback rates.",
              },
            ],
          },
          structure: {
            score: 86,
            tips: [
              {
                type: "good",
                tip: "Clean single-column chronological layout ensures 100% parsing readability.",
                explanation: "Parsers avoid dropping content trapped in complex multi-column sidebars.",
              },
              {
                type: "improve",
                tip: "Keep bullet points to a maximum of 2 lines for rapid 6-second recruiter scanning.",
                explanation: "Long narrative paragraphs get skipped during quick candidate screening.",
              },
            ],
          },
          skills: {
            score: 85,
            tips: [
              {
                type: "good",
                tip: "High alignment with full-stack requirements (React, Node.js, PostgreSQL).",
                explanation: "Matches core qualifications for modern full stack roles.",
              },
              {
                type: "improve",
                tip: "Add cloud infrastructure credentials or certifications (AWS / GCP / Docker).",
                explanation: "Modern senior engineering roles heavily emphasize cloud architecture.",
              },
            ],
          },
        },
      },
    ];

    memoryResumes.push(...defaultResumes);
  }

  saveStore();
}

function saveStore() {
  try {
    const data = {
      users: memoryUsers,
      resumes: memoryResumes,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[DB] Could not save to data-store.json:", err);
  }
}

// Initialize on module load
initStore();

function createMockDb() {
  console.log("[DB] File-backed persistent store active");

  const getTableData = (table: any): any[] => {
    const tableName = table?.[Symbol.for("drizzle:Name")] || table?.config?.name;
    if (tableName === "users") return memoryUsers;
    if (tableName === "resumes") return memoryResumes;
    return [];
  };

  return {
    select: (projection?: any) => ({
      from: (table: any) => {
        let condition: any = null;
        let limitCount: number | null = null;
        let orderDesc = false;

        const chain = {
          where: (cond: any) => {
            condition = cond;
            return chain;
          },
          orderBy: (_order: any) => {
            orderDesc = true;
            return chain;
          },
          limit: (n: number) => {
            limitCount = n;
            return chain;
          },
          then: (resolve: any, reject?: any) => {
            try {
              const data = getTableData(table);
              let results = data.filter((row) => rowMatches(row, condition));
              if (orderDesc) {
                results = [...results].reverse();
              }
              if (limitCount !== null) {
                results = results.slice(0, limitCount);
              }
              if (projection && typeof projection === "object" && !Array.isArray(projection)) {
                const keys = Object.keys(projection);
                results = results.map((row) => {
                  const mapped: any = {};
                  for (const k of keys) {
                    mapped[k] = row[k] ?? row[toCamel(k)];
                  }
                  return mapped;
                });
              }
              resolve(results);
            } catch (err) {
              if (reject) reject(err);
              else throw err;
            }
          },
        };
        return chain;
      },
    }),

    insert: (table: any) => ({
      values: (val: any) => {
        const data = getTableData(table);
        const row = {
          id: val.id || crypto.randomUUID(),
          createdAt: val.createdAt || new Date().toISOString(),
          updatedAt: val.updatedAt || new Date().toISOString(),
          role: val.role || "user",
          ...val,
        };
        data.push(row);
        saveStore();
        const chain = {
          returning: () => Promise.resolve([row]),
          then: (resolve: any) => resolve([row]),
        };
        return chain;
      },
    }),

    update: (table: any) => ({
      set: (updates: any) => ({
        where: (condition: any) => {
          const data = getTableData(table);
          const updatedRows: any[] = [];
          for (let i = 0; i < data.length; i++) {
            if (rowMatches(data[i], condition)) {
              data[i] = {
                ...data[i],
                ...updates,
                updatedAt: updates.updatedAt || new Date().toISOString(),
              };
              updatedRows.push(data[i]);
            }
          }
          saveStore();
          const chain = {
            returning: () => Promise.resolve(updatedRows),
            then: (resolve: any) => resolve(updatedRows),
          };
          return chain;
        },
      }),
    }),

    delete: (table: any) => ({
      where: (condition: any) => {
        const data = getTableData(table);
        const deleted: any[] = [];
        for (let i = data.length - 1; i >= 0; i--) {
          if (rowMatches(data[i], condition)) {
            deleted.push(data[i]);
            data.splice(i, 1);
          }
        }
        saveStore();
        const chain = {
          returning: () => Promise.resolve(deleted),
          then: (resolve: any) => resolve(deleted),
        };
        return chain;
      },
    }),
  };
}

let dbInstance: any = null;

const connectionString = process.env.DATABASE_URL;

// Only connect to postgres if it is a real non-localhost or valid database connection
if (connectionString && !connectionString.includes("localhost") && !connectionString.includes("user:password")) {
  try {
    const postgresModule: any = await (import("postgres" as any));
    const postgres = postgresModule.default || postgresModule;
    const drizzleModule: any = await (import("drizzle-orm/postgres-js" as any));
    const drizzle = drizzleModule.drizzle;
    const client = postgres(connectionString, {
      max: 10,
      connect_timeout: 5,
    });
    dbInstance = drizzle(client, { schema });
    console.log("[DB] Connected to PostgreSQL via DATABASE_URL");
  } catch (error) {
    console.warn("[DB] Failed to connect to PostgreSQL, falling back to persistent store:", error);
    dbInstance = createMockDb();
  }
} else {
  dbInstance = createMockDb();
}

export const db = dbInstance;
