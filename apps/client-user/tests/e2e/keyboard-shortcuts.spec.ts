import { expect, test } from "@playwright/test";
import { loginAs } from "./fixtures/test-helpers";

test.describe("Keyboard Shortcuts & Accessibility", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "alice");
		// Ensure we're on home with posts loaded
		await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
	});

	// ── 1. ? opens shortcuts overlay ─────────────────────────────────────────
	test("should open shortcuts help overlay with ? key", async ({ page }) => {
		await page.keyboard.press("?");
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).toBeVisible();
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).toContainText(
			"Keyboard Shortcuts",
		);
	});

	// ── 2. Escape closes overlay ─────────────────────────────────────────────
	test("should close shortcuts overlay with Escape", async ({ page }) => {
		await page.keyboard.press("?");
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).not.toBeVisible();
	});

	// ── 3. Floating trigger button visible ───────────────────────────────────
	test("should show keyboard shortcuts trigger button", async ({ page }) => {
		await expect(page.locator('[data-testid="shortcuts-trigger"]')).toBeVisible();
	});

	// ── 4. Clicking trigger opens overlay ────────────────────────────────────
	test("should open overlay when trigger button is clicked", async ({ page }) => {
		await page.locator('[data-testid="shortcuts-trigger"]').click({ force: true });
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).toBeVisible();
	});

	// ── 5. Shortcut does NOT fire inside textarea ─────────────────────────────
	test("should NOT trigger shortcut when typing in a text input", async ({ page }) => {
		const textarea = page.locator('[data-testid="post-textarea"]');
		await textarea.click();

		// Typing "?" inside a textarea should NOT open the shortcuts overlay
		await textarea.type("?");
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).not.toBeVisible();
	});

	// ── 6. Overlay lists all shortcut groups ─────────────────────────────────
	test("should display navigation and action shortcuts in overlay", async ({ page }) => {
		await page.keyboard.press("?");
		const overlay = page.locator('[data-testid="shortcuts-overlay"]');
		await expect(overlay).toContainText("Navigation");
		await expect(overlay).toContainText("Next post");
		await expect(overlay).toContainText("Like");
		await expect(overlay).toContainText("Bookmark");
	});

	// ── 7. ? again closes overlay (toggle) ───────────────────────────────────
	test("should toggle overlay closed with second ? press", async ({ page }) => {
		await page.keyboard.press("?");
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).toBeVisible();
		await page.keyboard.press("?");
		await expect(page.locator('[data-testid="shortcuts-overlay"]')).not.toBeVisible();
	});
});
