import { expect, test } from "@playwright/test";
import { loginAs } from "./fixtures/test-helpers";

test.describe("Drafts & Content Warnings", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "alice");
		// Clear any existing draft via sessionStorage
		await page.evaluate(() => {
			sessionStorage.removeItem("vaye:draft");
			sessionStorage.removeItem("vaye:draft:cw");
		});
		await expect(page.locator('[data-testid="post-textarea"]')).toBeVisible();
	});

	// ── 1. Draft saved on navigation ─────────────────────────────────────────
	test("should preserve draft when navigating away", async ({ page }) => {
		const textarea = page.locator('[data-testid="post-textarea"]');
		const draftText = `Draft test ${Date.now()}`;
		await textarea.fill(draftText);

		// Navigate away
		await page.goto("/explore");
		await page.waitForTimeout(300);

		// Come back
		await page.goto("/", { waitUntil: "networkidle" });
		await expect(page.locator('[data-testid="post-textarea"]')).toHaveValue(draftText, { timeout: 5000 });
	});

	// ── 2. Draft badge appears on restore ────────────────────────────────────
	test("should show draft-restored badge when draft exists", async ({ page }) => {
		const textarea = page.locator('[data-testid="post-textarea"]');
		await textarea.fill("testing draft badge");

		await page.goto("/explore");
		await page.goto("/", { waitUntil: "networkidle" });

		await expect(page.locator('[data-testid="draft-badge"]')).toBeVisible({ timeout: 5000 });
	});

	// ── 3. Draft cleared on post ─────────────────────────────────────────────
	test("should clear draft after submitting a post", async ({ page }) => {
		const textarea = page.locator('[data-testid="post-textarea"]');
		const uniqueContent = `Draft clear test ${Date.now()}`;
		await textarea.fill(uniqueContent);

		// Submit
		await page.locator('[data-testid="post-form"]').locator('button[type="submit"]').click();
		await page.waitForTimeout(2000);

		// Draft should be gone from sessionStorage
		const draft = await page.evaluate(() => sessionStorage.getItem("vaye:draft"));
		expect(draft).toBeNull();

		// Navigate away and back — no draft badge
		await page.goto("/explore");
		await page.goto("/", { waitUntil: "networkidle" });
		await expect(page.locator('[data-testid="draft-badge"]')).not.toBeVisible();
	});

	// ── 4. Content warning toggle shows CW field ─────────────────────────────
	test("should show CW input when CW toggle is clicked", async ({ page }) => {
		await expect(page.locator('[data-testid="cw-bar"]')).not.toBeVisible();
		await page.locator('[data-testid="cw-toggle"]').click();
		await expect(page.locator('[data-testid="cw-bar"]')).toBeVisible();
		await expect(page.locator('[data-testid="cw-input"]')).toBeVisible();
	});

	// ── 5. CW toggle hides field again ────────────────────────────────────────
	test("should hide CW field when toggled off", async ({ page }) => {
		await page.locator('[data-testid="cw-toggle"]').click();
		await expect(page.locator('[data-testid="cw-bar"]')).toBeVisible();
		await page.locator('[data-testid="cw-toggle"]').click();
		await expect(page.locator('[data-testid="cw-bar"]')).not.toBeVisible();
	});

	// ── 6. CW text persists across navigation ─────────────────────────────────
	test("should preserve content warning text in draft", async ({ page }) => {
		await page.locator('[data-testid="cw-toggle"]').click();
		await page.locator('[data-testid="cw-input"]').fill("spoilers ahead");
		await page.locator('[data-testid="post-textarea"]').fill("hidden content");

		await page.goto("/explore");
		await page.goto("/", { waitUntil: "networkidle" });

		// CW should be auto-shown because it was saved in draft
		await expect(page.locator('[data-testid="cw-bar"]')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('[data-testid="cw-input"]')).toHaveValue("spoilers ahead");
	});

	// ── 7. Only one draft at a time ───────────────────────────────────────────
	test("should overwrite old draft with new content", async ({ page }) => {
		const textarea = page.locator('[data-testid="post-textarea"]');
		await textarea.fill("first draft");
		await textarea.fill("second draft");

		const draft = await page.evaluate(() => sessionStorage.getItem("vaye:draft"));
		expect(draft).toBe("second draft");
	});
});
