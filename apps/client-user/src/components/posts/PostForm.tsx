import * as stylex from "@stylexjs/stylex";
import { AlertCircle, AlertTriangle, ChevronDown, Send, Shield } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { createPost } from "../../server/functions/posts";
import { colors, radii, semanticColors, spacing } from "../../tokens.stylex";
import { CharacterCount } from "../shared/CharacterCount";
import { MentionAutocomplete, type MentionAutocompleteHandle } from "../shared/MentionAutocomplete";

// ─── Draft persistence ────────────────────────────────────────────────────────
const DRAFT_KEY = "vaye:draft";
const DRAFT_CW_KEY = "vaye:draft:cw";

function loadDraft() {
	try {
		return {
			content: sessionStorage.getItem(DRAFT_KEY) ?? "",
			cw: sessionStorage.getItem(DRAFT_CW_KEY) ?? "",
		};
	} catch {
		return { content: "", cw: "" };
	}
}

function saveDraft(content: string, cw: string) {
	try {
		if (content || cw) {
			sessionStorage.setItem(DRAFT_KEY, content);
			sessionStorage.setItem(DRAFT_CW_KEY, cw);
		} else {
			sessionStorage.removeItem(DRAFT_KEY);
			sessionStorage.removeItem(DRAFT_CW_KEY);
		}
	} catch {}
}

