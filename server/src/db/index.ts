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
