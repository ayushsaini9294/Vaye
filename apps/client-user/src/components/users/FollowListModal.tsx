import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getFollowersFn, getFollowingFn } from "../../server/functions/follows";
import { fontSize, fontWeight, radii, semanticColors, shadows, spacing } from "../../tokens.stylex";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { UserAvatar } from "./UserAvatar";

const styles = stylex.create({
	overlay: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		backdropFilter: "blur(4px)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 50,
		padding: spacing.md,
	},
	modal: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.xl,
		boxShadow: shadows.xl,
		width: "100%",
		maxWidth: "28rem",
		height: "80vh",
		maxHeight: "600px",
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: spacing.lg,
		borderBottom: `1px solid ${semanticColors.borderSubtle}`,
	},
	title: {
		fontSize: fontSize.lg,
		fontWeight: fontWeight.semibold,
		color: semanticColors.textPrimary,
	},
	closeButton: {
		background: "none",
		border: "none",
		color: semanticColors.textSecondary,
		cursor: "pointer",
		padding: spacing.xs,
		borderRadius: radii.md,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		":hover": {
			backgroundColor: semanticColors.bgHover,
			color: semanticColors.textPrimary,
		},
	},
	body: {
		flex: 1,
		overflowY: "auto",
		padding: spacing.md,
	},
	loadingWrapper: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
	},
	emptyWrapper: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		color: semanticColors.textSecondary,
		fontSize: fontSize.sm,
	},
	userCard: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		padding: spacing.md,
		borderRadius: radii.lg,
		textDecoration: "none",
		transition: "background-color 0.2s",
		":hover": {
			backgroundColor: semanticColors.bgHover,
		},
	},
	userInfo: {
		flex: 1,
		minWidth: 0,
	},
	displayName: {
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: semanticColors.textPrimary,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	username: {
		fontSize: fontSize.sm,
		color: semanticColors.textSecondary,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	bio: {
		fontSize: "0.75rem",
		color: semanticColors.textSecondary,
		marginTop: "2px",
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
});

interface FollowListModalProps {
	username: string;
	type: "followers" | "following";
	onClose: () => void;
}

export function FollowListModal({ username, type, onClose }: FollowListModalProps) {
	const [users, setUsers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, [username, type]);

	const loadData = async () => {
		try {
			setLoading(true);
			if (type === "followers") {
				const data = await getFollowersFn({ data: { username, limit: 50 } });
				setUsers(data.users || []);
			} else {
				const data = await getFollowingFn({ data: { username, limit: 50 } });
				setUsers(data.users || []);
			}
		} catch (error) {
			console.error(`Failed to load ${type}:`, error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div {...stylex.props(styles.overlay)} onClick={onClose}>
			<div {...stylex.props(styles.modal)} onClick={(e) => e.stopPropagation()}>
				<div {...stylex.props(styles.header)}>
					<h2 {...stylex.props(styles.title)}>{type === "followers" ? "Followers" : "Following"}</h2>
					<button type="button" onClick={onClose} {...stylex.props(styles.closeButton)}>
						<X size={20} />
					</button>
				</div>

				<div {...stylex.props(styles.body)}>
					{loading ? (
						<div {...stylex.props(styles.loadingWrapper)}>
							<LoadingSpinner />
						</div>
					) : users.length === 0 ? (
						<div {...stylex.props(styles.emptyWrapper)}>
							No {type} yet.
						</div>
					) : (
						users.map((user) => (
							<div key={user.id} {...stylex.props(styles.userCard)}>
								<Link
									to="/users/$username"
									params={{ username: user.username }}
									onClick={onClose}
									style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, textDecoration: "none", color: "inherit" }}
								>
									<UserAvatar avatarUrl={user.avatarUrl} username={user.username} size="md" />
									<div {...stylex.props(styles.userInfo)}>
										<div {...stylex.props(styles.displayName)}>{user.displayName}</div>
										<div {...stylex.props(styles.username)}>@{user.username}</div>
										{user.bio && <div {...stylex.props(styles.bio)}>{user.bio}</div>}
									</div>
								</Link>
								<Link
									to="/messages/$username"
									params={{ username: user.username }}
									style={{
										padding: "6px 12px",
										borderRadius: "6px",
										backgroundColor: "#e5e7eb",
										color: "#111827",
										textDecoration: "none",
										fontWeight: 500,
										fontSize: "12px",
									}}
								>
									Message
								</Link>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
