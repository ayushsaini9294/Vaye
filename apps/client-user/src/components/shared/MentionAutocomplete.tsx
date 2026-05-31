import * as stylex from "@stylexjs/stylex";
import { AtSign } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { searchUsers } from "../../server/functions/search";
import { colors, radii, semanticColors, shadows, spacing, zIndex } from "../../tokens.stylex";
import { UserAvatar } from "../users/UserAvatar";

const styles = stylex.create({
	dropdown: {
		position: "fixed",
		backgroundColor: semanticColors.surfaceCard,
		border: `1px solid ${semanticColors.borderDefault}`,
		borderRadius: radii.xl,
		boxShadow: shadows.lg,
		zIndex: zIndex.popover,
		minWidth: "15rem",
		maxWidth: "22rem",
		maxHeight: "16rem",
		overflow: "hidden",
	},
	dropdownHeader: {
		paddingLeft: spacing.md,
		paddingRight: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		fontSize: "0.7rem",
		fontWeight: 600,
		letterSpacing: "0.05em",
		textTransform: "uppercase",
		color: semanticColors.textTertiary,
		borderBottom: `1px solid ${semanticColors.borderLight}`,
		display: "flex",
		alignItems: "center",
		gap: spacing.xs,
	},
	list: {
		maxHeight: "12rem",
		overflowY: "auto",
	},
	item: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		paddingLeft: spacing.md,
		paddingRight: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		cursor: "pointer",
		transition: "background-color 0.1s",
		backgroundColor: "transparent",
		border: "none",
		width: "100%",
		textAlign: "left",
		":hover": {
			backgroundColor: semanticColors.bgHover,
		},
	},
	itemActive: {
		backgroundColor: semanticColors.bgHover,
	},
	itemText: {
		display: "flex",
		flexDirection: "column",
		gap: "0.125rem",
		minWidth: 0,
	},
	displayName: {
		fontWeight: 600,
		fontSize: "0.875rem",
		color: semanticColors.textPrimary,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	username: {
		fontSize: "0.75rem",
		color: semanticColors.textTertiary,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	empty: {
		paddingLeft: spacing.md,
		paddingRight: spacing.md,
		paddingTop: spacing.md,
		paddingBottom: spacing.md,
		fontSize: "0.875rem",
		color: semanticColors.textTertiary,
		textAlign: "center",
	},
	atIcon: {
		color: colors.indigo500,
	},
});

interface MentionUser {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string | null;
}

export interface MentionAutocompleteHandle {
	handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
}

interface MentionAutocompleteProps {
	text: string;
	cursorPos: number;
	onSelect: (newText: string, newCursorPos: number) => void;
	/** The textarea element ref — used to position the dropdown */
	textareaEl: HTMLTextAreaElement | null;
}

/**
 * Detect @-mention token being typed. Returns null if cursor is NOT inside
 * a valid mention context (e.g. email@domain won't trigger).
 */
function detectMentionQuery(
	text: string,
	cursorPos: number,
): { query: string; start: number } | null {
	const before = text.slice(0, cursorPos);
	const atIdx = before.lastIndexOf("@");
	if (atIdx === -1) return null;

	// @ must be preceded by start-of-string or whitespace
	const charBefore = atIdx > 0 ? before[atIdx - 1] : null;
	if (charBefore !== null && !/\s/.test(charBefore)) return null;

	// Query between @ and cursor — no whitespace allowed
	const query = before.slice(atIdx + 1);
	if (/\s/.test(query)) return null;

	return { query, start: atIdx };
}

export const MentionAutocomplete = forwardRef<MentionAutocompleteHandle, MentionAutocompleteProps>(
	function MentionAutocomplete({ text, cursorPos, onSelect, textareaEl }, ref) {
		const [users, setUsers] = useState<MentionUser[]>([]);
		const [activeIndex, setActiveIndex] = useState(0);
		const [loading, setLoading] = useState(false);
		const [dismissed, setDismissed] = useState(false);
		const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const listRef = useRef<HTMLUListElement>(null);

		// Use refs for values needed in the imperative handle to avoid stale closures
		const usersRef = useRef(users);
		usersRef.current = users;
		const activeIndexRef = useRef(activeIndex);
		activeIndexRef.current = activeIndex;

		const mention = detectMentionQuery(text, cursorPos);
		const isOpen =
			!dismissed && mention !== null && mention.query.length > 0 && (loading || users.length > 0);

		const isOpenRef = useRef(isOpen);
		isOpenRef.current = isOpen;

		// Reset dismissed when mention query changes
		useEffect(() => {
			setDismissed(false);
		}, []);

		// Fetch matching users
		useEffect(() => {
			if (!mention || mention.query.length === 0) {
				setUsers([]);
				return;
			}

			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(async () => {
				setLoading(true);
				try {
					const results = await searchUsers({ data: mention.query });
					setUsers(results.slice(0, 6));
					setActiveIndex(0);
				} catch {
					setUsers([]);
				} finally {
					setLoading(false);
				}
			}, 120);

			return () => {
				if (debounceRef.current) clearTimeout(debounceRef.current);
			};
		}, [mention?.query, mention]);

		// Scroll active item into view
		useEffect(() => {
			const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
			el?.scrollIntoView({ block: "nearest" });
		}, [activeIndex]);

		const confirmSelectionRef = useRef<(user: MentionUser) => void>(() => {});
		confirmSelectionRef.current = (user: MentionUser) => {
			if (!mention) return;
			const before = text.slice(0, mention.start);
			const after = text.slice(cursorPos);
			const inserted = `@${user.username} `;
			const newText = before + inserted + after;
			const newCursor = mention.start + inserted.length;
			onSelect(newText, newCursor);
			setUsers([]);
		};

		// Expose keyboard handler via ref — uses refs to avoid stale closures
		useImperativeHandle(
			ref,
			() => ({
				handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): boolean {
					if (!isOpenRef.current || usersRef.current.length === 0) return false;

					if (e.key === "ArrowDown") {
						e.preventDefault();
						setActiveIndex((i) => (i + 1) % usersRef.current.length);
						return true;
					}
					if (e.key === "ArrowUp") {
						e.preventDefault();
						setActiveIndex((i) => (i - 1 + usersRef.current.length) % usersRef.current.length);
						return true;
					}
					if (e.key === "Enter" || e.key === "Tab") {
						e.preventDefault();
						confirmSelectionRef.current(usersRef.current[activeIndexRef.current]);
						return true;
					}
					if (e.key === "Escape") {
						e.preventDefault();
						setUsers([]);
						setDismissed(true);
						return true;
					}
					return false;
				},
			}),
			[], // stable — uses refs internally
		);

		if (!isOpen || !textareaEl) return null;

		// Position below the textarea input wrapper
		const rect = textareaEl.getBoundingClientRect();
		const top = rect.bottom + 4;
		const left = rect.left;

		return (
			<div
				role="listbox"
				aria-label="Mention suggestions"
				data-testid="mention-dropdown"
				style={{ position: "fixed", top, left, width: rect.width }}
				{...stylex.props(styles.dropdown)}
			>
				<div {...stylex.props(styles.dropdownHeader)}>
					<AtSign size={11} {...stylex.props(styles.atIcon)} />
					Mention a user
				</div>

				{loading && users.length === 0 ? (
					<div {...stylex.props(styles.empty)}>Searching…</div>
				) : users.length === 0 ? (
					<div {...stylex.props(styles.empty)}>No users found</div>
				) : (
					<ul
						ref={listRef}
						{...stylex.props(styles.list)}
						style={{ listStyle: "none", margin: 0, padding: 0 }}
					>
						{users.map((user, idx) => (
							<li key={user.id} data-testid="mention-option">
								<button
									type="button"
									role="option"
									aria-selected={idx === activeIndex}
									onMouseDown={(e) => {
										e.preventDefault();
										confirmSelectionRef.current(user);
									}}
									{...stylex.props(styles.item, idx === activeIndex && styles.itemActive)}
								>
									<UserAvatar avatarUrl={user.avatarUrl} username={user.username} size="sm" />
									<div {...stylex.props(styles.itemText)}>
										<span {...stylex.props(styles.displayName)}>{user.displayName}</span>
										<span {...stylex.props(styles.username)}>@{user.username}</span>
									</div>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		);
	},
);
