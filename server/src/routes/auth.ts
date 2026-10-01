import express from "express";
import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  registerSchema,
  loginSchema,
  hashPassword,
  verifyPassword,
  generateToken,
} from "../lib/auth.js";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// Helper to extract clean error message
function getCleanZodError(error: unknown): string {
  if (error && typeof error === "object" && "issues" in error && Array.isArray((error as any).issues)) {
    const firstIssue = (error as any).issues[0];
    if (firstIssue) {
      if (firstIssue.path?.includes("email")) return "Please provide a valid email address.";
      if (firstIssue.path?.includes("password")) return "Password must be at least 8 characters.";
      if (firstIssue.path?.includes("username")) return "Username must be at least 3 characters.";
      return firstIssue.message || "Invalid input data.";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected authentication error occurred.";
}

// Register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Content-Type", "application/json");
  try {
    const rawBody = req.body || {};
    const parsed = registerSchema.parse({
      username: (rawBody.username || "").trim(),
      email: (rawBody.email || "").trim().toLowerCase(),
      password: rawBody.password || "",
    });

    const { username, email, password } = parsed;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({ error: "Email is already registered. Please sign in instead." });
      return;
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
      })
      .returning();

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    const message = getCleanZodError(error);
    res.status(400).json({ error: message });
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Content-Type", "application/json");
  try {
    const rawBody = req.body || {};
    const parsed = loginSchema.parse({
      email: (rawBody.email || "").trim().toLowerCase(),
      password: rawBody.password || "",
    });

    const { email, password } = parsed;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({
        error: "No account found with this email. Please click 'Create Account' to sign up.",
      });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      res.status(401).json({
        error: "Incorrect password. Please try again or use 'Forgot Password'.",
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    const message = getCleanZodError(error);
    res.status(400).json({ error: message });
  }
});

// Get current user
router.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    res.setHeader("Content-Type", "application/json");
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.userId))
        .limit(1);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Reset password
router.post(
  "/reset-password",
  async (req: Request, res: Response): Promise<void> => {
    res.setHeader("Content-Type", "application/json");
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      const newPassword = req.body?.newPassword || "";

      if (!email || !newPassword) {
        res.status(400).json({ error: "Email and new password are required" });
        return;
      }

      if (newPassword.length < 8) {
        res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
        return;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // For security, don't reveal that the email doesn't exist
        res.json({ message: "If the email exists, password has been reset" });
        return;
      }

      const passwordHash = await hashPassword(newPassword);

      await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

      res.json({ message: "Password reset successful" });
    } catch (error) {
      const message = getCleanZodError(error);
      res.status(400).json({ error: message });
    }
  },
);

export default router;
