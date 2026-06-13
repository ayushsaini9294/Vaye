import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { generateId, hashPassword, verifyPassword } from "@vaye/db-schema/utils";
import { eq } from "drizzle-orm";
import { clearSessionData, getSessionData, setSessionData } from "../../lib/session.server";

const { users } = schema;

// ─── Register ────────────────────────────────────────────────────────────────
export const registerUser = createServerFn({ method: "POST" })
	.inputValidator(
		(d: { email: string; username: string; displayName: string; password: string }) => d,
	)
	.handler(async ({ data }) => {
		// Check if email already exists
		const existingEmail = await db.select().from(users).where(eq(users.email, data.email)).get();
		if (existingEmail) throw new Error("User with this email already exists");

		// Check if username already exists
		const existingUsername = await db
			.select()
			.from(users)
			.where(eq(users.username, data.username))
			.get();
		if (existingUsername) throw new Error("Username already taken");

		// Create user
		const userId = generateId();
		const passwordHash = await hashPassword(data.password);
		await db.insert(users).values({
			id: userId,
			email: data.email,
			username: data.username,
			displayName: data.displayName,
			passwordHash,
			role: "user",
		});

		// Save session cookie
		await setSessionData({ userId, username: data.username });
		return { success: true, userId };
	});

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginUser = createServerFn({ method: "POST" })
	.inputValidator((d: { email: string; password: string }) => d)
	.handler(async ({ data }) => {
		const user = await db.select().from(users).where(eq(users.email, data.email)).get();
		if (!user) throw new Error("Invalid email or password");

		if (user.bannedAt)
			throw new Error(`Account banned: ${user.bannedReason || "No reason provided"}`);

		const valid = await verifyPassword(data.password, user.passwordHash);
		if (!valid) throw new Error("Invalid email or password");

		await setSessionData({ userId: user.id, username: user.username });
		return { success: true, userId: user.id };
	});

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
	await clearSessionData();
	return { success: true };
});

// ─── Get Current User ────────────────────────────────────────────────────────
export const getCurrentUser = createServerFn().handler(async () => {
	const session = await getSessionData();
	if (!session) return null;

	try {
		const user = await db
			.select({
				id: users.id,
				email: users.email,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
				bio: users.bio,
				role: users.role,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(eq(users.id, session.userId))
			.get();

		if (!user) {
			await clearSessionData();
			return null;
		}

		return user;
	} catch {
		await clearSessionData();
		return null;
	}
});
