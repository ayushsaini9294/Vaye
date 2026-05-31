import type { IChatService } from "@vaye/proto";
import { validateSessionToken } from "../../middleware/auth";
import {
	getConversations,
	getMessages,
	markAsRead,
	sendMessage,
} from "../../services/chat.service";

export const chatHandler: IChatService = {
	async getConversations(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const limit = request.pagination?.limit || 20;
			const offset = request.pagination?.offset || 0;

			const conversations = await getConversations(auth.userId, limit, offset);

			return { conversations };
		} catch (error) {
			console.error("Error getting conversations", error);
			return { conversations: [] };
		}
	},

	async getMessages(request) {
		try {
			// Validate session to ensure user is authenticated
			validateSessionToken(request.sessionToken);
			const limit = request.pagination?.limit || 50;
			const offset = request.pagination?.offset || 0;

			// In a more secure app we would verify this user is part of the conversation,
			// but keeping it simple for the MVP.
			const messages = await getMessages(request.conversationId, limit, offset);

			return { messages };
		} catch (error) {
			console.error("Error getting messages", error);
			return { messages: [] };
		}
	},

	async sendMessage(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const message = await sendMessage(auth.userId, request.receiverUsername, request.content);

			return {
				success: true,
				error: "",
				message,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to send message",
				message: undefined,
			};
		}
	},

	async markAsRead(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			await markAsRead(request.conversationId, auth.userId);

			return {
				success: true,
				error: "",
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to mark as read",
			};
		}
	},
};
