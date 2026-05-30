import { expect, test } from "@playwright/test";
import { loginAs, waitForHydration } from "./fixtures/test-helpers";

test.describe("Infinite Scroll", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "alice");
	});

	// ── 1. Initial load renders posts ────────────────────────────────────────
	test("should load initial posts on home feed", async ({ page }) => {
		await expect(page.locator('[data-testid="post-feed"]')).toBeVisible();
		await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
	});

	// ── 2. Sentinel exists ───────────────────────────────────────────────────
	test("should have a scroll sentinel element", async ({ page }) => {
		await expect(page.locator('[data-testid="scroll-sentinel"]')).toBeAttached();
	});

	// ── 3. Scrolling triggers loading-more state ─────────────────────────────
	test("should trigger load-more or show end message when scrolled to bottom", async ({ page }) => {
		// Scroll to bottom
		await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
		await page.waitForTimeout(1000);

		// Either "loading more" appeared or "end of feed" is shown — both are valid
		const loadingMore = page.locator('[data-testid="loading-more"]');
		const feedEnd = page.locator('[data-testid="feed-end"]');
		const either = await Promise.race([
			loadingMore.waitFor({ state: "visible" }).then(() => true).catch(() => false),
			feedEnd.waitFor({ state: "visible" }).then(() => true).catch(() => false),
		]);
		expect(either).toBe(true);
	});

	// ── 4. Explore feed also has sentinel ────────────────────────────────────
	test("should have infinite scroll sentinel on explore page", async ({ page }) => {
		await page.goto("/explore", { waitUntil: "networkidle" });
		await expect(page.locator('[data-testid="scroll-sentinel"]')).toBeAttached();
		await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
	});

	// ── 5. Scroll restoration: navigate away and back ────────────────────────
	test("should restore scroll position after navigating away and back", async ({ page }) => {
		// Scroll down significantly
		await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
		await page.waitForTimeout(300);

		// Save scroll by navigating to a post (click first article link)
		const firstPostLink = page.locator("article a[href*='/posts/']").first();
		await firstPostLink.click();
		await page.waitForURL(/\/posts\//);

		// Go back
		await page.goBack();
		await page.waitForURL("/");
		await waitForHydration(page);
		// Wait longer for scroll restoration which usually happens after hydration
		await page.waitForTimeout(2000);

		// Scroll should be roughly restored (> 50px)
		const scrollY = await page.evaluate(() => window.scrollY);
		expect(scrollY).toBeGreaterThan(50);
	});
});
