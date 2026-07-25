import { chromium } from "playwright";
const shot = (n) => `/private/tmp/claude-501/-Users-maytran-Downloads-claude-app-4/9dc293dd-9161-4aba-9424-79a528068a0d/scratchpad/${n}`;
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto("http://localhost:5175", { waitUntil: "networkidle" });
await page.waitForSelector("text=WEALTH MANAGEMENT");
await page.getByRole("button", { name: "Tổng quan", exact: false }).first().click();
await page.waitForSelector("text=Tỷ trọng tài sản", { timeout: 10000 });
await page.waitForTimeout(2000);
for (const y of [0, 700, 1400]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(`f02c-scroll-${y}.png`) }); // viewport only
}
await browser.close();
