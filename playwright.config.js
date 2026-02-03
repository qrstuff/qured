import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./test/browser",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 2,
	reporter: "list",
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
	],
	use: {
		trace: "on-first-retry",
	},
	timeout: 90000,
	webServer: {
		command: "npx serve -l 9876",
		url: "http://localhost:9876",
		reuseExistingServer: !process.env.CI,
		timeout: 12000,
	},
});
