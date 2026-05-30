import * as stylex from "@stylexjs/stylex";
import { useRouter } from "@tanstack/react-router";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { updateProfile } from "../../server/functions/users";
import { colors, fontSize, fontWeight, radii, semanticColors, shadows, spacing } from "../../tokens.stylex";

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
		maxWidth: "32rem",
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
		padding: spacing.lg,
		display: "flex",
		flexDirection: "column",
		gap: spacing.lg,
	},
	fieldGroup: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.xs,
	},
	label: {
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: semanticColors.textPrimary,
	},
	input: {
		width: "100%",
		padding: spacing.md,
		borderRadius: radii.md,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		fontSize: fontSize.sm,
		":focus": {
			outline: "none",
			borderColor: semanticColors.borderFocus,
		},
	},
	textarea: {
		width: "100%",
		padding: spacing.md,
		borderRadius: radii.md,
		border: `1px solid ${semanticColors.borderDefault}`,
		backgroundColor: semanticColors.surfaceInput,
		color: semanticColors.textPrimary,
		fontSize: fontSize.sm,
		resize: "vertical",
		minHeight: "100px",
		":focus": {
			outline: "none",
			borderColor: semanticColors.borderFocus,
		},
	},
	footer: {
		padding: spacing.lg,
		borderTop: `1px solid ${semanticColors.borderSubtle}`,
		display: "flex",
		justifyContent: "flex-end",
		gap: spacing.md,
	},
	button: {
		paddingInline: spacing.lg,
		paddingBlock: spacing.sm,
		borderRadius: radii.md,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		cursor: "pointer",
		transition: "all 0.2s ease",
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
	},
	cancelButton: {
		backgroundColor: "transparent",
		border: `1px solid ${semanticColors.borderDefault}`,
		color: semanticColors.textPrimary,
		":hover": {
			backgroundColor: semanticColors.bgHover,
		},
	},
	saveButton: {
		backgroundColor: semanticColors.primary,
		border: "none",
		color: colors.white,
		":hover": {
			backgroundColor: semanticColors.primaryHover,
		},
		":disabled": {
			opacity: 0.7,
			cursor: "not-allowed",
		},
	},
	error: {
		color: colors.red500,
		fontSize: fontSize.sm,
	},
});

interface EditProfileModalProps {
	user: {
		displayName: string;
		bio?: string;
		avatarUrl?: string;
	};
	onClose: () => void;
	onSuccess: () => void;
}

export function EditProfileModal({ user, onClose, onSuccess }: EditProfileModalProps) {
	const router = useRouter();
	const [displayName, setDisplayName] = useState(user.displayName);
	const [bio, setBio] = useState(user.bio || "");
	const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!displayName.trim()) {
			setError("Display name is required");
			return;
		}

		try {
			setLoading(true);
			await updateProfile({
				data: {
					displayName: displayName.trim(),
					bio: bio.trim() || undefined,
					avatarUrl: avatarUrl.trim() || undefined,
				},
			});
			router.invalidate();
			onSuccess();
		} catch (err: any) {
			setError(err.message || "Failed to update profile");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div {...stylex.props(styles.overlay)} onClick={onClose}>
			<div {...stylex.props(styles.modal)} onClick={(e) => e.stopPropagation()}>
				<div {...stylex.props(styles.header)}>
					<h2 {...stylex.props(styles.title)}>Edit Profile</h2>
					<button type="button" onClick={onClose} {...stylex.props(styles.closeButton)}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div {...stylex.props(styles.body)}>
						{error && <div {...stylex.props(styles.error)}>{error}</div>}

						<div {...stylex.props(styles.fieldGroup)}>
							<label htmlFor="displayName" {...stylex.props(styles.label)}>
								Display Name
							</label>
							<input
								id="displayName"
								type="text"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								{...stylex.props(styles.input)}
								maxLength={50}
							/>
						</div>

						<div {...stylex.props(styles.fieldGroup)}>
							<label htmlFor="bio" {...stylex.props(styles.label)}>
								Bio
							</label>
							<textarea
								id="bio"
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								{...stylex.props(styles.textarea)}
								maxLength={160}
								placeholder="Tell us about yourself..."
							/>
						</div>

						<div {...stylex.props(styles.fieldGroup)}>
							<label htmlFor="avatarUrl" {...stylex.props(styles.label)}>
								Avatar URL
							</label>
							<input
								id="avatarUrl"
								type="url"
								value={avatarUrl}
								onChange={(e) => setAvatarUrl(e.target.value)}
								{...stylex.props(styles.input)}
								placeholder="https://example.com/avatar.jpg"
							/>
						</div>
					</div>

					<div {...stylex.props(styles.footer)}>
						<button
							type="button"
							onClick={onClose}
							{...stylex.props(styles.button, styles.cancelButton)}
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							{...stylex.props(styles.button, styles.saveButton)}
							disabled={loading}
						>
							{loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
							Save Changes
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
