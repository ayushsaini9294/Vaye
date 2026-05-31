import { createServerFn } from "@tanstack/react-start";
import { getGrpcClient, getGrpcSessionToken, requireGrpcSessionToken } from "../../lib/grpc.server";

export const toggleFollow = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.follows.toggleFollow({
			sessionToken,
			username,
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to toggle follow");
		}

		return { success: true, following: response.following };
	});

export const getFollowStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const sessionToken = await requireGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.follows.getFollowStatus({
			sessionToken,
			username,
		});

		return { following: response.following };
	});

export const getFollowerCount = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const client = getGrpcClient();

		const { response } = await client.follows.getFollowerCount({
			username,
		});

		return response.count;
	});

export const getFollowingCount = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const client = getGrpcClient();

		const { response } = await client.follows.getFollowingCount({
			username,
		});

		return response.count;
	});

export const getFollowersFn = createServerFn()
	.inputValidator((d: { username: string; limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await getGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.follows.getFollowers({
			username: data.username,
			sessionToken: sessionToken || undefined,
			pagination: {
				limit: data.limit || 20,
				offset: data.offset || 0,
			},
		});

		return {
			users: response.users,
			total: response.total,
		};
	});

export const getFollowingFn = createServerFn()
	.inputValidator((d: { username: string; limit?: number; offset?: number }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await getGrpcSessionToken();
		const client = getGrpcClient();

		const { response } = await client.follows.getFollowing({
			username: data.username,
			sessionToken: sessionToken || undefined,
			pagination: {
				limit: data.limit || 20,
				offset: data.offset || 0,
			},
		});

		return {
			users: response.users,
			total: response.total,
		};
	});
