import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Card } from "@vaye/ui";
import { MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "../components/users/UserAvatar";
import { getConversations } from "../server/functions/chat";
import { colors, fontSize, fontWeight, spacing } from "../tokens.stylex";

export const Route = createFileRoute("/messages")({
	component: MessagesLayout,
});

const styles = stylex.create({
	container: {
		display: "flex",
		height: "calc(100vh - 64px)",
		marginTop: spacing.md,
		gap: 0,
		borderRadius: "16px",
		overflow: "hidden",
	},
	sidebar: {
		width: "380px",
		display: "flex",
		flexDirection: "column",
		borderRight: `1px solid ${colors.gray800}`,
		overflowY: "auto",
		backgroundColor: "rgba(15, 23, 42, 0.4)",
		backdropFilter: "blur(20px)",
	},
	header: {
		padding: `${spacing.lg} ${spacing.md}`,
		borderBottom: `1px solid ${colors.gray800}`,
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		position: "sticky" as any,
		top: 0,
		zIndex: 10,
		backgroundColor: "rgba(15, 23, 42, 0.8)",
		backdropFilter: "blur(16px)",
	},
	headerLeft: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
	},
	title: {
		fontSize: "1.25rem",
		fontWeight: fontWeight.bold,
		color: colors.white,
		letterSpacing: "-0.02em",
	},
	headerIcon: {
		color: colors.indigo400,
	},
	newChatButton: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "36px",
		height: "36px",
		borderRadius: "50%",
		border: "none",
		backgroundColor: colors.indigo600,
		color: colors.white,
		cursor: "pointer",
		transition: "all 0.2s ease",
		":hover": {
			backgroundColor: colors.indigo500,
			transform: "scale(1.05)",
		},
	},
	searchWrapper: {
		padding: `${spacing.sm} ${spacing.md}`,
		borderBottom: `1px solid ${colors.gray800}`,
	},
	searchInput: {
		width: "100%",
		padding: `${spacing.sm} ${spacing.md}`,
		paddingLeft: "40px",
		borderRadius: "12px",
		border: `1px solid ${colors.gray700}`,
		backgroundColor: "rgba(30, 41, 59, 0.5)",
		color: colors.white,
		fontSize: fontSize.sm,
		outline: "none",
		transition: "all 0.2s ease",
		"::placeholder": {
			color: colors.gray500,
		},
		":focus": {
			borderColor: colors.indigo500,
			boxShadow: `0 0 0 3px ${colors.indigoAlpha20}`,
		},
	},
	searchContainer: {
		position: "relative" as any,
	},
	searchIcon: {
		position: "absolute" as any,
		left: "12px",
		top: "50%",
		transform: "translateY(-50%)",
		color: colors.gray500,
		pointerEvents: "none" as any,
	},
	conversationList: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
	},
	conversationItem: {
		display: "flex",
		alignItems: "center",
		padding: `${spacing.md} ${spacing.md}`,
		gap: spacing.md,
		textDecoration: "none",
		color: "inherit",
		transition: "all 0.15s ease",
		borderLeft: "3px solid transparent",
		":hover": {
			backgroundColor: "rgba(99, 102, 241, 0.06)",
			borderLeftColor: colors.indigo500,
		},
	},
	conversationItemActive: {
		backgroundColor: "rgba(99, 102, 241, 0.1)",
		borderLeftColor: colors.indigo500,
	},
	avatarWrapper: {
		position: "relative" as any,
		flexShrink: 0,
	},
	onlineIndicator: {
		position: "absolute" as any,
		bottom: "1px",
		right: "1px",
		width: "10px",
		height: "10px",
		borderRadius: "50%",
		backgroundColor: "#22c55e",
		border: "2px solid #0f172a",
	},
	conversationContent: {
		flex: 1,
		minWidth: 0,
	},
	conversationHeader: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "2px",
	},
	displayName: {
		fontWeight: fontWeight.semibold,
		fontSize: fontSize.base,
		color: colors.white,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	time: {
		fontSize: "0.75rem",
		color: colors.gray500,
		flexShrink: 0,
		marginLeft: spacing.sm,
	},
	lastMessage: {
		fontSize: fontSize.sm,
		color: colors.gray400,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		lineHeight: "1.4",
	},
	unreadBadge: {
		backgroundColor: colors.indigo500,
		color: colors.white,
		fontSize: "11px",
		fontWeight: fontWeight.bold,
		minWidth: "20px",
		height: "20px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "0 6px",
		borderRadius: "10px",
		flexShrink: 0,
	},
	emptyState: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		gap: spacing.md,
		flex: 1,
	},
	emptyIcon: {
		width: "56px",
		height: "56px",
		borderRadius: "16px",
		background: `linear-gradient(135deg, ${colors.indigo600}, ${colors.indigo400})`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: colors.white,
		marginBottom: spacing.sm,
	},
	emptyTitle: {
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.white,
	},
	emptyText: {
		fontSize: fontSize.sm,
		color: colors.gray500,
		textAlign: "center",
		lineHeight: "1.5",
	},
	main: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		backgroundColor: "rgba(15, 23, 42, 0.2)",
	},
	loadingDots: {
		display: "flex",
		gap: "4px",
		justifyContent: "center",
		padding: spacing.xl,
	},
	dot: {
		width: "8px",
		height: "8px",
		borderRadius: "50%",
		backgroundColor: colors.indigo400,
		animationName: stylex.keyframes({
			"0%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
			"50%": { opacity: 1, transform: "scale(1)" },
		}),
		animationDuration: "1.2s",
		animationIterationCount: "infinite",
	},
	dot2: {
		animationDelay: "0.2s",
	},
	dot3: {
		animationDelay: "0.4s",
	},
});

