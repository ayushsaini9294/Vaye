import { createServerFn } from "@tanstack/react-start";
import { fromProtoTimestamp, getAdminGrpcSessionToken, getGrpcClient } from "../../lib/grpc.server";

// Re-usable helper to ensure admin token
async function requireAdminToken() {
	const sessionToken = await getAdminGrpcSessionToken();
	if (!sessionToken) {
		throw new Error("Admin authentication required");
	}
	return sessionToken;
}

export const getDashboardStatsFn = createServerFn({ method: "GET" }).handler(async () => {
	const sessionToken = await requireAdminToken();
	const client = getGrpcClient();

	const { response } = await client.admin.getDashboardStats({ sessionToken });
	return response;
});

export const getUsersFn = createServerFn({ method: "GET" })
	.inputValidator((d: { page?: number; limit?: number; searchQuery?: string; roleFilter?: string } | undefined) => d || {})
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.admin.listUsers({
			sessionToken,
			pagination: {
				limit: data.limit || 50,
				offset: data.page ? (data.page - 1) * (data.limit || 50) : 0,
			},
			searchQuery: data.searchQuery,
			roleFilter: data.roleFilter,
		});

		// Transform dates for serialization
		return {
			...response,
			users: response.users.map((user) => ({
				...user,
				createdAt: fromProtoTimestamp(user.createdAt).toISOString(),
				updatedAt: fromProtoTimestamp(user.updatedAt).toISOString(),
				bannedAt: user.bannedAt ? fromProtoTimestamp(user.bannedAt).toISOString() : undefined,
			})),
		};
	});

export const getPostsFn = createServerFn({ method: "GET" })
	.inputValidator((d: { page?: number; limit?: number } | undefined) => d || {})
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.posts.getPosts({
			sessionToken,
			pagination: {
				limit: data.limit || 50,
				offset: data.page ? (data.page - 1) * (data.limit || 50) : 0,
			},
		});

		return {
			...response,
			posts: response.posts.map((post) => ({
				...post,
				createdAt: fromProtoTimestamp(post.createdAt).toISOString(),
				updatedAt: fromProtoTimestamp(post.updatedAt).toISOString(),
			})),
		};
	});

export const getReportsFn = createServerFn({ method: "GET" })
	.inputValidator((d: { page?: number; limit?: number; statusFilter?: string; typeFilter?: string } | undefined) => d || {})
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.admin.listReports({
			sessionToken,
			pagination: {
				limit: data.limit || 50,
				offset: data.page ? (data.page - 1) * (data.limit || 50) : 0,
			},
			statusFilter: data.statusFilter,
			typeFilter: data.typeFilter,
		});

		return {
			...response,
			reports: response.reports.map((report) => ({
				...report,
				createdAt: fromProtoTimestamp(report.createdAt).toISOString(),
				reviewedAt: report.reviewedAt ? fromProtoTimestamp(report.reviewedAt).toISOString() : undefined,
			})),
		};
	});

export const getAuditLogsFn = createServerFn({ method: "GET" })
	.inputValidator((d: { page?: number; limit?: number; adminIdFilter?: string; actionFilter?: string } | undefined) => d || {})
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.admin.getAuditLogs({
			sessionToken,
			pagination: {
				limit: data.limit || 50,
				offset: data.page ? (data.page - 1) * (data.limit || 50) : 0,
			},
			adminIdFilter: data.adminIdFilter,
			actionFilter: data.actionFilter,
		});

		return {
			...response,
			logs: response.logs.map((log) => ({
				...log,
				createdAt: fromProtoTimestamp(log.createdAt).toISOString(),
			})),
		};
	});

export const getUserDetailsFn = createServerFn({ method: "GET" })
	.inputValidator((d: { userId: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.admin.getUserDetails({
			sessionToken,
			userId: data.userId,
		});

		const user = response.user;
		if (!user) {
			throw new Error("User not found");
		}

		return {
			user: {
				...user,
				createdAt: fromProtoTimestamp(user.createdAt).toISOString(),
				updatedAt: fromProtoTimestamp(user.updatedAt).toISOString(),
				bannedAt: user.bannedAt ? fromProtoTimestamp(user.bannedAt).toISOString() : undefined,
			},
		};
	});

export const getUserPostsFn = createServerFn({ method: "GET" })
	.inputValidator((d: { username: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.posts.getUserPosts({
			sessionToken,
			username: data.username,
		});

		return {
			posts: response.posts.map((post) => ({
				...post,
				createdAt: fromProtoTimestamp(post.createdAt).toISOString(),
				updatedAt: fromProtoTimestamp(post.updatedAt).toISOString(),
			})),
		};
	});

export const banUserFn = createServerFn({ method: "POST" })
	.inputValidator((d: { userId: string; reason: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.admin.banUser({
			sessionToken,
			userId: data.userId,
			reason: data.reason,
		});

		return response;
	});

export const unbanUserFn = createServerFn({ method: "POST" })
	.inputValidator((d: { userId: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.admin.unbanUser({
			sessionToken,
			userId: data.userId,
		});

		return response;
	});

export const updateUserRoleFn = createServerFn({ method: "POST" })
	.inputValidator((d: { userId: string; role: string }) => d)
	.handler(async ({ data }) => {
		const sessionToken = await requireAdminToken();
		const client = getGrpcClient();

		const { response } = await client.admin.updateUserRole({
			sessionToken,
			userId: data.userId,
			role: data.role,
		});

		return response;
	});

