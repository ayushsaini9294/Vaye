import { expect, test } from "@playwright/test";
import { createPost, goToProfile, loginAs, waitForHydration } from "./fixtures/test-helpers";

test.describe("Revaye (Repost)", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "alice");
	});

	// ── 1. Control visible on every post ────────────────────────────────────
	test("should show revaye button on each post in the feed", async ({ page }) => {
		// Home feed should have at least one post with a revaye button
		const revayeBtn = page.locator('[data-testid="revaye-button"]').first();
		await expect(revayeBtn).toBeVisible();
	});

	// ── 2. Repost a post ────────────────────────────────────────────────────
	test("should revaye a post (repost count increments)", async ({ page }) => {
		// Find the first post that Alice does NOT own so the button is enabled
		const firstEnabledBtn = page
			.locator('[data-testid="revaye-button"]:not([disabled])')
			.first();
		await expect(firstEnabledBtn).toBeVisible();

		// Ensure a clean baseline: if already revayeed, undo it first
		const currentState = await firstEnabledBtn.getAttribute("data-revayeed");
		if (currentState === "true") {
			await firstEnabledBtn.click({ force: true });
			await expect(firstEnabledBtn).toHaveAttribute("data-revayeed", "false", { timeout: 10000 });
		}

		// Capture baseline count (not revayeed)
		const countBefore = Number(await firstEnabledBtn.locator("span").innerText());

		// Revaye and wait for server reconciliation
		await firstEnabledBtn.click();
		await expect(firstEnabledBtn).toHaveAttribute("data-revayeed", "true", { timeout: 10000 });

		// Count should have gone up by exactly 1
		const countAfter = Number(await firstEnabledBtn.locator("span").innerText());
		expect(countAfter).toBe(countBefore + 1);
	});

	// ── 3. Undo a repost ────────────────────────────────────────────────────
	test("should undo a revaye (repost count decrements)", async ({ page }) => {
		// Use a stable locator pinned by postId so we don’t lose track during
		// the button’s disabled/loading window
		const anyEnabledBtn = page
			.locator('[data-testid="revaye-button"]:not([disabled])')
			.first();
		await expect(anyEnabledBtn).toBeVisible();

		// Pin the locator to this specific button via its id
		const btnId = await anyEnabledBtn.getAttribute("id");
		const btn = page.locator(`[id="${btnId}"]`).first();

		// Ensure clean baseline: if already revayeed, undo it first
		const currentState = await btn.getAttribute("data-revayeed");
		if (currentState === "true") {
			await btn.click({ force: true });
			await expect(btn).toHaveAttribute("data-revayeed", "false", { timeout: 10000 });
		}

		// Revaye — wait for server reconciliation
		await btn.click();
		await expect(btn).toHaveAttribute("data-revayeed", "true", { timeout: 10000 });
		const countAfterRevaye = Number(await btn.locator("span").innerText());

		// Undo — wait for server reconciliation
		await btn.click();
		await expect(btn).toHaveAttribute("data-revayeed", "false", { timeout: 10000 });
		const countAfterUndo = Number(await btn.locator("span").innerText());

		expect(countAfterUndo).toBe(countAfterRevaye - 1);
	});

	// ── 4. Repost count is displayed ────────────────────────────────────────
	test("should display repost count alongside the revaye button", async ({ page }) => {
		// Every revaye button renders a span with the count (even if 0)
		const countSpan = page
			.locator('[data-testid="revaye-button"] span')
			.first();
		await expect(countSpan).toBeVisible();
		// Count should be a non-negative integer
		const text = await countSpan.innerText();
		expect(Number(text)).toBeGreaterThanOrEqual(0);
	});

	// ── 5. Revayeed post appears on reposter's profile ─────────────────────
	test("should show revayeed post on the reposter's profile", async ({ page }) => {
		// Alice is already logged in. Go to the explore feed to find bob's seed posts.
		await page.goto("/explore", { waitUntil: "networkidle" });
		await waitForHydration(page);

		// Find any enabled revaye button (non-alice post)
		const anyEnabledBtn = page
			.locator('[data-testid="revaye-button"]:not([disabled])')
			.first();
		await expect(anyEnabledBtn).toBeVisible();

		// Pin by ID and capture the post text
		const btnId = await anyEnabledBtn.getAttribute("id");
		const btn = page.locator(`[id="${btnId}"]`).first();
		const owningArticle = anyEnabledBtn.locator("xpath=ancestor::article");
		const postText = (await owningArticle.locator("a[href*='/posts/']").first().innerText()).trim().substring(0, 40);

		// Revaye if not already revayeed
		const state = await btn.getAttribute("data-revayeed");
		if (state === "false") {
			await btn.click({ force: true });
			await expect(btn).toHaveAttribute("data-revayeed", "true", { timeout: 10000 });
		}

		// Navigate to Alice's profile
		await goToProfile(page, "alice");

		// The revayeed post should appear
		const profilePost = page.locator("article").filter({ hasText: postText }).first();
		await expect(profilePost).toBeVisible({ timeout: 10000 });

		// Attribution banner linking back to alice should be present
		const attribution = profilePost.locator('[data-testid="revaye-attribution"]');
		await expect(attribution).toBeVisible();
		await expect(attribution).toContainText("Alice");
	});

	// ── 6. Own-post restriction ──────────────────────────────────────────────
	test("should not allow revayeing your own post", async ({ page }) => {
		// Create a post as alice, then verify its revaye button is disabled
		const ownPostContent = `Own post revaye block ${Date.now()}`;
		await createPost(page, ownPostContent);

		// Find the newly created post
		const ownArticle = page.locator("article").filter({ hasText: ownPostContent }).first();
		const revayeBtn = ownArticle.locator('[data-testid="revaye-button"]');

		// Button should exist but be disabled
		await expect(revayeBtn).toBeVisible();
		await expect(revayeBtn).toBeDisabled();

		// Title should explain why
		await expect(revayeBtn).toHaveAttribute("title", "Cannot revaye your own post");
	});
});
