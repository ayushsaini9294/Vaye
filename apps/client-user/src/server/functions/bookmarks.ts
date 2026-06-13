import { db, schema } from "@vaye/db-schema/db";
import { generateId } from "@vaye/db-schema/utils";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAuth } from "../../lib/session.server";

const { bookmarks, posts, users, likes, comments } = schema;

// ─── Toggle Bookmark ─────────────────────────────────────────────────────────
export const toggleBookmark = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await requireAuth();
		const { userId } = session;

		const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
		if (!post) throw new Error("Post not found");

		const existing = await db
			.select()
			.from(bookmarks)
			.where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)))
			.get();

		if (existing) {
			await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
			return { success: true, bookmarked: false };
		}

		await db.insert(bookmarks).values({ id: generateId(), postId, userId });
		return { success: true, bookmarked: true };
	});

// ─── Get Bookmark Status ─────────────────────────────────────────────────────
export const getBookmarkStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await requireAuth();
		const bookmark = await db
			.select()
			.from(bookmarks)
			.where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, session.userId)))
			.get();
		return { bookmarked: !!bookmark };
	});

// ─── Get Bookmarked Posts ────────────────────────────────────────────────────
export const getBookmarkedPosts = createServerFn()
	.inputValidator((d: { limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const session = await requireAuth();
		const { userId } = session;
		const limit = data.limit || 20;
		const offset = data.offset || 0;

		const savedBookmarks = await db
			.select({ postId: bookmarks.postId })
			.from(bookmarks)
			.where(eq(bookmarks.userId, userId))
			.orderBy(desc(bookmarks.createdAt))
			.limit(limit)
			.offset(offset);

		if (savedBookmarks.length === 0) return [];

		const postsWithDetails = await Promise.all(
			savedBookmarks.map(async (b) => {
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
					.where(eq(posts.id, b.postId))
					.get();

				if (!post) return null;

				const likeCountResult = await db
					.select({ count: sql<number>`count(*)` })
					.from(likes)
					.where(eq(likes.postId, post.id))
					.get();

				const commentCountResult = await db
					.select({ count: sql<number>`count(*)` })
					.from(comments)
					.where(eq(comments.postId, post.id))
					.get();

				const isLikedResult = await db
					.select()
					.from(likes)
					.where(and(eq(likes.postId, post.id), eq(likes.userId, userId)))
					.get();

				return {
					...post,
					likeCount: likeCountResult?.count || 0,
					commentCount: commentCountResult?.count || 0,
					isLiked: !!isLikedResult,
				};
			}),
		);

		return postsWithDetails.filter((p) => p !== null);
	});
