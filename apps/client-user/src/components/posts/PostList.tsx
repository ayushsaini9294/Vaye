import * as stylex from "@stylexjs/stylex";
import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { colors, radii, spacing } from "../../tokens.stylex";
import { PostCard } from "./PostCard";
import { SkeletonFeed } from "./SkeletonPost";

const fadeInUp = stylex.keyframes({
	from: {
		opacity: 0,
		transform: "translateY(10px)",
	},
	to: {
		opacity: 1,
		transform: "translateY(0)",
	},
});

const styles = stylex.create({
	loadingContainer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		paddingTop: spacing.xl,
		paddingBottom: spacing.xl,
	},
	emptyState: {
		backgroundColor: colors.white,
		borderRadius: radii.xl,
		boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
		padding: spacing.xl,
		textAlign: "center",
	},
	emptyIcon: {
		width: "4rem",
		height: "4rem",
		borderRadius: radii.xl,
		backgroundColor: colors.gray100,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: "auto",
		marginRight: "auto",
		marginBottom: spacing.md,
	},
	emptyTitle: {
		fontSize: "1.125rem",
		fontWeight: 600,
		color: colors.gray900,
		marginBottom: spacing.sm,
	},
	emptyText: {
		color: colors.gray500,
	},
	postList: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.md,
	},
	postItem: {
		animationName: fadeInUp,
		animationDuration: "0.3s",
		animationFillMode: "both",
	},
});

interface Post {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string;
		username: string;
		displayName: string;
		avatarUrl?: string | null;
	} | null;
	likeCount: number;
	commentCount: number;
	revayeCount?: number;
	isRevayeed?: boolean;
	repostedBy?: {
		username: string;
		displayName: string;
	} | null;
}

export function PostList({
	posts,
	loading,
	currentUserId,
	onPostDelete,
}: {
	posts: Post[];
	loading?: boolean;
	currentUserId?: string;
	onPostDelete?: () => void;
}) {
	if (loading) {
		return <SkeletonFeed count={3} />;
	}

	const [focusedIndex, setFocusedIndex] = useState(-1);
	const postRefs = useRef<(HTMLElement | null)[]>([]);

	useKeyboardShortcuts([
		{
			key: "j",
			description: "Next post",
			action: () => {
				setFocusedIndex((i) => Math.min(i + 1, posts.length - 1));
			},
		},
		{
			key: "k",
			description: "Previous post",
			action: () => {
				setFocusedIndex((i) => Math.max(i - 1, 0));
			},
		},
	]);

	useEffect(() => {
		if (focusedIndex >= 0 && postRefs.current[focusedIndex]) {
			postRefs.current[focusedIndex]?.focus();
			postRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}
	}, [focusedIndex]);

	if (posts.length === 0) {
		return (
			<div {...stylex.props(styles.emptyState)}>
				<div {...stylex.props(styles.emptyIcon)}>
					<FileText size={32} color={colors.gray400} />
				</div>
				<h3 {...stylex.props(styles.emptyTitle)}>No posts yet</h3>
				<p {...stylex.props(styles.emptyText)}>Be the first to share something!</p>
			</div>
		);
	}

	return (
		<div {...stylex.props(styles.postList)}>
			{posts.map((post, index) => (
				<div
					key={`${post.id}-${post.repostedBy?.username || "original"}`}
					{...stylex.props(styles.postItem)}
					ref={(el) => {
						postRefs.current[index] = el;
					}}
					tabIndex={-1}
					style={{
						outline: focusedIndex === index ? `2px solid ${colors.indigo500}` : "none",
						borderRadius: radii.xl,
					}}
				>
					<PostCard
						post={post}
						currentUserId={currentUserId}
						onDelete={onPostDelete}
						isFocused={focusedIndex === index}
					/>
				</div>
			))}
		</div>
	);
}
