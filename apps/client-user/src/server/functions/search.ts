import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { getSessionData } from "../../lib/session.server";

const { posts, users, likes, comments } = schema;

async function getPostCounts(postId: string, userId?: string | null) {
	const likeCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(likes)
		.where(eq(likes.postId, postId))
		.get();
	const commentCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(comments)
		.where(eq(comments.postId, postId))
		.get();
	let isLiked = false;
	if (userId) {
		const l = await db
			.select()
			.from(likes)
			.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
			.get();
		isLiked = !!l;
	}
	return { likeCount: likeCount?.count || 0, commentCount: commentCount?.count || 0, isLiked };
}

// ─── Search Posts ────────────────────────────────────────────────────────────
export const searchPosts = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: query }) => {
		if (!query?.trim()) return [];
		const session = await getSessionData();
		const pattern = `%${query}%`;

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
			.where(like(posts.content, pattern))
			.orderBy(desc(posts.createdAt))
			.limit(50);

		return Promise.all(
			result.map(async (post) => ({ ...post, ...(await getPostCounts(post.id, session?.userId)) })),
		);
	});

// ─── Search Users ────────────────────────────────────────────────────────────
export const searchUsers = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: query }) => {
		if (!query?.trim()) return [];
		const pattern = `%${query.toLowerCase()}%`;

		return db
			.select({
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl,
				bio: users.bio,
			})
			.from(users)
			.where(
				or(
					sql`LOWER(${users.username}) LIKE ${pattern}`,
					sql`LOWER(${users.displayName}) LIKE ${pattern}`,
				),
			)
			.limit(20);
	});
