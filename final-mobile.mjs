import { chromium } from "playwright";
const shot = (n) => `/private/tmp/claude-501/-Users-maytran-Downloads-claude-app-4/9dc293dd-9161-4aba-9424-79a528068a0d/scratchpad/${n}`;
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console.error: " + msg.text()); });

await page.goto("http://localhost:5175", { waitUntil: "networkidle" });
await page.waitForSelector("text=WEALTH MANAGEMENT", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: shot("f01-alerts.png"), fullPage: true });

const tab = (name) => page.getByRole("button", { name, exact: false }).first();
await tab("Tổng quan").click();
await page.waitForSelector("text=Tổng tài sản", { timeout: 10000 });
await page.waitForTimeout(2200);
await page.screenshot({ path: shot("f02-dashboard.png"), fullPage: true });

await tab("Tài sản").click();
await page.waitForSelector("text=Danh mục tài sản", { timeout: 10000 });
await page.waitForTimeout(300);
await page.screenshot({ path: shot("f03-assets.png"), fullPage: true });

await tab("Cố vấn").click();
await page.waitForSelector("input[placeholder*='kịch bản']", { timeout: 10000 });
await page.waitForTimeout(300);
await page.screenshot({ path: shot("f04-advisor.png"), fullPage: true });

console.log("ERRORS:", JSON.stringify(errors, null, 2));
await browser.close();
