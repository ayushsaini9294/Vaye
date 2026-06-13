import { createServerFn } from "@tanstack/react-start";
import { db } from "@vaye/db-schema/db";
import { users } from "@vaye/db-schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@vaye/db-schema/utils";
import {
	clearAdminSessionData,
	getAdminSessionData,
	setAdminSessionData,
} from "../../lib/session.server";

export const loginAdmin = createServerFn({ method: "POST" })
	.inputValidator((d: { email: string; password: string }) => d)
	.handler(async ({ data }) => {
		const user = await db.query.users.findFirst({
			where: eq(users.email, data.email),
		});

		if (!user) {
			throw new Error("Invalid email or password");
		}

		const isValid = await verifyPassword(user.passwordHash, data.password);
		if (!isValid) {
			throw new Error("Invalid email or password");
		}

		if (user.role !== "admin" && user.role !== "moderator") {
			throw new Error("Access denied. Admin or moderator role required.");
		}

		// Store admin session in cookie
		await setAdminSessionData({
			userId: user.id,
			username: user.username,
			role: user.role,
		});

		return { success: true, userId: user.id, role: user.role };
	});

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
	await clearAdminSessionData();
	return { success: true };
});

export const getCurrentAdmin = createServerFn().handler(async () => {
	const session = await getAdminSessionData();
	if (!session) return null;

	try {
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.userId),
		});

		if (!user || (user.role !== "admin" && user.role !== "moderator")) {
			await clearAdminSessionData();
			return null;
		}

		return {
			id: user.id,
			email: user.email,
			username: user.username,
			displayName: user.displayName,
			avatarUrl: user.avatarUrl ?? undefined,
			role: user.role as "admin" | "moderator",
			createdAt: user.createdAt,
		};
	} catch {
		await clearAdminSessionData();
		return null;
	}
});

/**
 * Server function to check if user is authenticated as admin
 * Used by route guards
 */
export const checkAdminAuth = createServerFn().handler(async () => {
	const session = await getAdminSessionData();
	return {
		isAuthenticated: !!session,
		role: session?.role ?? null,
	};
});
