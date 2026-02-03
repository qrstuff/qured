/**
 * Playwright spec: loads browser-test.html and asserts all Mocha tests passed.
 */
import { test, expect } from "@playwright/test";

test("Qured decode tests pass in browser", async ({ page }) => {
	await page.goto("http://localhost:9876/test/browser/browser-test.html");

	await page.waitForFunction(() => window.__mochaDone === true, {
		timeout: 60000,
	});

	const { passed, failed } = await page.evaluate(
		() => window.__mochaResults || { passed: [], failed: [] },
	);
	const failureCount = await page.evaluate(() => window.__mochaFailures ?? -1);

	if (passed.length) {
		console.log("\n  Passed:");
		passed.forEach((t) => console.log(`    ✓ ${t}`));
	}
	if (failed.length) {
		console.log("\n  Failed:");
		failed.forEach((t) => console.log(`    ✗ ${t}`));
	}

	expect(
		failureCount,
		failed.length ? `\n  Failed: ${failed.join(", ")}` : "no failing tests",
	).toBe(0);
});
