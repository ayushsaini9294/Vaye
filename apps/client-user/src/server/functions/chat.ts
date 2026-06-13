import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "@vaye/db-schema/db";
import { generateId } from "@vaye/db-schema/utils";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { requireAuth } from "../../lib/session.server";

const { conversations, messages, users } = schema;

// ─── Get Conversations ───────────────────────────────────────────────────────
export const getConversations = createServerFn()
	.inputValidator((d?: { limit?: number; offset?: number }) => d)
	.handler(async ({ data: options }) => {
		const session = await requireAuth();
		const { userId } = session;
		const limit = options?.limit || 20;
		const offset = options?.offset || 0;

		const convs = await db
			.select()
			.from(conversations)
			.where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)))
			.orderBy(desc(conversations.updatedAt))
			.limit(limit)
			.offset(offset);

		return Promise.all(
			convs.map(async (conv) => {
				const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

				const otherUser = await db
					.select({
						id: users.id,
						username: users.username,
						displayName: users.displayName,
						avatarUrl: users.avatarUrl,
					})
					.from(users)
					.where(eq(users.id, otherUserId))
					.get();

				const lastMessage = await db
					.select()
					.from(messages)
					.where(eq(messages.conversationId, conv.id))
					.orderBy(desc(messages.createdAt))
					.limit(1)
					.get();

				// Unread count (messages sent by the other user that are unread)
				const unreadMessages = await db
					.select()
					.from(messages)
					.where(
						and(
							eq(messages.conversationId, conv.id),
							eq(messages.read, false),
							eq(messages.senderId, otherUserId),
						),
					);

				return {
					id: conv.id,
					updatedAt: conv.updatedAt,
					unreadCount: unreadMessages.length,
					otherUser: otherUser || null,
					lastMessage: lastMessage || null,
				};
			}),
		);
	});

// ─── Get Messages in a Conversation ─────────────────────────────────────────
export const getMessages = createServerFn()
	.inputValidator((d: { conversationId: string; limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		await requireAuth();

		return db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, data.conversationId))
			.orderBy(desc(messages.createdAt))
			.limit(data.limit || 50)
			.offset(data.offset || 0);
	});

// ─── Send Message ────────────────────────────────────────────────────────────
export const sendMessage = createServerFn({ method: "POST" })
	.inputValidator((d: { receiverUsername: string; content: string }) => d)
	.handler(async ({ data }) => {
		const session = await requireAuth();
		const { userId } = session;

		const receiver = await db
			.select()
			.from(users)
			.where(eq(users.username, data.receiverUsername))
			.get();
		if (!receiver) throw new Error("User not found");
		if (receiver.id === userId) throw new Error("Cannot message yourself");

		// Find or create conversation between the two users
		const [u1, u2] = userId < receiver.id ? [userId, receiver.id] : [receiver.id, userId];

		let conv = await db
			.select()
			.from(conversations)
			.where(and(eq(conversations.user1Id, u1), eq(conversations.user2Id, u2)))
			.get();

		if (!conv) {
			const convId = generateId();
			await db.insert(conversations).values({ id: convId, user1Id: u1, user2Id: u2 });
			conv = await db.select().from(conversations).where(eq(conversations.id, convId)).get();
		}

		if (!conv) throw new Error("Failed to create conversation");

		const messageId = generateId();
		const now = new Date();

		await db.insert(messages).values({
			id: messageId,
			conversationId: conv.id,
			senderId: userId,
			content: data.content,
			read: false,
		});

		// Update conversation timestamp
		await db.update(conversations).set({ updatedAt: now }).where(eq(conversations.id, conv.id));

		return {
			id: messageId,
			conversationId: conv.id,
			senderId: userId,
			content: data.content,
			read: false,
			createdAt: now,
		};
	});

// ─── Mark Conversation as Read ───────────────────────────────────────────────
export const markAsRead = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: conversationId }) => {
		const session = await requireAuth();

		await db
			.update(messages)
			.set({ read: true })
			.where(
				and(
					eq(messages.conversationId, conversationId),
					sql`${messages.senderId} != ${session.userId}`,
				),
			);

		return { success: true };
	});
