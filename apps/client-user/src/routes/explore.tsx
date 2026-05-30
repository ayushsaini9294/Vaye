import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { Compass, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PostList } from "../components/posts/PostList";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { getCurrentUser } from "../server/functions/auth";
import { getExploreFeed } from "../server/functions/feed";
import { colors, fontSize, fontWeight, radii, semanticColors, spacing } from "../tokens.stylex";

export const Route = createFileRoute("/explore")({ component: ExplorePage });

const styles = stylex.create({
	container: { maxWidth: "42rem", marginLeft: "auto", marginRight: "auto", paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing["2xl"], paddingBottom: spacing["3xl"] },
	pageHeader: { display: "flex", alignItems: "center", gap: spacing.md, marginBottom: spacing["2xl"] },
	pageHeaderIcon: { width: "2.25rem", height: "2.25rem", borderRadius: radii.lg, backgroundImage: `linear-gradient(135deg, ${colors.emerald500}, ${colors.teal500})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px -2px rgba(16, 185, 129, 0.25)" },
	pageTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: semanticColors.textPrimary, letterSpacing: "-0.025em" },
	pageSubtitle: { fontSize: fontSize.xs, color: semanticColors.textSecondary },
	postsList: { display: "flex", flexDirection: "column", gap: spacing.md },
	sentinel: { height: "1px" },
	loadingMore: { display: "flex", justifyContent: "center", paddingTop: spacing.lg, paddingBottom: spacing.lg, color: semanticColors.textTertiary },
	endMessage: { textAlign: "center", paddingTop: spacing.lg, fontSize: fontSize.sm, color: semanticColors.textTertiary },
	iconWhite: { color: colors.white },
});

function ExplorePage() {
	const [user, setUser] = useState<any>(null);

	useEffect(() => { getCurrentUser().then(setUser).catch(console.error); }, []);

	const fetchPage = useCallback(
		(offset: number, limit: number) => getExploreFeed({ data: { offset, limit } }),
		[],
	);

	const { items: posts, loading, loadingMore, hasMore, sentinelRef } = useInfiniteScroll(fetchPage, "explore-feed");

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.pageHeader)}>
				<div {...stylex.props(styles.pageHeaderIcon)}>
					<Compass size={20} {...stylex.props(styles.iconWhite)} />
				</div>
				<div>
					<h1 {...stylex.props(styles.pageTitle)}>Explore</h1>
					<p {...stylex.props(styles.pageSubtitle)}>Discover new posts from everyone</p>
				</div>
			</div>

			<div {...stylex.props(styles.postsList)} data-testid="post-feed">
				<PostList posts={posts} loading={loading} currentUserId={user?.id} onPostDelete={() => window.location.reload()} />
			</div>

			<div ref={sentinelRef} style={{ height: "1px" }} data-testid="scroll-sentinel" />

			{loadingMore && (
				<div {...stylex.props(styles.loadingMore)} data-testid="loading-more">
					<Loader2 size={20} />
				</div>
			)}

			{!hasMore && posts.length > 0 && (
				<div {...stylex.props(styles.endMessage)} data-testid="feed-end">
					You've seen everything ✨
				</div>
			)}
		</div>
	);
}
