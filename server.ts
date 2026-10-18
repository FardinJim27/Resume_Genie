import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./server/src/routes/auth.js";
import resumeRoutes, { handleParseAndAnalyzeResume } from "./server/src/routes/resumes.js";
import adminRoutes from "./server/src/routes/admin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5173;
const HOST = "0.0.0.0";

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "server/uploads"),
);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  fileUpload({
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760") },
    abortOnLimit: true,
  }),
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/admin", adminRoutes);

// Direct file upload and analysis endpoint aliases
app.post("/api/upload", handleParseAndAnalyzeResume);
app.post("/api/parse-resume", handleParseAndAnalyzeResume);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Full-stack React Router + Vite integration
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  // SPA mode (ssr: false) — serve static client build, fall back to index.html
  const clientBuildPath = path.resolve(__dirname, "build/client");
  app.use(express.static(clientBuildPath));

  // All non-API routes serve index.html (client-side routing)
  app.get(/^(?!\/api).*/, (req, res) => {
    const indexPath = path.join(clientBuildPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(503).json({ error: "App not built. Run npm run build first." });
    }
  });
} else {
  // In development, mount Vite dev middleware
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: {
      middlewareMode: true,
      host: HOST,
      port: PORT,
      allowedHosts: true,
    },
  });
  app.use(vite.middlewares);
}

// Global error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(PORT, HOST, () => {
  console.log(`🚀 Resume Genie server ready on http://${HOST}:${PORT}`);
});
