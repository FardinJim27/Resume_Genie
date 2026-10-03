import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import authRoutes from "../server/src/routes/auth.js";
import resumeRoutes, { handleParseAndAnalyzeResume } from "../server/src/routes/resumes.js";
import adminRoutes from "../server/src/routes/admin.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  fileUpload({
    limits: { fileSize: 10485760 },
    abortOnLimit: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/admin", adminRoutes);

app.post("/api/upload", handleParseAndAnalyzeResume);
app.post("/api/parse-resume", handleParseAndAnalyzeResume);

export default app;
