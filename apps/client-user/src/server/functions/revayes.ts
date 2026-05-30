import { createServerFn } from "@tanstack/react-start";
import {
	fromProtoTimestamp,
	getGrpcClient,
	getGrpcSessionToken,
} from "../../lib/grpc.server";
import { getSessionData, requireAuth } from "../../lib/session.server";

/**
 * Concurrency-safe in-memory stub for revaye state.
 *
 * The server runs in a single Node.js process. All async mutations are
 * serialised per post via a Promise-chain mutex (`revayeLocks`). This
 * guarantees the counter increments or decrements by exactly **1** per
 * completed user action, no matter how many users hit the endpoint at once.
 *
 *   revayesByPost  Map<postId, Set<userId>>
 *   revayeCounts   Map<postId, number>
 *   revayeLocks    Map<postId, Promise<void>>   ← per-post serialisation
 */
const revayesByPost = new Map<string, Set<string>>();
const revayeCounts = new Map<string, number>();
const revayeLocks = new Map<string, Promise<void>>();

/**
 * Acquire an exclusive execution slot for `postId` and run `fn` inside it.
 * Each call appends to the existing promise chain so requests are processed
 * strictly in order for the same post.
 */
function withLock<T>(postId: string, fn: () => T): Promise<T> {
	const prev = revayeLocks.get(postId) ?? Promise.resolve();
	let settle!: () => void;
	const slot = new Promise<void>((r) => {
		settle = r;
	});
	revayeLocks.set(postId, slot);
	// Append fn after the previous slot, then release the current slot.
	// biome-ignore lint/suspicious/noExplicitAny: forwarding generic return
	const result: any = prev.then(fn).finally(settle);
	return result;
}

function revayeersFor(postId: string): Set<string> {
	if (!revayesByPost.has(postId)) revayesByPost.set(postId, new Set());
	return revayesByPost.get(postId)!;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggle revaye for the authenticated user on `postId`.
 * Serialised per post so concurrent requests never race on the counter.
 */
export const toggleRevaye = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await requireAuth(); // throws 401 if not logged in
		const { userId } = session;

		return withLock(postId, () => {
			const revayeers = revayeersFor(postId);
			const wasRevayeed = revayeers.has(userId);

			if (wasRevayeed) {
				revayeers.delete(userId);
				const newCount = Math.max(0, (revayeCounts.get(postId) ?? 1) - 1);
				revayeCounts.set(postId, newCount);
				return { success: true, revayeed: false, revayeCount: newCount };
			}

			revayeers.add(userId);
			const newCount = (revayeCounts.get(postId) ?? 0) + 1;
			revayeCounts.set(postId, newCount);
			return { success: true, revayeed: true, revayeCount: newCount };
		});
	});

/**
 * Return the revaye status and current count for a post.
 */
export const getRevayeStatus = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: postId }) => {
		const session = await getSessionData();
		const count = revayeCounts.get(postId) ?? 0;

		return {
			revayeed: session ? revayeersFor(postId).has(session.userId) : false,
			revayeCount: count,
		};
	});

/**
 * Return posts that `username` has revayeed, tagged with `repostedBy` so
 * PostCard can render the attribution banner.
 *
 * Stub: fetches all public posts and filters to those tracked in the
 * in-memory revaye store, excluding the requesting user's own posts.
 */
export const getUserRevayes = createServerFn()
	.inputValidator((d: string) => d)
	.handler(async ({ data: username }) => {
		const sessionToken = await getGrpcSessionToken();
		const client = getGrpcClient();

		// Resolve the reposter's display name
		const { response: userResp } = await client.users.getUser({
			sessionToken: sessionToken || "",
			username,
		});
		const reposterDisplayName = userResp.displayName || username;
		const reposterUsername = userResp.username || username;

		// Collect postIds that have at least one revayeer tracked in-store
		const revayeedPostIds = new Set<string>();
		for (const [postId, revayeers] of revayesByPost.entries()) {
			if (revayeers.size > 0) revayeedPostIds.add(postId);
		}

		if (revayeedPostIds.size === 0) return [];

		const { response: postsResp } = await client.posts.getPosts({
			sessionToken: sessionToken || "",
			pagination: { limit: 100, offset: 0 },
		});

		return postsResp.posts
			.filter(
				(p) =>
					// Exclude the user's own posts
					p.author?.username !== username &&
					// Include only revayeed posts
					revayeedPostIds.has(p.id),
			)
			.map((post) => ({
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
				revayeCount: revayeCounts.get(post.id) ?? 0,
				isRevayeed: true,
				repostedBy: {
					username: reposterUsername,
					displayName: reposterDisplayName,
				},
			}));
	});
