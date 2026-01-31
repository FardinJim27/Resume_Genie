import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { db } from "../db/index.js";
import { users, resumes } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// All admin routes require both auth and admin middleware
router.use(authMiddleware, adminMiddleware);

// Get all users
router.get("/users", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);

    res.json(allUsers);
  } catch (error) {
    console.error("Admin fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get all resumes (across all users)
router.get(
  "/resumes",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const allResumes = await db.select().from(resumes);

      res.json(allResumes);
    } catch (error) {
      console.error("Admin fetch resumes error:", error);
      res.status(500).json({ error: "Failed to fetch resumes" });
    }
  },
);

// Update user role
router.patch(
  "/users/:id/role",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      let id = req.params.id;
      if (Array.isArray(id)) {
        id = id[0];
      }
      const { role } = req.body;

      if (!role || !["user", "admin"].includes(role)) {
        res
          .status(400)
          .json({ error: 'Invalid role. Must be "user" or "admin"' });
        return;
      }

      const [updatedUser] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        message: "User role updated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      console.error("Admin update role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  },
);

// Delete user (admin only)
router.delete(
  "/users/:id",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      let id = req.params.id;
      if (Array.isArray(id)) {
        id = id[0];
      }

      // Prevent self-deletion
      if (id === req.user?.userId) {
        res.status(400).json({ error: "Cannot delete your own account" });
        return;
      }

      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();

      if (!deletedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

// Get statistics
router.get("/stats", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userStats = await db.select().from(users);

    const resumeStats = await db.select().from(resumes);

    const totalUsers = userStats.length || 0;
    const totalResumes = resumeStats.length || 0;
    const adminUsers =
      userStats.filter((u: any) => u.role === "admin").length || 0;

    res.json({
      totalUsers,
      totalResumes,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
