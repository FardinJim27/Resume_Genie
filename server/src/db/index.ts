import * as schema from "./schema.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

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
    if (String(rowVal) !== String(val)) {
      return false;
    }
  }
  return true;
}

// In-memory tables
const memoryUsers: any[] = [];
const memoryResumes: any[] = [];

function createMockDb() {
  console.log("[DB] Using in-memory fallback store");

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
          createdAt: val.createdAt || new Date(),
          updatedAt: val.updatedAt || new Date(),
          role: val.role || "user",
          ...val,
        };
        data.push(row);
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
                updatedAt: updates.updatedAt || new Date(),
              };
              updatedRows.push(data[i]);
            }
          }
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

if (connectionString) {
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
    console.warn("[DB] Failed to connect to PostgreSQL, falling back to mock:", error);
    dbInstance = createMockDb();
  }
} else {
  dbInstance = createMockDb();
}

export const db = dbInstance;