function clearDraft() {
	try {
		sessionStorage.removeItem(DRAFT_KEY);
		sessionStorage.removeItem(DRAFT_CW_KEY);
	} catch {}
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const spin = stylex.keyframes({
	from: { transform: "rotate(0deg)" },
	to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
	form: {
		backgroundColor: semanticColors.surfaceCard,
		borderRadius: radii.xl,
		boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
		padding: spacing.lg,
	},
	errorBox: {
		marginBottom: spacing.md,
		padding: spacing.sm,
		backgroundColor: semanticColors.errorBg,
		color: semanticColors.error,
		borderRadius: radii.lg,
		fontSize: "0.8125rem",
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		border: semanticColors.errorBorder,
	},
	errorIcon: { flexShrink: 0 },
	// Content warning bar
	cwBar: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.sm,
		padding: spacing.sm,
		borderRadius: radii.lg,
		backgroundColor: "rgba(245, 158, 11, 0.08)",
		border: "1px solid rgba(245, 158, 11, 0.2)",
	},
	cwIcon: { color: colors.amber500, flexShrink: 0 },
	cwInput: {
		flex: 1,
		backgroundColor: "transparent",
		border: "none",
		outline: "none",
		fontSize: "0.875rem",
		color: semanticColors.textPrimary,
		"::placeholder": { color: semanticColors.textTertiary },
	},
	// Draft indicator
	draftBadge: {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.25rem",
		fontSize: "0.7rem",
		fontWeight: 600,
		letterSpacing: "0.04em",
		textTransform: "uppercase",
		color: colors.amber500,
		marginBottom: spacing.sm,
		padding: "0.2rem 0.5rem",
		borderRadius: radii.full,
		backgroundColor: "rgba(245, 158, 11, 0.1)",
	},
	inputWrapper: {
		position: "relative",
		borderRadius: radii.lg,
		backgroundColor: semanticColors.surfaceInput,
		transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
	},
	inputWrapperFocused: {
		backgroundColor: semanticColors.surfaceCard,
		boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.12)",
	},
	textarea: {
		width: "100%",
		padding: spacing.md,
		fontSize: "0.9375rem",
		backgroundColor: "transparent",
		resize: "none",
		border: "none",
		outline: "none",
		lineHeight: "1.6",
		"::placeholder": { color: semanticColors.textTertiary },
	},
	footer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: spacing.md,
		gap: spacing.sm,
	},
	footerLeft: { display: "flex", alignItems: "center", gap: spacing.sm },
	cwToggle: {
		display: "flex",
		alignItems: "center",
		gap: "0.25rem",
		padding: "0.25rem 0.5rem",
		borderRadius: radii.md,
		border: "none",
		backgroundColor: "transparent",
		cursor: "pointer",
		fontSize: "0.75rem",
		fontWeight: 500,
		color: semanticColors.textTertiary,
		transition: "all 0.15s",
		":hover": { color: colors.amber500, backgroundColor: "rgba(245, 158, 11, 0.08)" },
	},
	cwToggleActive: { color: colors.amber500 },
	submitButton: {
		display: "flex",
		alignItems: "center",
		gap: spacing.sm,
		paddingLeft: spacing.xl,
		paddingRight: spacing.xl,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.blue600})`,
		color: colors.white,
		borderRadius: radii.lg,
		fontWeight: 600,
		fontSize: "0.875rem",
		border: "none",
		cursor: "pointer",
		transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
		boxShadow: "0 4px 12px -2px rgba(99, 102, 241, 0.25)",
		":hover": {
			boxShadow: "0 6px 16px -2px rgba(99, 102, 241, 0.35)",
			transform: "translateY(-1px)",
		},
		":disabled": { opacity: 0.5, cursor: "not-allowed", boxShadow: "none", transform: "none" },
	},
	spinner: {
		width: "1rem",
		height: "1rem",
		borderWidth: "2px",
		borderStyle: "solid",
		borderColor: "rgba(255, 255, 255, 0.3)",
		borderTopColor: colors.white,
		borderRadius: radii.full,
		animationName: spin,
		animationDuration: "0.7s",
		animationIterationCount: "infinite",
		animationTimingFunction: "linear",
	},
});

export function PostForm({ onSuccess }: { onSuccess?: () => void }) {
	const draft = loadDraft();
	const [content, setContent] = useState(draft.content);
	const [cwText, setCwText] = useState(draft.cw);
	const [showCw, setShowCw] = useState(!!draft.cw);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [cursorPos, setCursorPos] = useState(0);
	const hasDraft = !!(draft.content || draft.cw);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const mentionRef = useRef<MentionAutocompleteHandle>(null);

	const updateCwText = (val: string) => {
		setCwText(val);
		saveDraft(content, showCw ? val : "");
	};

	const toggleCw = () => {
		setShowCw((prev) => {
			const next = !prev;
			saveDraft(content, next ? cwText : "");
			return next;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (content.trim().length === 0) return;

		setLoading(true);
		setError("");

		try {
			const finalContent =
				showCw && cwText.trim() ? `<CW>${cwText.trim()}</CW>\n${content}` : content;
			await createPost({ data: { content: finalContent } });
			setContent("");
			setCwText("");
			setShowCw(false);
			clearDraft();
			onSuccess?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create post");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const val = e.target.value;
		setContent(val);
		setCursorPos(e.target.selectionStart ?? 0);
		saveDraft(val, showCw ? cwText : "");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (mentionRef.current?.handleKeyDown(e)) return;
	};

	const handleSelect = useCallback((newText: string, newCursorPos: number) => {
		setContent(newText);
		setCursorPos(newCursorPos);
		saveDraft(newText, showCw ? cwText : "");
		requestAnimationFrame(() => {
			const el = textareaRef.current;
			if (!el) return;
			el.setSelectionRange(newCursorPos, newCursorPos);
			el.focus();
		});
	}, []);

	return (
		<form onSubmit={handleSubmit} {...stylex.props(styles.form)} data-testid="post-form">
			{error && (
				<div {...stylex.props(styles.errorBox)}>
					<AlertCircle {...stylex.props(styles.errorIcon)} size={16} />
					{error}
				</div>
			)}

			{hasDraft && (
				<div {...stylex.props(styles.draftBadge)} data-testid="draft-badge">
					📝 Draft restored
				</div>
			)}

			{showCw && (
				<div {...stylex.props(styles.cwBar)} data-testid="cw-bar">
					<AlertTriangle size={14} {...stylex.props(styles.cwIcon)} />
					<input
						type="text"
						placeholder="Content warning (e.g. spoilers, sensitive topic)"
						value={cwText}
						onChange={(e) => updateCwText(e.target.value)}
						{...stylex.props(styles.cwInput)}
						maxLength={100}
						data-testid="cw-input"
					/>
				</div>
			)}

			<div {...stylex.props(styles.inputWrapper, isFocused && styles.inputWrapperFocused)}>
				<textarea
					ref={textareaRef}
					value={content}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					onSelect={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
					onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? 0)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					placeholder="What's happening?"
					{...stylex.props(styles.textarea)}
					rows={3}
					maxLength={280}
					data-testid="post-textarea"
				/>
			</div>

			<div {...stylex.props(styles.footer)}>
				<div {...stylex.props(styles.footerLeft)}>
					<CharacterCount count={content.length} max={280} />
					<button
						type="button"
						onClick={toggleCw}
						{...stylex.props(styles.cwToggle, showCw && styles.cwToggleActive)}
						data-testid="cw-toggle"
						title="Add content warning"
					>
						<Shield size={13} />
						CW
						<ChevronDown
							size={11}
							style={{
								transform: showCw ? "rotate(180deg)" : undefined,
								transition: "transform 0.2s",
							}}
						/>
					</button>
				</div>

				<button
					type="submit"
					disabled={loading || content.trim().length === 0 || content.length > 280}
					{...stylex.props(styles.submitButton)}
				>
					{loading ? (
						<>
							<div {...stylex.props(styles.spinner)} />
							Posting...
						</>
					) : (
						<>
							<Send size={20} />
							Post
						</>
					)}
				</button>
			</div>

			<MentionAutocomplete
				ref={mentionRef}
				text={content}
				cursorPos={cursorPos}
				onSelect={handleSelect}
				textareaEl={textareaRef.current}
			/>
		</form>
	);
}
