import { expect, test } from "@playwright/test";
import { loginAs } from "./fixtures/test-helpers";

test.describe("Mentions Autocomplete", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "alice");
		// Make sure the post form is visible on the home page
		await expect(page.locator('textarea[placeholder*="happening"]')).toBeVisible();
	});

	// ── 1. Dropdown appears after typing @+chars ─────────────────────────────
	test("should show dropdown when typing @username", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("@bo");

		// Dropdown should appear
		await expect(page.locator('[data-testid="mention-dropdown"]')).toBeVisible({ timeout: 3000 });

		// Should list at least bob
		await expect(page.locator('[data-testid="mention-option"]').first()).toBeVisible();
	});

	// ── 2. Selecting a user inserts the mention ──────────────────────────────
	test("should insert @username when user is selected via click", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("Hello @bo");

		const dropdown = page.locator('[data-testid="mention-dropdown"]');
		await expect(dropdown).toBeVisible({ timeout: 3000 });

		// Click the first option
		const firstOption = page.locator('[data-testid="mention-option"]').first();
		await firstOption.click();

		// Dropdown should close
		await expect(dropdown).not.toBeVisible();

		// Textarea value should contain the completed mention (e.g. "Hello @bob ")
		const value = await textarea.inputValue();
		expect(value).toMatch(/Hello @\w+ /);
		expect(value).not.toContain("@bo ");
	});

	// ── 3. Keyboard: ArrowDown + Enter confirms ──────────────────────────────
	test("should navigate and confirm with keyboard (Enter)", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("@ali");

		const dropdown = page.locator('[data-testid="mention-dropdown"]');
		await expect(dropdown).toBeVisible({ timeout: 5000 });

		// Wait for options to render
		await expect(page.locator('[data-testid="mention-option"]').first()).toBeVisible();

		// Arrow down to move selection, then Enter to confirm
		await page.keyboard.press("ArrowDown");
		await page.waitForTimeout(100);
		await page.keyboard.press("Enter");

		await expect(dropdown).not.toBeVisible({ timeout: 3000 });
		const value = await textarea.inputValue();
		// Should contain @username followed by a space (no newline)
		expect(value).toMatch(/@\w+ /);
		expect(value).not.toContain("\n");
	});

	// ── 4. Tab also confirms ─────────────────────────────────────────────────
	test("should confirm selection with Tab", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("@cha");

		const dropdown = page.locator('[data-testid="mention-dropdown"]');
		await expect(dropdown).toBeVisible({ timeout: 5000 });
		await expect(page.locator('[data-testid="mention-option"]').first()).toBeVisible();

		await page.keyboard.press("Tab");
		await expect(dropdown).not.toBeVisible({ timeout: 3000 });

		const value = await textarea.inputValue();
		expect(value).toMatch(/@\w+ /);
	});

	// ── 5. Escape dismisses ──────────────────────────────────────────────────
	test("should dismiss dropdown with Escape", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("@bo");

		const dropdown = page.locator('[data-testid="mention-dropdown"]');
		await expect(dropdown).toBeVisible({ timeout: 5000 });
		await expect(page.locator('[data-testid="mention-option"]').first()).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(dropdown).not.toBeVisible({ timeout: 3000 });

		// Text should remain unchanged
		const value = await textarea.inputValue();
		expect(value).toBe("@bo");
	});

	// ── 6. Text replacement preserves surrounding text ────────────────────────
	test("should replace only the @token and preserve surrounding text", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		// Fill then clear to position cursor correctly
		await textarea.fill("Hey @bo");
		// Trigger detection by firing an input event (fill doesn't fire onChange in Playwright)
		await textarea.press("End");
		// The dropdown should appear for @bo
		await expect(page.locator('[data-testid="mention-dropdown"]')).toBeVisible({ timeout: 3000 });

		await page.locator('[data-testid="mention-option"]').first().click();

		const value = await textarea.inputValue();
		// Should start with "Hey @<username> "
		expect(value).toMatch(/^Hey @\w+ $/);
	});

	// ── 7. @ mid-sentence (after space) works ────────────────────────────────
	test("should trigger after a space mid-sentence", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("cc @bo");

		await expect(page.locator('[data-testid="mention-dropdown"]')).toBeVisible({ timeout: 3000 });
	});

	// ── 8. Multiple mentions in one post ─────────────────────────────────────
	test("should handle multiple mentions in one post", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();

		// Type first mention and confirm
		await textarea.type("@bo");
		await expect(page.locator('[data-testid="mention-dropdown"]')).toBeVisible({ timeout: 3000 });
		await textarea.press("Enter");
		await expect(page.locator('[data-testid="mention-dropdown"]')).not.toBeVisible();

		// Continue typing a second mention
		await textarea.type("and @cha");
		await expect(page.locator('[data-testid="mention-dropdown"]')).toBeVisible({ timeout: 3000 });
		await textarea.press("Enter");
		await expect(page.locator('[data-testid="mention-dropdown"]')).not.toBeVisible();

		const value = await textarea.inputValue();
		// Should have two @mentions
		const mentionMatches = value.match(/@\w+/g) ?? [];
		expect(mentionMatches.length).toBeGreaterThanOrEqual(2);
	});

	// ── 9. Does NOT trigger inside a word (email@domain) ─────────────────────
	test("should NOT trigger for email@domain style input", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("contact email@domain");

		// No dropdown — the @ is preceded by a non-space character
		const dropdown = page.locator('[data-testid="mention-dropdown"]');
		await expect(dropdown).not.toBeVisible();
	});

	// ── 10. @ at very start of text works ────────────────────────────────────
	test("should trigger when @ is at the very start of input", async ({ page }) => {
		const textarea = page.locator('textarea[placeholder*="happening"]');
		await textarea.click();
		await textarea.type("@ali");

		await expect(page.locator('[data-testid="mention-dropdown"]')).toBeVisible({ timeout: 3000 });
	});
});
