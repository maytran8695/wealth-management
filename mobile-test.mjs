import { chromium } from "playwright";
const shot = (n) => `/private/tmp/claude-501/-Users-maytran-Downloads-claude-app-4/9dc293dd-9161-4aba-9424-79a528068a0d/scratchpad/${n}`;
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (msg) => { if (msg.type() === "error") errors.push("console.error: " + msg.text()); });

await page.goto("http://localhost:5175", { waitUntil: "networkidle" });
await page.waitForSelector("text=WEALTH MANAGEMENT", { timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: shot("m01-alerts.png"), fullPage: true });

const tab = (name) => page.getByRole("button", { name, exact: false }).first();

await tab("Tổng quan").click();
await page.waitForSelector("text=Tổng tài sản", { timeout: 10000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: shot("m02-dashboard.png"), fullPage: true });

await tab("Tài sản").click();
await page.waitForSelector("text=Danh mục tài sản", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: shot("m03-assets.png"), fullPage: true });

await tab("Mục tiêu").click();
await page.waitForSelector("text=Mẫu mục tiêu theo vòng đời", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: shot("m04-goals.png"), fullPage: true });

await tab("Cố vấn").click();
await page.waitForSelector("input[placeholder*='kịch bản']", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: shot("m05-advisor.png"), fullPage: true });

await tab("Mô phỏng").click();
await page.waitForSelector("text=Mua tài sản mới bằng vay", { timeout: 10000 });
await page.fill("input[placeholder*='3000000000']", "3000000000");
await page.waitForTimeout(500);
await page.screenshot({ path: shot("m06-simulator-purchase.png"), fullPage: true });

await page.click("text=Stress-test lãi suất");
await page.waitForSelector("text=Nếu lãi suất vay tăng thêm", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: shot("m07-simulator-stress.png"), fullPage: true });

await page.click("text=Trả nợ sớm");
await page.waitForSelector("text=Trả nợ sớm bằng tiền nhàn rỗi", { timeout: 10000 });
await page.fill("input[placeholder='0']", "500000000");
await page.waitForTimeout(500);
await page.screenshot({ path: shot("m08-simulator-prepay.png"), fullPage: true });

await tab("Cấu hình").click();
await page.waitForSelector("text=Ngưỡng & quy tắc cảnh báo", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: shot("m09-settings.png"), fullPage: true });

console.log("ERRORS:", JSON.stringify(errors, null, 2));
await browser.close();
