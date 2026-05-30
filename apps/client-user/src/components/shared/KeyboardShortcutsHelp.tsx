import * as stylex from "@stylexjs/stylex";
import { Keyboard, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { colors, radii, semanticColors, shadows, spacing } from "../../tokens.stylex";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

const styles = stylex.create({
	trigger: {
		position: "fixed",
		bottom: spacing.xl,
		right: spacing.xl,
		width: "2.5rem",
		height: "2.5rem",
		borderRadius: radii.full,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.purple600})`,
		color: colors.white,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		border: "none",
		cursor: "pointer",
		boxShadow: shadows.lg,
		zIndex: 99999,
		transition: "transform 0.2s",
		":hover": { transform: "scale(1.1)" },
	},
	overlay: {
		position: "fixed",
		inset: 0,
		backgroundColor: "rgba(0,0,0,0.5)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 99999,
		backdropFilter: "blur(4px)",
	},
	panel: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii["2xl"],
		boxShadow: shadows.xl,
		padding: spacing["2xl"],
		maxWidth: "28rem",
		width: "90vw",
		maxHeight: "80vh",
		overflowY: "auto",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.xl,
	},
	title: {
		fontWeight: 700,
		fontSize: "1.125rem",
		color: semanticColors.textPrimary,
	},
	closeBtn: {
		background: "none",
		border: "none",
		cursor: "pointer",
		color: semanticColors.textTertiary,
		padding: spacing.xs,
		borderRadius: radii.md,
		":hover": { color: semanticColors.textPrimary },
	},
	group: { marginBottom: spacing.xl },
	groupTitle: {
		fontSize: "0.7rem",
		fontWeight: 600,
		letterSpacing: "0.06em",
		textTransform: "uppercase",
		color: semanticColors.textTertiary,
		marginBottom: spacing.md,
	},
	row: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderBottom: `1px solid ${semanticColors.borderLight}`,
	},
	desc: { fontSize: "0.875rem", color: semanticColors.textSecondary },
	kbd: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minWidth: "1.75rem",
		height: "1.75rem",
		padding: "0 0.375rem",
		borderRadius: radii.sm,
		backgroundColor: semanticColors.surfaceInput,
		border: `1px solid ${semanticColors.borderDefault}`,
		fontSize: "0.75rem",
		fontWeight: 600,
		fontFamily: "monospace",
		color: semanticColors.textPrimary,
	},
});

const SHORTCUTS = [
	{ group: "Navigation", items: [
		{ key: "J", description: "Next post" },
		{ key: "K", description: "Previous post" },
		{ key: "Enter", description: "Open focused post" },
	]},
	{ group: "Actions on focused post", items: [
		{ key: "L", description: "Like / Unlike" },
		{ key: "B", description: "Bookmark / Unbookmark" },
		{ key: "R", description: "Reply (open post)" },
		{ key: "T", description: "Revaye (repost)" },
	]},
	{ group: "Global", items: [
		{ key: "?", description: "Show / hide this help" },
		{ key: "N", description: "New post (focus compose)" },
		{ key: "Escape", description: "Dismiss dialogs" },
	]},
];

export function KeyboardShortcutsHelp() {
	const [open, setOpen] = useState(false);

	const toggle = useCallback(() => setOpen((v) => !v), []);

	useKeyboardShortcuts([
		{ key: "?", description: "Show keyboard shortcuts", action: toggle },
	]);

	// Close on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);

	return (
		<>
			<button
				type="button"
				onClick={toggle}
				{...stylex.props(styles.trigger)}
				aria-label="Keyboard shortcuts"
				data-testid="shortcuts-trigger"
				title="Keyboard shortcuts (?)"
			>
				<Keyboard size={16} />
			</button>

			{open && (
				<div
					{...stylex.props(styles.overlay)}
					onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
					data-testid="shortcuts-overlay"
					role="dialog"
					aria-modal="true"
					aria-label="Keyboard shortcuts"
				>
					<div {...stylex.props(styles.panel)}>
						<div {...stylex.props(styles.header)}>
							<h2 {...stylex.props(styles.title)}>Keyboard Shortcuts</h2>
							<button type="button" onClick={() => setOpen(false)} {...stylex.props(styles.closeBtn)} aria-label="Close">
								<X size={18} />
							</button>
						</div>

						{SHORTCUTS.map((group) => (
							<div key={group.group} {...stylex.props(styles.group)}>
								<div {...stylex.props(styles.groupTitle)}>{group.group}</div>
								{group.items.map((item) => (
									<div key={item.key} {...stylex.props(styles.row)}>
										<span {...stylex.props(styles.desc)}>{item.description}</span>
										<kbd {...stylex.props(styles.kbd)}>{item.key}</kbd>
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			)}
		</>
	);
}
