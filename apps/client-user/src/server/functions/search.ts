import { createServerFn } from "@tanstack/react-start";
import type { PostResponse, UserSearchResult } from "@vaye/proto";
import { fromProtoTimestamp, getGrpcClient, getGrpcSessionToken } from "../../lib/grpc.server";

function mapPostResponse(post: PostResponse) {
	return {
		id: post.id,
		content: post.content,
		createdAt: fromProtoTimestamp(post.createdAt),
		updatedAt: fromProtoTimestamp(post.updatedAt),
		author: post.author
			? {
					id: post.author.id,
					username: post.author.username,
					displayName: post.author.displayName,
					avatarUrl: post.author.avatarUrl,
				}
			: null,
		likeCount: post.likeCount,
		commentCount: post.commentCount,
		isLiked: post.isLiked,
	};
}

function mapUserSearchResult(user: UserSearchResult) {
	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		bio: user.bio,
	};
}

export const searchPosts = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: query }) => {
		if (!query || query.trim().length === 0) {
			return [];
		}

		const sessionToken = await getGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.search.searchPosts({
			sessionToken: sessionToken || "",
			query,
		});

		return response.posts.map(mapPostResponse);
	});

export const searchUsers = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: query }) => {
		if (!query || query.trim().length === 0) {
			return [];
		}

		const client = getGrpcClient();

		try {
			console.log("[searchUsers] Calling gRPC with query:", query);
			const { response } = await client.search.searchUsers({
				query,
			});
			console.log("[searchUsers] Raw response:", JSON.stringify(response));
			console.log("[searchUsers] Users count:", response.users.length);
			const mapped = response.users.map(mapUserSearchResult);
			console.log("[searchUsers] Mapped results:", JSON.stringify(mapped));
			return mapped;
		} catch (error) {
			console.error("[searchUsers] gRPC call FAILED:", error);
			throw error;
		}
	});
