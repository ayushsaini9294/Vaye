import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAuth } from "../../lib/session.server";

const { notifications, users, posts, comments } = schema;

// ─── Get Notifications ───────────────────────────────────────────────────────
export const getNotifications = createServerFn()
	.inputValidator((d: { limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const session = await requireAuth();
		const limit = data.limit || 20;
		const offset = data.offset || 0;

		const results = await db
			.select({
				id: notifications.id,
				type: notifications.type,
				read: notifications.read,
				createdAt: notifications.createdAt,
				postId: notifications.postId,
				commentId: notifications.commentId,
				actor: {
					id: users.id,
					username: users.username,
					displayName: users.displayName,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(notifications)
			.leftJoin(users, eq(notifications.actorId, users.id))
			.where(eq(notifications.userId, session.userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit)
			.offset(offset);

		return Promise.all(
			results.map(async (n) => {
				let postContent: string | null = null;
				let commentContent: string | null = null;

				if (n.postId) {
					const post = await db
						.select({ content: posts.content })
						.from(posts)
						.where(eq(posts.id, n.postId))
						.get();
					postContent = post?.content?.substring(0, 100) || null;
				}

				if (n.commentId) {
					const comment = await db
						.select({ content: comments.content })
						.from(comments)
						.where(eq(comments.id, n.commentId))
						.get();
					commentContent = comment?.content?.substring(0, 100) || null;
				}

				return { ...n, postContent, commentContent };
			}),
		);
	});

// ─── Get Unread Count ────────────────────────────────────────────────────────
export const getUnreadCount = createServerFn().handler(async () => {
	const session = await requireAuth();
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(notifications)
		.where(and(eq(notifications.userId, session.userId), eq(notifications.read, false)))
		.get();
	return result?.count || 0;
});

// ─── Mark One As Read ────────────────────────────────────────────────────────
export const markAsRead = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: notificationId }) => {
		const session = await requireAuth();
		const notification = await db
			.select()
			.from(notifications)
			.where(eq(notifications.id, notificationId))
			.get();

		if (!notification) throw new Error("Notification not found");
		if (notification.userId !== session.userId) throw new Error("Unauthorized");

		await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
		return { success: true };
	});

// ─── Mark All As Read ────────────────────────────────────────────────────────
export const markAllAsRead = createServerFn({ method: "POST" }).handler(async () => {
	const session = await requireAuth();
	await db
		.update(notifications)
		.set({ read: true })
		.where(eq(notifications.userId, session.userId));
	return { success: true };
});

// ─── Delete Notification ─────────────────────────────────────────────────────
export const deleteNotification = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: notificationId }) => {
		const session = await requireAuth();
		const notification = await db
			.select()
			.from(notifications)
			.where(eq(notifications.id, notificationId))
			.get();

		if (!notification) throw new Error("Notification not found");
		if (notification.userId !== session.userId) throw new Error("Unauthorized");

		await db.delete(notifications).where(eq(notifications.id, notificationId));
		return { success: true };
	});
