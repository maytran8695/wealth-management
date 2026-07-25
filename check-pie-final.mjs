import { chromium } from "playwright";
const shot = (n) => `/private/tmp/claude-501/-Users-maytran-Downloads-claude-app-4/9dc293dd-9161-4aba-9424-79a528068a0d/scratchpad/${n}`;
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto("http://localhost:5175", { waitUntil: "networkidle" });
await page.waitForSelector("text=WEALTH MANAGEMENT");
await page.getByRole("button", { name: "Tổng quan", exact: false }).first().click();
await page.waitForSelector("text=Tỷ trọng tài sản", { timeout: 10000 });
await page.waitForTimeout(2500);
const els = await page.$$('.recharts-wrapper');
console.log("wrapper count:", els.length);
for (let i=0;i<els.length;i++){
  const box = await els[i].boundingBox();
  console.log(i, box);
}
await els[1].screenshot({ path: shot("f02b-pie-mobile.png") });
await browser.close();
