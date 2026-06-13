import { db, schema } from "@vaye/db-schema/db";
import { generateId } from "@vaye/db-schema/utils";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../lib/session.server";

const { likes, posts, comments, notifications } = schema;

// ─── Helper: create a notification (no self-notifications) ───────────────────
async function createNotification(input: {
	userId: string;
	type: string;
	actorId: string;
	postId?: string;
	commentId?: string;
}) {
	if (input.userId === input.actorId) return; // don't notify yourself
	await db.insert(notifications).values({
		id: generateId(),
		userId: input.userId,
		type: input.type,
		actorId: input.actorId,
		postId: input.postId || null,
		commentId: input.commentId || null,
	});
}

// ─── Toggle Post Like ────────────────────────────────────────────────────────
export const togglePostLike = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await requireAuth();
		const { userId } = session;

		const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
		if (!post) throw new Error("Post not found");

		const existingLike = await db
			.select()
			.from(likes)
			.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
			.get();

		if (existingLike) {
			await db.delete(likes).where(eq(likes.id, existingLike.id));
			return { success: true, liked: false };
		}

		await db.insert(likes).values({ id: generateId(), postId, userId });
		await createNotification({ userId: post.authorId, type: "like", actorId: userId, postId });
		return { success: true, liked: true };
	});

// ─── Toggle Comment Like ─────────────────────────────────────────────────────
export const toggleCommentLike = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: commentId }) => {
		const session = await requireAuth();
		const { userId } = session;

		const comment = await db.select().from(comments).where(eq(comments.id, commentId)).get();
		if (!comment) throw new Error("Comment not found");

		const existingLike = await db
			.select()
			.from(likes)
			.where(and(eq(likes.commentId, commentId), eq(likes.userId, userId)))
			.get();

		if (existingLike) {
			await db.delete(likes).where(eq(likes.id, existingLike.id));
			return { success: true, liked: false };
		}

		await db.insert(likes).values({ id: generateId(), commentId, userId });
		await createNotification({
			userId: comment.authorId,
			type: "like",
			actorId: userId,
			commentId,
		});
		return { success: true, liked: true };
	});

// ─── Get Post Like Status ────────────────────────────────────────────────────
export const getPostLikeStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await requireAuth();
		const like = await db
			.select()
			.from(likes)
			.where(and(eq(likes.postId, postId), eq(likes.userId, session.userId)))
			.get();
		return { liked: !!like };
	});

// ─── Get Comment Like Status ─────────────────────────────────────────────────
export const getCommentLikeStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: commentId }) => {
		const session = await requireAuth();
		const like = await db
			.select()
			.from(likes)
			.where(and(eq(likes.commentId, commentId), eq(likes.userId, session.userId)))
			.get();
		return { liked: !!like };
	});
