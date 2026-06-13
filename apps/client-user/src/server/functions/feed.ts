import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getSessionData } from "../../lib/session.server";

const { posts, users, likes, comments, follows } = schema;

// ─── Helper: get like/comment counts for a post ──────────────────────────────
async function getPostCounts(postId: string, userId?: string | null) {
	const likesResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(likes)
		.where(eq(likes.postId, postId))
		.get();

	const commentsResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(comments)
		.where(eq(comments.postId, postId))
		.get();

	let isLiked = false;
	if (userId) {
		const likeStatus = await db
			.select()
			.from(likes)
			.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
			.get();
		isLiked = !!likeStatus;
	}

	return {
		likeCount: likesResult?.count || 0,
		commentCount: commentsResult?.count || 0,
		isLiked,
	};
}

// ─── Home Feed (posts from users you follow + your own) ──────────────────────
export const getHomeFeed = createServerFn()
	.inputValidator((d?: { limit?: number; offset?: number }) => d)
	.handler(async ({ data: options }) => {
		const session = await getSessionData();
		if (!session) return [];

		const limit = options?.limit || 20;
		const offset = options?.offset || 0;
		const userId = session.userId;

		// Get IDs of people the user follows
		const following = await db
			.select({ followingId: follows.followingId })
			.from(follows)
			.where(eq(follows.followerId, userId));

		const userIds = [userId, ...following.map((f) => f.followingId)];

		const result = await db
			.select({
				id: posts.id,
				content: posts.content,
				createdAt: posts.createdAt,
				updatedAt: posts.updatedAt,
				author: {
					id: users.id,
					username: users.username,
					displayName: users.displayName,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(posts)
			.leftJoin(users, eq(posts.authorId, users.id))
			.where(inArray(posts.authorId, userIds))
			.orderBy(desc(posts.createdAt))
			.limit(limit)
			.offset(offset);

		return Promise.all(
			result.map(async (post) => ({ ...post, ...(await getPostCounts(post.id, userId)) })),
		);
	});

// ─── Explore Feed (all posts) ────────────────────────────────────────────────
export const getExploreFeed = createServerFn()
	.inputValidator((d?: { limit?: number; offset?: number }) => d)
	.handler(async ({ data: options }) => {
		const session = await getSessionData();
		const limit = options?.limit || 20;
		const offset = options?.offset || 0;

		const result = await db
			.select({
				id: posts.id,
				content: posts.content,
				createdAt: posts.createdAt,
				updatedAt: posts.updatedAt,
				author: {
					id: users.id,
					username: users.username,
					displayName: users.displayName,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(posts)
			.leftJoin(users, eq(posts.authorId, users.id))
			.orderBy(desc(posts.createdAt))
			.limit(limit)
			.offset(offset);

		return Promise.all(
			result.map(async (post) => ({
				...post,
				...(await getPostCounts(post.id, session?.userId)),
			})),
		);
	});
