import { db, schema } from "../db";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { generateId, toProtoTimestamp } from "./utils";

const { conversations, messages, users, follows } = schema;

export async function getConversations(userId: string, limit: number, offset: number) {
	// Fetch conversations where user is participant using plain select
	const userConversations = await db
		.select()
		.from(conversations)
		.where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)))
		.orderBy(desc(conversations.updatedAt))
		.limit(limit)
		.offset(offset);

	if (userConversations.length === 0) return [];

	const conversationIds = userConversations.map((c) => c.id);

	// Get latest messages for these conversations (one per conversation)
	const allMessages = await db
		.select()
		.from(messages)
		.where(inArray(messages.conversationId, conversationIds))
		.orderBy(desc(messages.createdAt));

	// Build a map of conversationId -> latest message
	const msgMap = new Map<string, typeof allMessages[0]>();
	for (const m of allMessages) {
		if (!msgMap.has(m.conversationId)) {
			msgMap.set(m.conversationId, m);
		}
	}

	// Count unread messages per conversation where sender is not current user
	const unreadCounts = await db
		.select({
			conversationId: messages.conversationId,
			count: sql<number>`cast(count(${messages.id}) as integer)`,
		})
		.from(messages)
		.where(
			and(
				inArray(messages.conversationId, conversationIds),
				eq(messages.read, false),
				sql`${messages.senderId} != ${userId}`
			)
		)
		.groupBy(messages.conversationId);

	const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u.count]));

	// Get the "other" users for each conversation
	const otherUserIds = userConversations.map((c) =>
		c.user1Id === userId ? c.user2Id : c.user1Id
	);

	const otherUsers = await db
		.select()
		.from(users)
		.where(inArray(users.id, otherUserIds));

	const userMap = new Map(otherUsers.map((u) => [u.id, u]));

	return userConversations.map((c) => {
		const otherUserId = c.user1Id === userId ? c.user2Id : c.user1Id;
		const otherUser = userMap.get(otherUserId)!;
		const lastMessage = msgMap.get(c.id);

		return {
			id: c.id,
			updatedAt: toProtoTimestamp(c.updatedAt),
			unreadCount: unreadMap.get(c.id) || 0,
			otherUser: {
				id: otherUser.id,
				username: otherUser.username,
				displayName: otherUser.displayName,
				avatarUrl: otherUser.avatarUrl || undefined,
			},
			lastMessage: lastMessage
				? {
						id: lastMessage.id,
						conversationId: lastMessage.conversationId,
						senderId: lastMessage.senderId,
						content: lastMessage.content,
						read: lastMessage.read,
						createdAt: toProtoTimestamp(lastMessage.createdAt),
				  }
				: undefined,
		};
	});
}

export async function getMessages(conversationId: string, limit: number, offset: number) {
	const msgs = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, conversationId))
		.orderBy(desc(messages.createdAt))
		.limit(limit)
		.offset(offset);

	return msgs.map((m) => ({
		id: m.id,
		conversationId: m.conversationId,
		senderId: m.senderId,
		content: m.content,
		read: m.read,
		createdAt: toProtoTimestamp(m.createdAt),
	})).reverse(); // Return in chronological order
}

export async function sendMessage(senderId: string, receiverUsername: string, content: string) {
	const receiver = await db.query.users.findFirst({
		where: eq(users.username, receiverUsername),
	});

	if (!receiver) {
		throw new Error("User not found");
	}

	if (receiver.id === senderId) {
		throw new Error("Cannot message yourself");
	}

	// Check if follow exists in either direction (one follow is enough)
	const followExists = await db
		.select()
		.from(follows)
		.where(
			or(
				and(eq(follows.followerId, senderId), eq(follows.followingId, receiver.id)),
				and(eq(follows.followerId, receiver.id), eq(follows.followingId, senderId))
			)
		)
		.limit(1);

	if (followExists.length === 0) {
		throw new Error("You must follow this user or they must follow you to chat");
	}

	// Find existing conversation
	const existingConvs = await db
		.select()
		.from(conversations)
		.where(
			or(
				and(eq(conversations.user1Id, senderId), eq(conversations.user2Id, receiver.id)),
				and(eq(conversations.user1Id, receiver.id), eq(conversations.user2Id, senderId))
			)
		)
		.limit(1);

	let conversation = existingConvs[0];

	if (!conversation) {
		// Create new conversation
		const newConvId = generateId();
		await db.insert(conversations).values({
			id: newConvId,
			user1Id: senderId,
			user2Id: receiver.id,
		});
		conversation = (await db.select().from(conversations).where(eq(conversations.id, newConvId)).limit(1))[0]!;
	}

	const messageId = generateId();
	await db.insert(messages).values({
		id: messageId,
		conversationId: conversation.id,
		senderId,
		content,
	});

	// Update conversation updated_at
	await db
		.update(conversations)
		.set({ updatedAt: new Date() })
		.where(eq(conversations.id, conversation.id));

	const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);

	return {
		id: msg!.id,
		conversationId: msg!.conversationId,
		senderId: msg!.senderId,
		content: msg!.content,
		read: msg!.read,
		createdAt: toProtoTimestamp(msg!.createdAt),
	};
}

export async function markAsRead(conversationId: string, userId: string) {
	await db
		.update(messages)
		.set({ read: true })
		.where(
			and(
				eq(messages.conversationId, conversationId),
				eq(messages.read, false),
				sql`${messages.senderId} != ${userId}`
			)
		);
}
