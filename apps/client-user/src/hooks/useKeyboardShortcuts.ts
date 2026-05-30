import { useCallback, useEffect } from "react";

export interface Shortcut {
	key: string;
	description: string;
	action: () => void;
	/** If true, fires even inside inputs (default: false) */
	allowInInput?: boolean;
}

function isInTextInput(el: Element | null): boolean {
	if (!el) return false;
	const tag = (el as HTMLElement).tagName.toLowerCase();
	return (
		tag === "input" ||
		tag === "textarea" ||
		(el as HTMLElement).isContentEditable
	);
}

/**
 * Registers keyboard shortcuts globally.
 * Shortcuts do NOT fire when focus is inside a text input unless `allowInInput` is set.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
	const handler = useCallback(
		(e: KeyboardEvent) => {
			// Skip modifier combos we don't handle (Ctrl/Meta)
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			const active = document.activeElement;

			for (const shortcut of shortcuts) {
				if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;
				if (!shortcut.allowInInput && isInTextInput(active)) return;

				e.preventDefault();
				shortcut.action();
				return;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[shortcuts],
	);

	useEffect(() => {
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handler]);
}