function formatTime(dateStr: string | Date) {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = diff / (1000 * 60 * 60);

	if (hours < 24) {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}
	if (hours < 168) {
		return date.toLocaleDateString([], { weekday: "short" });
	}
	return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function MessagesLayout() {
	const [searchFilter, setSearchFilter] = useState("");
	const { data: conversations, isLoading } = useQuery({
		queryKey: ["conversations"],
		queryFn: () => getConversations(),
		refetchInterval: 5000,
	});

	const filtered = searchFilter
		? conversations?.filter(
				(c: any) =>
					c.otherUser?.displayName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
					c.otherUser?.username?.toLowerCase().includes(searchFilter.toLowerCase()),
			)
		: conversations;

	return (
		<div {...stylex.props(styles.container)}>
			<Card {...stylex.props(styles.sidebar)}>
				<div {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.headerLeft)}>
						<MessageCircle size={22} {...stylex.props(styles.headerIcon)} />
						<h2 {...stylex.props(styles.title)}>Messages</h2>
					</div>
				</div>

				<div {...stylex.props(styles.searchWrapper)}>
					<div {...stylex.props(styles.searchContainer)}>
						<Search size={16} {...stylex.props(styles.searchIcon)} />
						<input
							{...stylex.props(styles.searchInput)}
							placeholder="Search conversations..."
							value={searchFilter}
							onChange={(e) => setSearchFilter(e.target.value)}
						/>
					</div>
				</div>

				<div {...stylex.props(styles.conversationList)}>
					{isLoading ? (
						<div {...stylex.props(styles.loadingDots)}>
							<div {...stylex.props(styles.dot)} />
							<div {...stylex.props(styles.dot, styles.dot2)} />
							<div {...stylex.props(styles.dot, styles.dot3)} />
						</div>
					) : filtered?.length === 0 ? (
						<div {...stylex.props(styles.emptyState)}>
							<div {...stylex.props(styles.emptyIcon)}>
								<MessageCircle size={28} />
							</div>
							<h3 {...stylex.props(styles.emptyTitle)}>No messages yet</h3>
							<p {...stylex.props(styles.emptyText)}>
								Start a conversation from someone's profile page.
							</p>
						</div>
					) : (
						filtered?.map((conv: any) => (
							<Link
								key={conv.id}
								to="/messages/$username"
								params={{ username: conv.otherUser?.username }}
								{...stylex.props(styles.conversationItem)}
								activeProps={{
									...stylex.props(styles.conversationItemActive),
								}}
							>
								<div {...stylex.props(styles.avatarWrapper)}>
									<UserAvatar
										avatarUrl={conv.otherUser?.avatarUrl || undefined}
										username={conv.otherUser?.username}
										size="md"
									/>
								</div>
								<div {...stylex.props(styles.conversationContent)}>
									<div {...stylex.props(styles.conversationHeader)}>
										<span {...stylex.props(styles.displayName)}>{conv.otherUser?.displayName}</span>
										{conv.lastMessage && (
											<span {...stylex.props(styles.time)}>{formatTime(conv.updatedAt)}</span>
										)}
									</div>
									<div {...stylex.props(styles.lastMessage)}>
										{conv.lastMessage ? conv.lastMessage.content : "No messages yet"}
									</div>
								</div>
								{conv.unreadCount > 0 && (
									<div {...stylex.props(styles.unreadBadge)}>{conv.unreadCount}</div>
								)}
							</Link>
						))
					)}
				</div>
			</Card>

			<Card {...stylex.props(styles.main)}>
				<Outlet />
			</Card>
		</div>
	);
}
