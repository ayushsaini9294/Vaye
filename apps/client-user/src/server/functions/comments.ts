import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { generateId } from "@vaye/db-schema/utils";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getSessionData, requireAuth } from "../../lib/session.server";

const { comments, users, likes, posts, notifications } = schema;

// ─── Create Comment ──────────────────────────────────────────────────────────
export const createComment = createServerFn({ method: "POST" })
	.inputValidator((d: { postId: string; content: string; parentId?: string }) => d)
	.handler(async ({ data }) => {
		const session = await requireAuth();
		if (!data.content?.trim()) throw new Error("Comment content is required");

		const post = await db.select().from(posts).where(eq(posts.id, data.postId)).get();
		if (!post) throw new Error("Post not found");

		if (data.parentId) {
			const parent = await db.select().from(comments).where(eq(comments.id, data.parentId)).get();
			if (!parent) throw new Error("Parent comment not found");
			if (parent.parentId) throw new Error("Cannot reply to a reply");
		}

		const commentId = generateId();
		await db.insert(comments).values({
			id: commentId,
			content: data.content,
			postId: data.postId,
			authorId: session.userId,
			parentId: data.parentId || null,
		});

		// Notify the post author
		if (post.authorId !== session.userId) {
			await db.insert(notifications).values({
				id: generateId(),
				userId: post.authorId,
				type: "comment",
				actorId: session.userId,
				postId: data.postId,
				commentId,
			});
		}

		return { success: true, commentId };
	});

// ─── Get Comments For a Post ─────────────────────────────────────────────────
export const getPostComments = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await getSessionData();
		const userId = session?.userId;

		// Top-level comments only (parentId IS NULL)
		const topLevel = await db
			.select({
				id: comments.id,
				content: comments.content,
				createdAt: comments.createdAt,
				parentId: comments.parentId,
				author: {
					id: users.id,
					username: users.username,
					displayName: users.displayName,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(comments)
			.leftJoin(users, eq(comments.authorId, users.id))
			.where(and(eq(comments.postId, postId), isNull(comments.parentId)));

		return Promise.all(
			topLevel.map(async (comment) => {
				// Like count for this comment
				const likeCountResult = await db
					.select({ count: sql<number>`count(*)` })
					.from(likes)
					.where(eq(likes.commentId, comment.id))
					.get();

				let isLiked = false;
				if (userId) {
					const likeStatus = await db
						.select()
						.from(likes)
						.where(and(eq(likes.commentId, comment.id), eq(likes.userId, userId)))
						.get();
					isLiked = !!likeStatus;
				}

				// Replies
				const replies = await db
					.select({
						id: comments.id,
						content: comments.content,
						createdAt: comments.createdAt,
						parentId: comments.parentId,
						author: {
							id: users.id,
							username: users.username,
							displayName: users.displayName,
							avatarUrl: users.avatarUrl,
						},
					})
					.from(comments)
					.leftJoin(users, eq(comments.authorId, users.id))
					.where(eq(comments.parentId, comment.id));

				const repliesWithLikes = await Promise.all(
					replies.map(async (reply) => {
						const rLikeCount = await db
							.select({ count: sql<number>`count(*)` })
							.from(likes)
							.where(eq(likes.commentId, reply.id))
							.get();
						let rIsLiked = false;
						if (userId) {
							const rLike = await db
								.select()
								.from(likes)
								.where(and(eq(likes.commentId, reply.id), eq(likes.userId, userId)))
								.get();
							rIsLiked = !!rLike;
						}
						return { ...reply, likeCount: rLikeCount?.count || 0, isLiked: rIsLiked, replies: [] };
					}),
				);

				return {
					...comment,
					likeCount: likeCountResult?.count || 0,
					isLiked,
					replies: repliesWithLikes,
				};
			}),
		);
	});

// ─── Delete Comment ──────────────────────────────────────────────────────────
export const deleteComment = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: commentId }) => {
		const session = await requireAuth();
		const comment = await db.select().from(comments).where(eq(comments.id, commentId)).get();

		if (!comment) throw new Error("Comment not found");
		if (comment.authorId !== session.userId)
			throw new Error("You can only delete your own comments");

		await db.delete(comments).where(eq(comments.id, commentId));
		return { success: true };
	});
