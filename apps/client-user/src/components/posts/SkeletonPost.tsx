import * as stylex from "@stylexjs/stylex";
import { radii, semanticColors, spacing } from "../../tokens.stylex";

const shimmer = stylex.keyframes({
	"0%": { backgroundPosition: "-200% 0" },
	"100%": { backgroundPosition: "200% 0" },
});

const styles = stylex.create({
	card: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.xl,
		padding: spacing.lg,
		display: "flex",
		gap: spacing.md,
		boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
	},
	avatar: {
		width: "3rem",
		height: "3rem",
		borderRadius: radii.full,
		backgroundColor: semanticColors.bgSecondary,
	},
	content: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		gap: spacing.sm,
	},
	line: {
		height: "1rem",
		borderRadius: radii.md,
		backgroundColor: semanticColors.bgSecondary,
		backgroundImage: `linear-gradient(90deg, ${semanticColors.bgSecondary} 25%, ${semanticColors.bgTertiary} 50%, ${semanticColors.bgSecondary} 75%)`,
		backgroundSize: "200% 100%",
		animationName: shimmer,
		animationDuration: "1.5s",
		animationIterationCount: "infinite",
		animationTimingFunction: "linear",
	},
	lineShort: {
		width: "40%",
	},
	lineMedium: {
		width: "70%",
	},
	lineFull: {
		width: "100%",
	},
});

export function SkeletonPost() {
	return (
		<div {...stylex.props(styles.card)}>
			<div {...stylex.props(styles.avatar)} />
			<div {...stylex.props(styles.content)}>
				<div {...stylex.props(styles.line, styles.lineShort)} />
				<div {...stylex.props(styles.line, styles.lineFull)} />
				<div {...stylex.props(styles.line, styles.lineMedium)} />
			</div>
		</div>
	);
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
			{Array.from({ length: count }).map((_, i) => (
				<SkeletonPost key={i} />
			))}
		</div>
	);
}
