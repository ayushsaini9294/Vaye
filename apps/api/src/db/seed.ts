import { generateId, hashPassword } from "../services/utils";
import { db, schema } from "./index";

const { users, posts, comments, likes, follows } = schema;

async function seed() {
	console.log("Seeding database...");
	
	// Clear existing data
	console.log("Clearing existing data...");
	await db.delete(follows);
	await db.delete(likes);
	await db.delete(comments);
	await db.delete(posts);
	await db.delete(users);

	// Create admin user
	const adminUser = {
		id: generateId(),
		email: "ayushsaini9294@gmail.com",
		username: "admin",
		displayName: "Ayush Saini",
		password: "ayush9294saini",
		role: "admin" as const,
		bio: "Platform administrator",
	};

	// Insert user
	const passwordHash = await hashPassword(adminUser.password);
	await db
		.insert(users)
		.values({
			id: adminUser.id,
			email: adminUser.email,
			username: adminUser.username,
			displayName: adminUser.displayName,
			passwordHash,
			role: adminUser.role,
			bio: adminUser.bio,
		})
		.onConflictDoNothing();
	console.log(`Created user: ${adminUser.username}`);

	console.log("Database seeded successfully!");
}

seed().catch(console.error);
