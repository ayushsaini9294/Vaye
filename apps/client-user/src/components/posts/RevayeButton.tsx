import * as stylex from "@stylexjs/stylex";
import { Repeat2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getRevayeStatus, toggleRevaye } from "../../server/functions/revayes";
import { colors, radii, semanticColors, spacing } from "../../tokens.stylex";

const spinOnce = stylex.keyframes({
	from: { transform: "rotate(0deg)" },
	to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
	button: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderRadius: radii.full,
		transition: "all 0.2s",
		backgroundColor: "transparent",
		border: "none",
		cursor: "pointer",
		color: semanticColors.textTertiary,
		":hover": {
			color: colors.green500,
			backgroundColor: "rgba(34, 197, 94, 0.1)",
		},
		":disabled": {
			opacity: 0.4,
			cursor: "not-allowed",
		},
	},
	buttonActive: {
		color: colors.green500,
		backgroundColor: "rgba(34, 197, 94, 0.05)",
	},
	buttonDisabled: {
		":hover": {
			color: semanticColors.textTertiary,
			backgroundColor: "transparent",
		},
	},
	iconSpin: {
		animationName: spinOnce,
		animationDuration: "0.35s",
		animationTimingFunction: "ease-out",
	},
	count: {
		fontSize: "0.875rem",
		fontWeight: 500,
	},
	iconFilled: {
		fill: "currentColor",
	},
});

interface RevayeButtonProps {
	postId: string;
	isOwnPost: boolean;
	initialRevayeed?: boolean;
	initialCount?: number;
}

export function RevayeButton({
	postId,
	isOwnPost,
	initialRevayeed = false,
	initialCount = 0,
}: RevayeButtonProps) {
	const [revayeed, setRevayeed] = useState(initialRevayeed);
	const [revayeCount, setRevayeCount] = useState(initialCount);
	const [loading, setLoading] = useState(false);
	const [animateSpin, setAnimateSpin] = useState(false);

	useEffect(() => {
		if (isOwnPost) return;
		loadStatus();
	}, [postId, isOwnPost]);

	const loadStatus = async () => {
		try {
			const status = await getRevayeStatus({ data: postId });
			setRevayeed(status.revayeed);
			setRevayeCount(status.revayeCount);
		} catch {
			// user may not be logged in — silently ignore
		}
	};

	const handleToggle = async () => {
		if (loading || isOwnPost) return;
		setLoading(true);

		// Optimistic update for snappier UX
		const optimisticRevayeed = !revayeed;
		const optimisticCount = revayeCount + (optimisticRevayeed ? 1 : -1);
		setRevayeed(optimisticRevayeed);
		setRevayeCount(Math.max(0, optimisticCount));
		setAnimateSpin(true);
		setTimeout(() => setAnimateSpin(false), 350);

		try {
			const result = await toggleRevaye({ data: postId });
			// Reconcile with server's authoritative count
			setRevayeed(result.revayeed);
			setRevayeCount(result.revayeCount);
		} catch (error) {
			// Rollback on failure
			setRevayeed(revayeed);
			setRevayeCount(revayeCount);
			console.error("Failed to toggle revaye:", error);
		} finally {
			setLoading(false);
		}
	};

	const title = isOwnPost ? "Cannot repost your own post" : revayeed ? "Undo Repost" : "Repost";

	return (
		<button
			type="button"
			id={`repost-btn-${postId}`}
			onClick={handleToggle}
			disabled={loading || isOwnPost}
			title={title}
			data-reposted={revayeed}
			data-testid="repost-button"
			{...stylex.props(
				styles.button,
				revayeed && styles.buttonActive,
				isOwnPost && styles.buttonDisabled,
			)}
		>
			<Repeat2
				size={20}
				{...stylex.props(revayeed && styles.iconFilled, animateSpin && styles.iconSpin)}
			/>
			<span {...stylex.props(styles.count)}>{revayeCount}</span>
		</button>
	);
}
