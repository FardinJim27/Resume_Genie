import { db } from "./db/index";
import { users } from "./db/schema";
import dotenv from "dotenv";

dotenv.config();

const listUsers = async () => {
  try {
    console.log(`\n📋 Listing all users...\n`);

    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);

    if (allUsers.length === 0) {
      console.log(`No users found in database.`);
      console.log(`\nPlease register a user through the website first:\n`);
      console.log(`  http://localhost:5173/auth\n`);
    } else {
      console.log(`Found ${allUsers.length} user(s):\n`);

      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log();
      });

      console.log(`To make a user admin, run:`);
      console.log(`  npm run make-admin EMAIL\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error listing users:", error);
    process.exit(1);
  }
};

listUsers();
