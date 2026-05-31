import type { IFollowsService } from "@vaye/proto";
import { validateSessionToken } from "../../middleware/auth";
import {
	getFollowerCount,
	getFollowers,
	getFollowing,
	getFollowingCount,
	getFollowStatus,
	toggleFollow,
} from "../../services/follows.service";

export const followsHandler: IFollowsService = {
	async toggleFollow(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await toggleFollow(request.username, auth.userId);

			return {
				success: true,
				following: result.following,
			};
		} catch (error) {
			return {
				success: false,
				following: false,
				error: error instanceof Error ? error.message : "Failed to toggle follow",
			};
		}
	},

	async getFollowStatus(request) {
		try {
			const auth = validateSessionToken(request.sessionToken);
			const result = await getFollowStatus(request.username, auth.userId);

			return { following: result.following };
		} catch {
			return { following: false };
		}
	},

	async getFollowerCount(request) {
		try {
			const result = await getFollowerCount(request.username);
			return { count: result.count };
		} catch {
			return { count: 0 };
		}
	},

	async getFollowingCount(request) {
		try {
			const result = await getFollowingCount(request.username);
			return { count: result.count };
		} catch {
			return { count: 0 };
		}
	},

	async getFollowers(request) {
		try {
			const auth = request.sessionToken ? validateSessionToken(request.sessionToken) : null;
			const limit = request.pagination?.limit || 20;
			const offset = request.pagination?.offset || 0;

			const result = await getFollowers(request.username, limit, offset, auth?.userId);

			return {
				users: result.users.map((u) => ({
					id: u.id,
					username: u.username,
					displayName: u.displayName,
					avatarUrl: u.avatarUrl || undefined,
					bio: u.bio || undefined,
					isFollowing: u.isFollowing,
				})),
				total: result.total,
			};
		} catch (_error) {
			return { users: [], total: 0 };
		}
	},

	async getFollowing(request) {
		try {
			const auth = request.sessionToken ? validateSessionToken(request.sessionToken) : null;
			const limit = request.pagination?.limit || 20;
			const offset = request.pagination?.offset || 0;

			const result = await getFollowing(request.username, limit, offset, auth?.userId);

			return {
				users: result.users.map((u) => ({
					id: u.id,
					username: u.username,
					displayName: u.displayName,
					avatarUrl: u.avatarUrl || undefined,
					bio: u.bio || undefined,
					isFollowing: u.isFollowing,
				})),
				total: result.total,
			};
		} catch (_error) {
			return { users: [], total: 0 };
		}
	},
};
