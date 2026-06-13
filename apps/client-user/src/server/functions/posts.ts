import { db, schema } from "@vaye/db-schema/db";
import { generateId } from "@vaye/db-schema/utils";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSessionData, requireAuth } from "../../lib/session.server";

const { posts, users, likes, comments } = schema;

// ─── Helper ──────────────────────────────────────────────────────────────────
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

	return { likeCount: likesResult?.count || 0, commentCount: commentsResult?.count || 0, isLiked };
}

// ─── Create Post ─────────────────────────────────────────────────────────────
export const createPost = createServerFn({ method: "POST" })
	.inputValidator((d: { content: string }) => d)
	.handler(async ({ data }) => {
		const session = await requireAuth();
		if (!data.content?.trim()) throw new Error("Post content is required");
		if (data.content.length > 280) throw new Error("Post content must be 280 characters or less");

		const postId = generateId();
		await db.insert(posts).values({ id: postId, content: data.content, authorId: session.userId });
		return { success: true, postId };
	});

// ─── Get Single Post ─────────────────────────────────────────────────────────
export const getPost = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await getSessionData();

		const post = await db
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
			.where(eq(posts.id, postId))
			.get();

		if (!post) throw new Error("Post not found");
		const counts = await getPostCounts(postId, session?.userId);
		return { ...post, ...counts };
	});

// ─── Update Post ─────────────────────────────────────────────────────────────
export const updatePost = createServerFn({ method: "POST" })
	.inputValidator((d: { postId: string; content: string }) => d)
	.handler(async ({ data }) => {
		const session = await requireAuth();
		const post = await db.select().from(posts).where(eq(posts.id, data.postId)).get();

		if (!post) throw new Error("Post not found");
		if (post.authorId !== session.userId) throw new Error("You can only edit your own posts");
		if (Date.now() - post.createdAt.getTime() > 300_000)
			throw new Error("Edit window has expired (5 minutes)");

		await db
			.update(posts)
			.set({ content: data.content, updatedAt: new Date() })
			.where(eq(posts.id, data.postId));

		return { success: true };
	});

// ─── Delete Post ─────────────────────────────────────────────────────────────
export const deletePost = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await requireAuth();
		const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

		if (!post) throw new Error("Post not found");
		if (post.authorId !== session.userId) throw new Error("You can only delete your own posts");

		await db.delete(posts).where(eq(posts.id, postId));
		return { success: true };
	});

// ─── Get All Posts ───────────────────────────────────────────────────────────
export const getPosts = createServerFn()
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
			result.map(async (post) => ({ ...post, ...(await getPostCounts(post.id, session?.userId)) })),
		);
	});

// ─── Get Posts By Username ───────────────────────────────────────────────────
export const getUserPosts = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const session = await getSessionData();

		const user = await db.select().from(users).where(eq(users.username, username)).get();
		if (!user) throw new Error("User not found");

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
			.where(eq(posts.authorId, user.id))
			.orderBy(desc(posts.createdAt));

		return Promise.all(
			result.map(async (post) => ({ ...post, ...(await getPostCounts(post.id, session?.userId)) })),
		);
	});
