import { createFileRoute } from "@tanstack/react-router";
import * as stylex from "@stylexjs/stylex";
import { colors, fontSize, fontWeight, spacing } from "../../tokens.stylex";
import { MessageCircle, Send, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/messages/")({
	component: MessagesIndex,
});

const float = stylex.keyframes({
	"0%, 100%": { transform: "translateY(0)" },
	"50%": { transform: "translateY(-8px)" },
});

const pulse = stylex.keyframes({
	"0%, 100%": { opacity: 0.4 },
	"50%": { opacity: 0.8 },
});

const styles = stylex.create({
	container: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		padding: "3rem",
		textAlign: "center",
		gap: spacing.lg,
	},
	iconGroup: {
		position: "relative" as any,
		marginBottom: spacing.md,
	},
	mainIcon: {
		width: "80px",
		height: "80px",
		borderRadius: "24px",
		background: `linear-gradient(135deg, ${colors.indigo600}, ${colors.indigo400})`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.white,
		animationName: float,
		animationDuration: "3s",
		animationTimingFunction: "ease-in-out",
		animationIterationCount: "infinite",
		boxShadow: `0 12px 40px rgba(99, 102, 241, 0.25)`,
	},
	sendBubble: {
		position: "absolute" as any,
		top: "-8px",
		right: "-12px",
		width: "32px",
		height: "32px",
		borderRadius: "10px",
		backgroundColor: colors.green500,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.white,
		boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
		animationName: pulse,
		animationDuration: "2s",
		animationTimingFunction: "ease-in-out",
		animationIterationCount: "infinite",
		animationDelay: "0.5s",
	},
	title: {
		fontSize: "1.5rem",
		fontWeight: fontWeight.bold,
		color: colors.white,
		letterSpacing: "-0.02em",
	},
	subtitle: {
		fontSize: fontSize.base,
		color: colors.gray400,
		maxWidth: "320px",
		lineHeight: "1.6",
	},
	hint: {
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
		fontSize: fontSize.sm,
		color: colors.indigo400,
		marginTop: spacing.sm,
	},
	hintArrow: {
		animationName: stylex.keyframes({
			"0%, 100%": { transform: "translateX(0)" },
			"50%": { transform: "translateX(4px)" },
		}),
		animationDuration: "1.5s",
		animationIterationCount: "infinite",
	},
});

function MessagesIndex() {
	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.iconGroup)}>
				<div {...stylex.props(styles.mainIcon)}>
					<MessageCircle size={36} />
				</div>
				<div {...stylex.props(styles.sendBubble)}>
					<Send size={14} />
				</div>
			</div>
			<h2 {...stylex.props(styles.title)}>Select a conversation</h2>
			<p {...stylex.props(styles.subtitle)}>
				Choose from your existing conversations, or visit someone's profile to start a new chat.
			</p>
			<div {...stylex.props(styles.hint)}>
				<span>Pick a conversation from the sidebar</span>
				<ArrowRight size={14} {...stylex.props(styles.hintArrow)} />
			</div>
		</div>
	);
}
