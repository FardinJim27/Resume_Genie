import { Router, Request, Response } from "express";
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
import { AuthRequest, authMiddleware } from "../middleware/auth.js";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({ error: "Email already registered" });
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
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
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
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Get current user
router.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
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
    try {
      const { email, newPassword } = req.body;

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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },
);

export default router;
