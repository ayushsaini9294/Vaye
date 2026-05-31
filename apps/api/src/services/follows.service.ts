import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { createNotification } from "./notifications.service";
import { generateId } from "./utils";

const { follows, users } = schema;

export async function toggleFollow(username: string, followerId: string) {
	// Find user to follow
	const userToFollow = await db.select().from(users).where(eq(users.username, username)).get();

	if (!userToFollow) {
		throw new Error("User not found");
	}

	// Cannot follow yourself
	if (userToFollow.id === followerId) {
		throw new Error("You cannot follow yourself");
	}

	// Check if already following
	const existingFollow = await db
		.select()
		.from(follows)
		.where(and(eq(follows.followerId, followerId), eq(follows.followingId, userToFollow.id)))
		.get();

	if (existingFollow) {
		// Unfollow
		await db.delete(follows).where(eq(follows.id, existingFollow.id));
		return { following: false };
	} else {
		// Follow
		await db.insert(follows).values({
			id: generateId(),
			followerId,
			followingId: userToFollow.id,
		});

		// Create notification for followed user
		await createNotification({
			userId: userToFollow.id,
			type: "follow",
			actorId: followerId,
		});

		return { following: true };
	}
}

export async function getFollowStatus(username: string, followerId: string) {
	const userToCheck = await db.select().from(users).where(eq(users.username, username)).get();

	if (!userToCheck) {
		throw new Error("User not found");
	}

	const follow = await db
		.select()
		.from(follows)
		.where(and(eq(follows.followerId, followerId), eq(follows.followingId, userToCheck.id)))
		.get();

	return { following: !!follow };
}

export async function getFollowerCount(username: string) {
	const user = await db.select().from(users).where(eq(users.username, username)).get();

	if (!user) {
		throw new Error("User not found");
	}

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followingId, user.id))
		.get();

	return { count: result?.count || 0 };
}

export async function getFollowingCount(username: string) {
	const user = await db.select().from(users).where(eq(users.username, username)).get();

	if (!user) {
		throw new Error("User not found");
	}

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followerId, user.id))
		.get();

	return { count: result?.count || 0 };
}

export async function getFollowers(
	username: string,
	limit: number,
	offset: number,
	requesterId?: string,
) {
	const user = await db.select().from(users).where(eq(users.username, username)).get();
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
		.limit(limit)
		.offset(offset)
		.orderBy(sql`${follows.createdAt} DESC`);

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followingId, user.id))
		.get();

	const total = countResult?.count || 0;

	let resultUsers = followersResult.map((u) => ({ ...u, isFollowing: false }));

	if (requesterId && resultUsers.length > 0) {
		const followedIds = resultUsers.map((u) => u.id);
		const existingFollows = await db
			.select({ followingId: follows.followingId })
			.from(follows)
			.where(and(eq(follows.followerId, requesterId), inArray(follows.followingId, followedIds)));

		const followedSet = new Set(existingFollows.map((f) => f.followingId));
		resultUsers = resultUsers.map((u) => ({
			...u,
			isFollowing: followedSet.has(u.id),
		}));
	}

	return { users: resultUsers, total };
}

export async function getFollowing(
	username: string,
	limit: number,
	offset: number,
	requesterId?: string,
) {
	const user = await db.select().from(users).where(eq(users.username, username)).get();
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
		.limit(limit)
		.offset(offset)
		.orderBy(sql`${follows.createdAt} DESC`);

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followerId, user.id))
		.get();

	const total = countResult?.count || 0;

	let resultUsers = followingResult.map((u) => ({ ...u, isFollowing: false }));

	if (requesterId && resultUsers.length > 0) {
		const followedIds = resultUsers.map((u) => u.id);
		const existingFollows = await db
			.select({ followingId: follows.followingId })
			.from(follows)
			.where(and(eq(follows.followerId, requesterId), inArray(follows.followingId, followedIds)));

		const followedSet = new Set(existingFollows.map((f) => f.followingId));
		resultUsers = resultUsers.map((u) => ({
			...u,
			isFollowing: followedSet.has(u.id),
		}));
	}

	return { users: resultUsers, total };
}
