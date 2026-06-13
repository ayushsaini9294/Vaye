import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { and, eq, sql } from "drizzle-orm";
import { getSessionData, requireAuth } from "../../lib/session.server";

const { users, posts, follows } = schema;

// ─── Get User Profile ────────────────────────────────────────────────────────
export const getUser = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const session = await getSessionData();

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
			.where(eq(users.username, username))
			.get();

		if (!user) throw new Error("User not found");

		// Follower count
		const followerResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(follows)
			.where(eq(follows.followingId, user.id))
			.get();

		// Following count
		const followingResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(follows)
			.where(eq(follows.followerId, user.id))
			.get();

		// Post count
		const postCountResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(posts)
			.where(eq(posts.authorId, user.id))
			.get();

		// Is the current user following this user?
		let isFollowing = false;
		if (session) {
			const followRecord = await db
				.select()
				.from(follows)
				.where(and(eq(follows.followerId, session.userId), eq(follows.followingId, user.id)))
				.get();
			isFollowing = !!followRecord;
		}

		return {
			...user,
			followerCount: followerResult?.count || 0,
			followingCount: followingResult?.count || 0,
			postCount: postCountResult?.count || 0,
			isFollowing,
		};
	});

// ─── Update Profile ──────────────────────────────────────────────────────────
export const updateProfile = createServerFn({ method: "POST" })
	.inputValidator((d: { displayName?: string; bio?: string; avatarUrl?: string }) => d)
	.handler(async ({ data }) => {
		const session = await requireAuth();

		await db
			.update(users)
			.set({
				...(data.displayName !== undefined && { displayName: data.displayName }),
				...(data.bio !== undefined && { bio: data.bio }),
				...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.userId));

		return { success: true };
	});
