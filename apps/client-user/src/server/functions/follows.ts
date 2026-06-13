import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { generateId } from "@vaye/db-schema/utils";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getSessionData, requireAuth } from "../../lib/session.server";

const { follows, users, notifications } = schema;

// ─── Toggle Follow ───────────────────────────────────────────────────────────
export const toggleFollow = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const session = await requireAuth();
		const followerId = session.userId;

		const userToFollow = await db.select().from(users).where(eq(users.username, username)).get();
		if (!userToFollow) throw new Error("User not found");
		if (userToFollow.id === followerId) throw new Error("You cannot follow yourself");

		const existingFollow = await db
			.select()
			.from(follows)
			.where(and(eq(follows.followerId, followerId), eq(follows.followingId, userToFollow.id)))
			.get();

		if (existingFollow) {
			await db.delete(follows).where(eq(follows.id, existingFollow.id));
			return { success: true, following: false };
		}

		await db.insert(follows).values({ id: generateId(), followerId, followingId: userToFollow.id });

		// Notify the followed user
		if (userToFollow.id !== followerId) {
			await db.insert(notifications).values({
				id: generateId(),
				userId: userToFollow.id,
				type: "follow",
				actorId: followerId,
			});
		}

		return { success: true, following: true };
	});

// ─── Get Follow Status ───────────────────────────────────────────────────────
export const getFollowStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const session = await requireAuth();
		const userToCheck = await db.select().from(users).where(eq(users.username, username)).get();
		if (!userToCheck) throw new Error("User not found");

		const follow = await db
			.select()
			.from(follows)
			.where(and(eq(follows.followerId, session.userId), eq(follows.followingId, userToCheck.id)))
			.get();

		return { following: !!follow };
	});

// ─── Follower Count ──────────────────────────────────────────────────────────
export const getFollowerCount = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const user = await db.select().from(users).where(eq(users.username, username)).get();
		if (!user) throw new Error("User not found");

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(follows)
			.where(eq(follows.followingId, user.id))
			.get();

		return result?.count || 0;
	});

// ─── Following Count ─────────────────────────────────────────────────────────
export const getFollowingCount = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const user = await db.select().from(users).where(eq(users.username, username)).get();
		if (!user) throw new Error("User not found");

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(follows)
			.where(eq(follows.followerId, user.id))
			.get();

		return result?.count || 0;
	});

// ─── Get Followers List ──────────────────────────────────────────────────────
export const getFollowersFn = createServerFn()
	.inputValidator((d: { username: string; limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const session = await getSessionData();
		const user = await db.select().from(users).where(eq(users.username, data.username)).get();
		if (!user) throw new Error("User not found");

		const followersResult = await db
			.select({
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
				bio: users.bio,
			})
			.from(follows)
			.innerJoin(users, eq(follows.followerId, users.id))
			.where(eq(follows.followingId, user.id))
			.limit(data.limit || 20)
			.offset(data.offset || 0);

		const total = await db
			.select({ count: sql<number>`count(*)` })
			.from(follows)
			.where(eq(follows.followingId, user.id))
			.get();

		let resultUsers = followersResult.map((u) => ({ ...u, isFollowing: false }));
		if (session && resultUsers.length > 0) {
			const ids = resultUsers.map((u) => u.id);
			const existingFollows = await db
				.select({ followingId: follows.followingId })
				.from(follows)
				.where(and(eq(follows.followerId, session.userId), inArray(follows.followingId, ids)));
			const followedSet = new Set(existingFollows.map((f) => f.followingId));
			resultUsers = resultUsers.map((u) => ({ ...u, isFollowing: followedSet.has(u.id) }));
		}

		return { users: resultUsers, total: total?.count || 0 };
	});

// ─── Get Following List ──────────────────────────────────────────────────────
export const getFollowingFn = createServerFn()
	.inputValidator((d: { username: string; limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const session = await getSessionData();
		const user = await db.select().from(users).where(eq(users.username, data.username)).get();
		if (!user) throw new Error("User not found");

		const followingResult = await db
			.select({
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
				bio: users.bio,
			})
			.from(follows)
			.innerJoin(users, eq(follows.followingId, users.id))
			.where(eq(follows.followerId, user.id))
			.limit(data.limit || 20)
			.offset(data.offset || 0);

		const total = await db
			.select({ count: sql<number>`count(*)` })
			.from(follows)
			.where(eq(follows.followerId, user.id))
			.get();

		let resultUsers = followingResult.map((u) => ({ ...u, isFollowing: false }));
		if (session && resultUsers.length > 0) {
			const ids = resultUsers.map((u) => u.id);
			const existingFollows = await db
				.select({ followingId: follows.followingId })
				.from(follows)
				.where(and(eq(follows.followerId, session.userId), inArray(follows.followingId, ids)));
			const followedSet = new Set(existingFollows.map((f) => f.followingId));
			resultUsers = resultUsers.map((u) => ({ ...u, isFollowing: followedSet.has(u.id) }));
		}

		return { users: resultUsers, total: total?.count || 0 };
	});
