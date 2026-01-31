import { db } from "./db/index";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const makeAdmin = async (email: string) => {
  try {
    console.log(`\n🔐 Making user admin...`);
    console.log(`Email: ${email}\n`);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`❌ User with email "${email}" not found!`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`ℹ️  User "${user.username}" is already an admin!`);
      process.exit(0);
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    console.log(`✅ Success! User "${updatedUser.username}" is now an admin!`);
    console.log(`\nUser Details:`);
    console.log(`  ID: ${updatedUser.id}`);
    console.log(`  Username: ${updatedUser.username}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log();

    process.exit(0);
  } catch (error) {
    console.error("❌ Error making user admin:", error);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("\n❌ Error: Email address required!\n");
  console.log("Usage: npm run make-admin <email>\n");
  console.log("Example: npm run make-admin fardinahmed.jim.7@gmail.com\n");
  process.exit(1);
}

makeAdmin(email);
