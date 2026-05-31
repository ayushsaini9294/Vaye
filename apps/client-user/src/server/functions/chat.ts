import { createServerFn } from "@tanstack/react-start";
import { fromProtoTimestamp, getGrpcClient, requireGrpcSessionToken } from "../../lib/grpc.server";
import type { ConversationResponse, MessageResponse } from "@vaye/proto";

function mapConversationResponse(c: ConversationResponse) {
	return {
		id: c.id,
		unreadCount: c.unreadCount,
		updatedAt: c.updatedAt ? fromProtoTimestamp(c.updatedAt) : new Date(),
		otherUser: c.otherUser ? {
			id: c.otherUser.id,
			username: c.otherUser.username,
			displayName: c.otherUser.displayName,
			avatarUrl: c.otherUser.avatarUrl,
		} : null,
		lastMessage: c.lastMessage ? mapMessageResponse(c.lastMessage) : null,
	};
}

function mapMessageResponse(m: MessageResponse) {
	return {
		id: m.id,
		conversationId: m.conversationId,
		senderId: m.senderId,
		content: m.content,
		read: m.read,
		createdAt: m.createdAt ? fromProtoTimestamp(m.createdAt) : new Date(),
	};
}

export const getConversations = createServerFn()
	.inputValidator((d?: { limit?: number; offset?: number }) => d)
	.handler(async ({ data: options }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.chat.getConversations({
			sessionToken,
			pagination: {
				limit: options?.limit || 20,
				offset: options?.offset || 0,
			},
		});

		return response.conversations.map(mapConversationResponse);
	});

export const getMessages = createServerFn()
	.inputValidator((d: { conversationId: string; limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.chat.getMessages({
			sessionToken,
			conversationId: data.conversationId,
			pagination: {
				limit: data.limit || 50,
				offset: data.offset || 0,
			},
		});

		return response.messages.map(mapMessageResponse);
	});

export const sendMessage = createServerFn({ method: "POST" })
	.inputValidator((d: { receiverUsername: string; content: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.chat.sendMessage({
			sessionToken,
			receiverUsername: data.receiverUsername,
			content: data.content,
		});

		if (!response.success || !response.message) {
			throw new Error(response.error || "Failed to send message");
		}

		return mapMessageResponse(response.message);
	});

export const markAsRead = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: conversationId }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.chat.markAsRead({
			sessionToken,
			conversationId,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to mark as read");
		}

		return { success: true };
	});
