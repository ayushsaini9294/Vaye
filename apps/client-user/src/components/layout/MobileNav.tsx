import * as stylex from "@stylexjs/stylex";
import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Bookmark, Compass, Home, MessageSquare, Search } from "lucide-react";
import { colors, semanticColors, spacing, zIndex } from "../../tokens.stylex";

const styles = stylex.create({
	mobileNav: {
		position: "fixed",
		bottom: 0,
		left: 0,
		right: 0,
		height: "4rem",
		backgroundColor: semanticColors.surfaceOverlay,
		backdropFilter: "blur(20px) saturate(180%)",
		borderTop: `1px solid ${semanticColors.borderSubtle}`,
		display: "flex",
		alignItems: "center",
		justifyContent: "space-around",
		zIndex: zIndex.fixed,
		"@media (min-width: 768px)": {
			display: "none",
		},
	},
	navLink: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		color: semanticColors.textSecondary,
		textDecoration: "none",
		transition: "color 0.2s",
		padding: spacing.xs,
	},
	navLinkActive: {
		color: colors.indigo500,
	},
	navLabel: {
		fontSize: "0.625rem",
		fontWeight: 600,
	},
});

export function MobileNav() {
	const location = useLocation();
	const isActive = (path: string) => location.pathname === path;

	// Don't show on auth pages
	if (location.pathname.startsWith("/auth/")) {
		return null;
	}

	return (
		<nav {...stylex.props(styles.mobileNav)}>
			<Link to="/" {...stylex.props(styles.navLink, isActive("/") && styles.navLinkActive)}>
				<Home size={22} />
				<span {...stylex.props(styles.navLabel)}>Home</span>
			</Link>
			<Link
				to="/explore"
				{...stylex.props(styles.navLink, isActive("/explore") && styles.navLinkActive)}
			>
				<Compass size={22} />
				<span {...stylex.props(styles.navLabel)}>Explore</span>
			</Link>
			<Link
				to="/search"
				{...stylex.props(styles.navLink, isActive("/search") && styles.navLinkActive)}
			>
				<Search size={22} />
				<span {...stylex.props(styles.navLabel)}>Search</span>
			</Link>
			<Link
				to="/notifications"
				{...stylex.props(styles.navLink, isActive("/notifications") && styles.navLinkActive)}
			>
				<Bell size={22} />
				<span {...stylex.props(styles.navLabel)}>Inbox</span>
			</Link>
			<Link
				to="/bookmarks"
				{...stylex.props(styles.navLink, isActive("/bookmarks") && styles.navLinkActive)}
			>
				<Bookmark size={22} />
				<span {...stylex.props(styles.navLabel)}>Saved</span>
			</Link>
			<Link
				to="/messages"
				{...stylex.props(styles.navLink, isActive("/messages") && styles.navLinkActive)}
			>
				<MessageSquare size={22} />
				<span {...stylex.props(styles.navLabel)}>Chat</span>
			</Link>
		</nav>
	);
}
