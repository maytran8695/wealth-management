import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Wallet, TrendingUp, AlertTriangle, MessageCircle, Target, Plus, Trash2,
  X, DollarSign, Home, Bitcoin, Shield, Building2, Coins, Compass,
  ChevronRight, Send, Loader2, Check, Bell, BellOff, Pencil, Link2,
  RefreshCw, Landmark, Star, CalendarClock, Settings, Zap, Info,
  Sun, Moon, ChevronDown, ChevronLeft, Eye, EyeOff, RotateCcw, ArrowUp,
} from "lucide-react";
import { mockChatReply, mockInterpret } from "./mockAdvisor.js";

/* ---------------------------------- THEME ----------------------------------
 * `accent` is the single brand color for buttons/CTAs (UI chrome, not chart
 * data). Chart/data colors are a separate categorical 8-hue set (cat*) plus a
 * status pair (statusWarning/statusCritical) — both validated for CVD-safety
 * and contrast against these exact surfaces with
 * dataviz/scripts/validate_palette.js (adjacent pairlist, both modes). Do not
 * hand-pick replacements without re-running that validator.
 * --------------------------------------------------------------------------- */
const DARK_THEME = {
  bg: "#0A130E", bgPanel: "#101D16", bgPanel2: "#16271D",
  border: "#233A2C", borderLight: "#31503C",
  headerBg: "rgba(10,19,14,0.9)",
  accent: "#3FA873", accentText: "#7FE0AA", onAccent: "#0A130E", accentSoft: "#1B3F2C",
  catBlue: "#3987e5", catOrange: "#d95926", catAqua: "#199e70", catYellow: "#c98500",
  catMagenta: "#d55181", catGreen: "#008300", catViolet: "#9085e9", catRed: "#e66767",
  catYellowText: "#E8C97A",
  statusWarning: "#fab219", statusCritical: "#d03b3b",
  text: "#EDF5EF", textMuted: "#9AB2A2", textFaint: "#657A6C",
  danger: "#C4746A", success: "#7FA88C",
};
const LIGHT_THEME = {
  bg: "#F3FAF6", bgPanel: "#FFFFFF", bgPanel2: "#EAF6EE",
  border: "#D7ECDD", borderLight: "#BFE0CB",
  headerBg: "rgba(243,250,246,0.88)",
  accent: "#1F6B49", accentText: "#15532E", onAccent: "#FFFFFF", accentSoft: "#DCF2E3",
  catBlue: "#2a78d6", catOrange: "#eb6834", catAqua: "#1baf7a", catYellow: "#eda100",
  catMagenta: "#e87ba4", catGreen: "#008300", catViolet: "#4a3aa7", catRed: "#e34948",
  catYellowText: "#8A6423",
  statusWarning: "#fab219", statusCritical: "#d03b3b",
  text: "#16241C", textMuted: "#4E6B58", textFaint: "#7B9585",
  danger: "#B23B30", success: "#3F8F4F",
};
// Mutated in place (not reassigned) so every component reading C.xxx during
// render picks up the active theme without threading context everywhere.
const C = { ...LIGHT_THEME };

// Risk tiers are ordered (An toàn → Đầu cơ) but read better with distinct
// hues than a monochrome ramp — validated as a 4-slot categorical set
// (aqua/blue/green/red passes adjacent CVD + normal-vision floor both modes).
const TIERS = {
  1: { label: "An toàn", get color() { return C.catAqua; } },
  2: { label: "Ổn định tăng trưởng", get color() { return C.catBlue; } },
  3: { label: "Tăng trưởng cao", get color() { return C.catGreen; } },
  4: { label: "Đầu cơ", get color() { return C.catRed; } },
};

// Fixed slot order per category (never reorder — that's what keeps the
// validated adjacent-CVD guarantee from color-formula.md intact).
const CATEGORY_COLOR_KEY = {
  cash: "catBlue", gold: "catOrange", insurance: "catAqua", stock: "catYellow",
  realestate: "catMagenta", business: "catGreen", crypto: "catViolet", other: "catRed",
};
function categoryColor(category) { return C[CATEGORY_COLOR_KEY[category]] || C.catRed; }

const CATEGORIES = {
  cash: { label: "Tiền mặt & Tiết kiệm", icon: Wallet, tier: 1, syncable: true },
  gold: { label: "Vàng", icon: Coins, tier: 1, syncable: false },
  insurance: { label: "Bảo hiểm (giá trị hoàn lại)", icon: Shield, tier: 1, syncable: false },
  stock: { label: "Cổ phiếu / CCQ", icon: TrendingUp, tier: 2, syncable: true },
  realestate: { label: "Bất động sản", icon: Home, tier: 2, syncable: false },
  business: { label: "Tài sản doanh nghiệp", icon: Building2, tier: 3, syncable: false },
  crypto: { label: "Crypto", icon: Bitcoin, tier: 4, syncable: false },
  other: { label: "Khác", icon: DollarSign, tier: 3, syncable: false },
};

const INSTITUTIONS = [
  { id: "vcb", name: "Vietcombank", type: "bank" },
  { id: "tcb", name: "Techcombank", type: "bank" },
  { id: "bidv", name: "BIDV", type: "bank" },
  { id: "vnd", name: "VNDIRECT", type: "brokerage" },
  { id: "ssi", name: "SSI", type: "brokerage" },
  { id: "tcbs", name: "TCBS", type: "brokerage" },
];

const ADVISORS = [
  { id: "a1", name: "Nguyễn Minh Anh", title: "Cố vấn tài chính cá nhân", level: "Cơ bản", specialties: ["Lập kế hoạch tài chính", "Ngân sách"], rate: 600000, rating: 4.7, reviews: 58 },
  { id: "a2", name: "Trần Quốc Bảo, CFA", title: "Chuyên gia đầu tư", level: "Chuyên sâu", specialties: ["Chứng khoán", "Phân bổ tài sản"], rate: 2200000, rating: 4.9, reviews: 121 },
  { id: "a3", name: "Lê Thị Hồng", title: "Chuyên gia bất động sản & tín dụng", level: "Chuyên sâu", specialties: ["Bất động sản", "Vay ngân hàng"], rate: 1500000, rating: 4.8, reviews: 76 },
  { id: "a4", name: "Phạm Đức Huy", title: "Chuyên gia thuế & pháp lý tài sản", level: "Chuyên sâu", specialties: ["Thuế TNCN", "Thừa kế"], rate: 1800000, rating: 4.6, reviews: 34 },
  { id: "a5", name: "Đỗ Thu Trang", title: "Cố vấn hưu trí & bảo hiểm", level: "Vừa", specialties: ["Hưu trí", "Bảo hiểm"], rate: 900000, rating: 4.7, reviews: 45 },
];

/* --------------------------------- HELPERS --------------------------------- */
const fmt = (n) => {
  if (n === "" || n === null || n === undefined || isNaN(n)) return "0";
  const num = Number(n); const abs = Math.abs(num);
  if (abs >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + " tỷ";
  if (abs >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
  return num.toLocaleString("vi-VN");
};
const fmtFull = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " đ";
const genId = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthsAgoStr = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10); };
const yearsAheadStr = (n) => { const d = new Date(); d.setFullYear(d.getFullYear() + n); return d.toISOString().slice(0, 10); };
const monthLabel = (dateStr) => { const d = new Date(dateStr); return `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`; };

function amortizedPayment(principal, annualRatePct, termMonths) {
  const P = Number(principal) || 0; const n = Number(termMonths) || 0;
  const r = (Number(annualRatePct) || 0) / 100 / 12;
  if (n <= 0 || P <= 0) return 0;
  if (r === 0) return P / n;
  const factor = Math.pow(1 + r, n);
  return (P * r * factor) / (factor - 1);
}
function liabilityMonthlyPayment(l) {
  if (l.monthlyPayment && Number(l.monthlyPayment) > 0) return Number(l.monthlyPayment);
  if (l.termMonths && Number(l.termMonths) > 0) return amortizedPayment(l.balance, l.interestRate, l.termMonths);
  return 0;
}
function isLiabilityStressable(l) {
  return !(l.monthlyPayment && Number(l.monthlyPayment) > 0) && l.termMonths && Number(l.termMonths) > 0;
}
function sumLiquidAssets(assets) {
  return assets.reduce((s, a) => (Number(a.tierOverride || CATEGORIES[a.category]?.tier || 3) === 1 ? s + (Number(a.value) || 0) : s), 0);
}
function dtiBand(dti) {
  if (dti <= 36) return { label: "Lành mạnh", color: C.success };
  if (dti <= 43) return { label: "Cần thận trọng", color: C.statusWarning };
  return { label: "Rủi ro cao", color: C.danger };
}
function runwayBand(months) {
  if (months >= 6) return { label: "An toàn", color: C.success };
  if (months >= 3) return { label: "Chấp nhận được", color: C.statusWarning };
  return { label: "Mỏng, rủi ro thanh khoản", color: C.danger };
}
function cagr(history) {
  const pts = history.filter((h) => h.netWorth > 0);
  if (pts.length < 2) return null;
  const first = pts[0], last = pts[pts.length - 1];
  const months = Math.max(1, (new Date(last.date) - new Date(first.date)) / (30.44 * 86400000));
  if (first.netWorth <= 0) return null;
  return (Math.pow(last.netWorth / first.netWorth, 12 / months) - 1) * 100;
}

/* ---- Standard finance: present/future value, NPV of an annuity ---- */
function presentValue(futureValue, annualRatePct, years) {
  const r = (Number(annualRatePct) || 0) / 100;
  return futureValue / Math.pow(1 + r, Math.max(0, years));
}
function futureValue(pv, annualRatePct, years) {
  const r = (Number(annualRatePct) || 0) / 100;
  return pv * Math.pow(1 + r, Math.max(0, years));
}
// NPV of a level monthly payment stream (annuity) discounted at annualRatePct
function npvOfAnnuity(monthlyPayment, annualRatePct, termMonths) {
  const r = (Number(annualRatePct) || 0) / 100 / 12;
  const n = Number(termMonths) || 0;
  if (n <= 0) return 0;
  if (r === 0) return monthlyPayment * n;
  return monthlyPayment * ((1 - Math.pow(1 + r, -n)) / r);
}

/* ---- Investment performance ---- */
function assetPerformance(a) {
  const value = Number(a.value) || 0; const cost = Number(a.costBasis) || 0;
  if (!cost) return null;
  const totalReturnPct = ((value - cost) / cost) * 100;
  let annualizedPct = null;
  if (a.purchasedAt) {
    const days = Math.max(1, (new Date() - new Date(a.purchasedAt)) / 86400000);
    annualizedPct = (Math.pow(value / cost, 365 / days) - 1) * 100;
  }
  return { totalReturnPct, annualizedPct, gain: value - cost };
}

/* ---- Advisor recommendation rule engine ---- */
function computeAdvisorRecommendations({ assets, liabilities, goals, alerts }) {
  const reasons = {};
  const distinctCats = new Set(assets.map((a) => a.category));
  const stockAssets = assets.filter((a) => a.category === "stock");
  const stockLoss = stockAssets.some((a) => a.costBasis && Number(a.value) < Number(a.costBasis) * 0.9);
  const totalAssets = assets.reduce((s, a) => s + (Number(a.value) || 0), 0) || 1;
  const stockConcentration = (stockAssets.reduce((s, a) => s + (Number(a.value) || 0), 0) / totalAssets) * 100;
  const hasDtiAlert = alerts.some((al) => al.id === "dti-high" || al.id.startsWith("rate-") || al.id.startsWith("due-"));
  const hasRealEstate = assets.some((a) => a.category === "realestate");
  const hasRetirementGoal = goals.some((g) => /nghỉ hưu|hưu trí|retirement/i.test(g.name || ""));
  const highValueTaxable = assets.some((a) => a.category === "realestate" || a.category === "stock") && totalAssets > 2000000000;

  if (stockLoss || stockConcentration > 35) reasons["a2"] = stockLoss ? "Danh mục cổ phiếu đang lỗ trên 10% so với vốn gốc" : `Tỷ trọng cổ phiếu đang tập trung ~${stockConcentration.toFixed(0)}% tổng tài sản`;
  if (hasDtiAlert || (hasRealEstate && liabilities.length > 0)) reasons["a3"] = hasDtiAlert ? "Đang có cảnh báo liên quan đến nợ vay/DTI" : "Có bất động sản đang vay, phù hợp rà soát cấu trúc tín dụng";
  if (highValueTaxable) reasons["a4"] = "Tổng tài sản lớn và có BĐS/cổ phiếu — nên rà soát nghĩa vụ thuế khi hiện thực hóa lợi nhuận";
  if (hasRetirementGoal) reasons["a5"] = "Đang có mục tiêu nghỉ hưu trong kế hoạch";
  if (distinctCats.size >= 4 && !reasons["a1"]) reasons["a1"] = "Danh mục tài sản đa dạng, phù hợp rà soát tổng thể định kỳ";
  return reasons;
}

/* ---- Deterministic profile summary (rule-based, not AI) ---- */
function buildProfileSummary({ netWorth, growth, tierTotals, backEndDTI, liquidityRunway, goals, alerts, hasIncome }) {
  const total = Object.values(tierTotals).reduce((a, b) => a + b, 0) || 1;
  const safePct = (tierTotals[1] / total) * 100, specPct = (tierTotals[4] / total) * 100;
  const dti = dtiBand(backEndDTI), runway = runwayBand(liquidityRunway);
  const onTrackGoals = goals.filter((g) => {
    const now = new Date(); const target = new Date(g.targetDate);
    const monthsLeft = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
    const r = (Number(g.annualReturn) || 8) / 100 / 12; const contrib = Number(g.monthlyContribution) || 0; const current = Number(g.currentAmount) || 0;
    const fv = current * Math.pow(1 + r, monthsLeft) + contrib * ((Math.pow(1 + r, monthsLeft) - 1) / (r || 0.0001)) * (1 + r);
    return fv >= Number(g.targetAmount) * 0.95;
  }).length;

  const lines = [];
  lines.push(`Tài sản ròng hiện tại ${fmtFull(netWorth)}${growth !== null ? `, tăng trưởng ~${growth.toFixed(1)}%/năm gần đây` : ""}.`);
  lines.push(`Cơ cấu rủi ro: ${safePct.toFixed(0)}% an toàn, ${specPct.toFixed(0)}% đầu cơ${safePct > 40 ? " — thiên về thận trọng" : specPct > 20 ? " — thiên về rủi ro" : " — khá cân bằng"}.`);
  if (hasIncome) lines.push(`DTI ở mức ${dti.label.toLowerCase()} (${backEndDTI.toFixed(0)}%), quỹ thanh khoản ${runway.label.toLowerCase()} (${liquidityRunway.toFixed(1)} tháng).`);
  if (goals.length > 0) lines.push(`${onTrackGoals}/${goals.length} mục tiêu đang đúng tiến độ theo dự phóng hiện tại.`);
  lines.push(alerts.length > 0 ? `${alerts.length} cảnh báo đang mở, cần rà soát.` : "Không có cảnh báo nào đang mở.");
  return lines;
}


/* ---- mock data seed (used only if storage is empty — simulates a populated demo) ---- */
function seedMockData() {
  const accounts = [
    { id: "acc1", institutionId: "vcb", name: "VCB - Tài khoản thanh toán", type: "bank", lastSynced: todayStr(), status: "connected" },
    { id: "acc2", institutionId: "tcb", name: "TCB - Sổ tiết kiệm 12 tháng", type: "bank", lastSynced: todayStr(), status: "connected" },
    { id: "acc3", institutionId: "vnd", name: "VNDIRECT - Tài khoản chứng khoán", type: "brokerage", lastSynced: todayStr(), status: "connected" },
  ];
  const assets = [
    { id: genId(), category: "cash", name: "VCB - Tài khoản thanh toán", value: 85000000, costBasis: "", accountId: "acc1", source: "synced", updatedAt: todayStr(), note: "" },
    { id: genId(), category: "cash", name: "TCB - Sổ tiết kiệm 12 tháng", value: 450000000, costBasis: "", accountId: "acc2", source: "synced", updatedAt: todayStr(), note: "Lãi suất 5.8%/năm" },
    { id: genId(), category: "stock", name: "VNDIRECT - Danh mục cổ phiếu", value: 320000000, costBasis: 280000000, accountId: "acc3", source: "synced", updatedAt: todayStr(), note: "", purchasedAt: monthsAgoStr(14) },
    { id: genId(), category: "gold", name: "Vàng SJC tích lũy", value: 120000000, costBasis: 95000000, source: "manual", updatedAt: todayStr(), note: "", purchasedAt: monthsAgoStr(20) },
    { id: genId(), category: "realestate", name: "Căn hộ Đà Nẵng (cho thuê)", value: 2800000000, costBasis: 2400000000, source: "manual", updatedAt: todayStr(), note: "Cho thuê 12tr/tháng" },
    { id: genId(), category: "insurance", name: "Bảo hiểm nhân thọ - giá trị hoàn lại", value: 60000000, costBasis: "", source: "manual", updatedAt: todayStr(), note: "" },
    { id: genId(), category: "crypto", name: "Ví BTC/ETH", value: 45000000, costBasis: 38000000, source: "manual", updatedAt: todayStr(), note: "", purchasedAt: monthsAgoStr(9) },
    { id: genId(), category: "business", name: "Cổ phần công ty gia đình", value: 180000000, costBasis: 150000000, source: "manual", updatedAt: todayStr(), note: "", purchasedAt: monthsAgoStr(18) },
  ];
  const liabilities = [
    { id: genId(), name: "Vay mua nhà VCB", balance: 1600000000, interestRate: 12.5, termMonths: 180, dueDate: "", accountId: "acc1", note: "" },
  ];
  const transactions = [6, 5, 4, 3, 2, 1, 0].map((m) => ({
    month: monthsAgoStr(m).slice(0, 7),
    income: 42000000 + Math.round((Math.random() - 0.3) * 3000000),
    expense: 24000000 + Math.round((Math.random() - 0.3) * 2500000),
  }));
  const netWorthHistory = [6, 5, 4, 3, 2, 1].map((m, i) => {
    const growth = i * 0.012;
    const assetsVal = Math.round(3550000000 * (1 + growth));
    const liabVal = Math.round(1680000000 - i * 12000000);
    return { date: monthsAgoStr(m), assets: assetsVal, liabilities: liabVal, netWorth: assetsVal - liabVal };
  });
  const totalAssetsNow = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabNow = liabilities.reduce((s, l) => s + l.balance, 0);
  netWorthHistory.push({ date: todayStr(), assets: totalAssetsNow, liabilities: totalLiabNow, netWorth: totalAssetsNow - totalLiabNow });

  const goals = [
    { id: genId(), name: "Quỹ nghỉ hưu", targetAmount: 8000000000, targetDate: yearsAheadStr(20), currentAmount: 600000000, monthlyContribution: 15000000, annualReturn: 8 },
    { id: genId(), name: "Mua thêm BĐS đầu tư", targetAmount: 1200000000, targetDate: yearsAheadStr(3), currentAmount: 200000000, monthlyContribution: 20000000, annualReturn: 6 },
  ];
  return { accounts, assets, liabilities, transactions, netWorthHistory, goals };
}

/* ------------------------------ SMALL UI PARTS ------------------------------ */
function Card({ children, style }) {
  return <div className="rounded-2xl p-4 sm:p-5" style={{ background: C.bgPanel, border: `1px solid ${C.border}`, ...style }}>{children}</div>;
}
function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        {eyebrow && <div className="text-xs uppercase mb-1" style={{ color: C.accent, letterSpacing: "0.15em" }}>{eyebrow}</div>}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text, fontSize: 24, fontWeight: 600 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}
function SimpleTitle({ title, action }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text, fontSize: 19, fontWeight: 600 }}>{title}</h2>
      {action}
    </div>
  );
}
function GoldButton({ children, onClick, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
      style={{ background: disabled ? C.borderLight : `linear-gradient(135deg, ${C.accent}, ${C.accentText})`, color: disabled ? C.textFaint : C.onAccent, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer", ...style }}>
      {children}
    </button>
  );
}
function GhostButton({ children, onClick, style }) {
  return <button onClick={onClick} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium" style={{ background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textMuted, ...style }}>{children}</button>;
}
function Field({ label, children }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs" style={{ color: C.textMuted }}>{label}</label>{children}</div>;
}
function inputStyle() { return { background: C.bg, border: `1px solid ${C.borderLight}`, color: C.text, borderRadius: 10, padding: "9px 12px", fontSize: 14, outline: "none", width: "100%" }; }
function TextInput(props) { return <input {...props} style={{ ...inputStyle(), ...(props.style || {}) }} />; }
function TextArea(props) { return <textarea {...props} style={{ ...inputStyle(), fontFamily: "inherit", ...(props.style || {}) }} />; }
function Select(props) { return <select {...props} style={{ ...inputStyle(), ...(props.style || {}) }} />; }
function EmptyState({ text }) { return <div className="flex flex-col items-center justify-center py-10 text-center"><div style={{ color: C.textFaint, fontSize: 13 }}>{text}</div></div>; }
function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,6,13,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.bgPanel2, border: `1px solid ${C.borderLight}`, borderRadius: 18, padding: 22, width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.textMuted }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------- GLOSSARY / TERMS -------------------------------- */
const TERMS = {
  dti: { term: "DTI (Debt-to-Income)", def: "Tỷ lệ giữa tổng số tiền trả nợ hàng tháng và thu nhập hàng tháng. Theo chuẩn 28/36 phổ biến trong thẩm định vay: DTI ≤36% được xem là lành mạnh, 36-43% cần thận trọng, trên 43% là vùng rủi ro cao khi vay thêm." },
  runway: { term: "Quỹ thanh khoản (Liquidity Runway)", def: "Số tháng chi tiêu mà tài sản thanh khoản cao (tiền mặt, tiết kiệm, vàng...) có thể trang trải nếu mất nguồn thu nhập. Chuẩn phổ biến khuyến nghị duy trì 3-6 tháng chi tiêu." },
  cagr: { term: "CAGR (Tốc độ tăng trưởng kép hàng năm)", def: "Tốc độ tăng trưởng trung bình mỗi năm của một khoản đầu tư hoặc tài sản ròng, tính theo lãi kép, dựa trên giá trị đầu kỳ và cuối kỳ." },
  npv: { term: "NPV (Net Present Value - Giá trị hiện tại ròng)", def: "Quy đổi một dòng tiền trong tương lai về giá trị tương đương ở hiện tại, bằng cách chiết khấu theo một lãi suất giả định. Dùng để so sánh chi phí/lợi ích xảy ra ở các thời điểm khác nhau trên cùng một mặt bằng." },
  pv_fv: { term: "PV & FV (Giá trị hiện tại & Giá trị tương lai)", def: "PV (Present Value) là giá trị quy đổi về hôm nay của một khoản tiền trong tương lai. FV (Future Value) là giá trị một khoản tiền hôm nay sẽ đạt được trong tương lai nếu tăng trưởng theo một lãi suất giả định (lãi kép)." },
  amortization: { term: "Khấu hao khoản vay (Amortization)", def: "Cách tính khoản trả góp cố định hàng tháng cho một khoản vay, sao cho đến cuối kỳ hạn thì cả gốc và lãi được trả hết." },
  tier: { term: "Tháp tài sản / Phân tầng rủi ro", def: "Cách phân loại tài sản theo mức độ rủi ro: An toàn (tiền mặt, vàng, bảo hiểm) → Ổn định tăng trưởng (CK/CCQ, BĐS) → Tăng trưởng cao → Đầu cơ (crypto...)." },
  savingsrate: { term: "Tỷ lệ tiết kiệm (Savings Rate)", def: "Phần trăm thu nhập còn lại sau khi trừ chi tiêu và trả nợ. Quy tắc 50/30/20 khuyến nghị tiết kiệm tối thiểu 20% thu nhập." },
};

function InfoTag({ termKey }) {
  const t = TERMS[termKey];
  if (!t) return null;
  return (
    <span className="relative inline-flex group" style={{ verticalAlign: "middle", marginLeft: 4 }}>
      <Info size={13} color={C.textFaint} style={{ cursor: "help" }} />
      <span className="absolute bottom-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 pointer-events-none"
        style={{ left: "50%", transform: "translateX(-50%)", marginBottom: 6, width: 230, background: C.bgPanel2, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "8px 10px", boxShadow: "0 6px 18px rgba(0,0,0,0.18)", zIndex: 50 }}>
        <span className="block" style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 3 }}>{t.term}</span>
        <span className="block" style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, whiteSpace: "normal" }}>{t.def}</span>
      </span>
    </span>
  );
}

/* -------------------------------- BOTTOM NAV -------------------------------- */
function BottomNav({ tabs, tab, setTab }) {
  const idx = Math.max(0, tabs.findIndex((t) => t.id === tab));
  const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
  const next = tabs[(idx + 1) % tabs.length];
  return (
    <div className="flex items-center justify-between gap-2">
      <button onClick={() => setTab(prev.id)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm min-w-0"
        style={{ background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textMuted }}>
        <ChevronLeft size={15} style={{ flexShrink: 0 }} /> <span className="truncate">{prev.label}</span>
      </button>
      <button onClick={() => setTab(next.id)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm min-w-0"
        style={{ background: "transparent", border: `1px solid ${C.borderLight}`, color: C.textMuted }}>
        <span className="truncate">{next.label}</span> <ChevronRight size={15} style={{ flexShrink: 0 }} />
      </button>
    </div>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Lên đầu trang"
      style={{ position: "fixed", right: 18, bottom: 18, width: 46, height: 46, borderRadius: "50%", background: C.accent, color: C.onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", border: "none", cursor: "pointer", zIndex: 40 }}>
      <ArrowUp size={20} />
    </button>
  );
}

/* --------------------------------- APP --------------------------------- */
export default function WealthCompass() {
  const [tab, setTab] = useState("alerts");
  const [loaded, setLoaded] = useState(false);
  const [themeMode, setThemeMode] = useState("light");
  useEffect(() => { window.scrollTo(0, 0); }, [tab]);
  Object.assign(C, themeMode === "light" ? LIGHT_THEME : DARK_THEME);

  const [accounts, setAccounts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [alertSettings, setAlertSettings] = useState({
    safeMax: 40, speculativeMax: 20, highRatePct: 12, dtiMax: 43, runwayMin: 3,
    concentrationMax: 30, drawdownMax: 15,
    enabled: { safe: true, speculative: true, cashflow: true, rate: true, due: true, milestone: true, dti: true, runway: true, concentration: true, drawdown: true },
  });
  const [simSettings, setSimSettings] = useState({ defaultRate: 11, defaultTermYears: 20, defaultDownPct: 30, defaultGoalReturn: 8, unitFormat: "compact" });
  const [dashboardSections, setDashboardSections] = useState(DEFAULT_DASHBOARD_SECTIONS);

  /* ---- load or seed ---- */
  useEffect(() => {
    (async () => {
      try {
        const core = await window.storage.get("wealth-core").catch(() => null);
        if (core?.value) {
          const d = JSON.parse(core.value);
          setAccounts(d.accounts || []); setAssets(d.assets || []); setLiabilities(d.liabilities || []);
          setTransactions(d.transactions || []); setGoals(d.goals || []); setNetWorthHistory(d.netWorthHistory || []);
        } else {
          const seed = seedMockData();
          setAccounts(seed.accounts); setAssets(seed.assets); setLiabilities(seed.liabilities);
          setTransactions(seed.transactions); setGoals(seed.goals); setNetWorthHistory(seed.netWorthHistory);
          await window.storage.set("wealth-core", JSON.stringify(seed), false).catch(() => {});
        }
        const s1 = await window.storage.get("alert-settings").catch(() => null);
        if (s1?.value) { const saved = JSON.parse(s1.value); setAlertSettings((prev) => ({ ...prev, ...saved, enabled: { ...prev.enabled, ...saved.enabled } })); }
        const s2 = await window.storage.get("sim-settings").catch(() => null);
        if (s2?.value) setSimSettings(JSON.parse(s2.value));
        const s3 = await window.storage.get("chat-history").catch(() => null);
        if (s3?.value) setChatMessages(JSON.parse(s3.value));
        const s4 = await window.storage.get("bookings").catch(() => null);
        if (s4?.value) setBookings(JSON.parse(s4.value));
        const s5 = await window.storage.get("theme-mode").catch(() => null);
        if (s5?.value) setThemeMode(JSON.parse(s5.value));
        const s6 = await window.storage.get("dashboard-sections").catch(() => null);
        if (s6?.value) setDashboardSections({ ...DEFAULT_DASHBOARD_SECTIONS, ...JSON.parse(s6.value) });
      } catch (e) { console.error(e); }
      setLoaded(true);
    })();
  }, []);

  const persistCore = (patch) => {
    const data = { accounts, assets, liabilities, transactions, goals, netWorthHistory, ...patch };
    window.storage.set("wealth-core", JSON.stringify(data), false).catch(() => {});
  };
  useEffect(() => { if (loaded) persistCore({ accounts, assets, liabilities }); /* eslint-disable-next-line */ }, [accounts, liabilities, accounts.length]);
  useEffect(() => { if (loaded) persistCore({ goals }); /* eslint-disable-next-line */ }, [goals]);
  useEffect(() => { if (loaded) window.storage.set("alert-settings", JSON.stringify(alertSettings), false).catch(() => {}); }, [alertSettings, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sim-settings", JSON.stringify(simSettings), false).catch(() => {}); }, [simSettings, loaded]);
  useEffect(() => { if (loaded) window.storage.set("chat-history", JSON.stringify(chatMessages.slice(-40)), false).catch(() => {}); }, [chatMessages, loaded]);
  useEffect(() => { if (loaded) window.storage.set("bookings", JSON.stringify(bookings), false).catch(() => {}); }, [bookings, loaded]);
  useEffect(() => { if (loaded) window.storage.set("theme-mode", JSON.stringify(themeMode), false).catch(() => {}); }, [themeMode, loaded]);
  useEffect(() => { if (loaded) window.storage.set("dashboard-sections", JSON.stringify(dashboardSections), false).catch(() => {}); }, [dashboardSections, loaded]);

  /* ---- derived ---- */
  const totalAssets = assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + (Number(l.balance) || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const tierTotals = { 1: 0, 2: 0, 3: 0, 4: 0 };
  assets.forEach((a) => { const t = a.tierOverride || CATEGORIES[a.category]?.tier || 3; tierTotals[t] += Number(a.value) || 0; });
  const allocation = Object.entries(assets.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + (Number(a.value) || 0); return acc; }, {}))
    .map(([cat, value]) => ({ name: CATEGORIES[cat]?.label || cat, value, color: categoryColor(cat) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // auto cashflow from connected-account transactions (mock), avg last 3 months
  const recentTx = transactions.slice(-3);
  const monthlyIncome = recentTx.length ? recentTx.reduce((s, t) => s + t.income, 0) / recentTx.length : 0;
  const monthlyExpense = recentTx.length ? recentTx.reduce((s, t) => s + t.expense, 0) / recentTx.length : 0;

  const totalMonthlyDebtService = liabilities.reduce((s, l) => s + liabilityMonthlyPayment(l), 0);
  const backEndDTI = monthlyIncome > 0 ? (totalMonthlyDebtService / monthlyIncome) * 100 : 0;
  const liquidAssets = sumLiquidAssets(assets);
  const liquidityRunway = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 0;
  const netCashflow = monthlyIncome - monthlyExpense - totalMonthlyDebtService;

  /* ---- snapshot net worth history daily (3 series) ---- */
  useEffect(() => {
    if (!loaded) return;
    const today = todayStr();
    setNetWorthHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.date === today) {
        if (last.netWorth === netWorth && last.assets === totalAssets && last.liabilities === totalLiabilities) return prev;
        const copy = [...prev]; copy[copy.length - 1] = { date: today, assets: totalAssets, liabilities: totalLiabilities, netWorth };
        persistCore({ netWorthHistory: copy.slice(-120) });
        return copy;
      }
      const next = [...prev, { date: today, assets: totalAssets, liabilities: totalLiabilities, netWorth }].slice(-120);
      persistCore({ netWorthHistory: next });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netWorth, totalAssets, totalLiabilities, loaded]);

  const alerts = computeAlerts({ liabilities, goals, tierTotals, alertSettings, backEndDTI, liquidityRunway, netCashflow, hasIncome: monthlyIncome > 0, hasExpense: monthlyExpense > 0, assets, totalAssets, netWorth, netWorthHistory });
  const reminders = computeReminders({ goals, liabilities, assets });

  const tabs = [
    { id: "alerts", label: "Cảnh báo", icon: Bell },
    { id: "dashboard", label: "Tổng quan", icon: Compass },
    { id: "assets", label: "Tài sản", icon: Wallet },
    { id: "goals", label: "Mục tiêu", icon: Target },
    { id: "advisor", label: "Cố vấn", icon: MessageCircle },
    { id: "simulator", label: "Mô phỏng", icon: TrendingUp },
    { id: "settings", label: "Cấu hình", icon: Settings },
  ];

  const syncAccount = (accId) => {
    setAccounts((prev) => prev.map((a) => (a.id === accId ? { ...a, lastSynced: todayStr() } : a)));
    setAssets((prev) => prev.map((a) => (a.accountId === accId ? { ...a, value: Math.round(a.value * (1 + (Math.random() - 0.45) * 0.02)), updatedAt: todayStr() } : a)));
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-thumb { background: ${C.borderLight}; border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform:translateY(0);} }
        .fade-in { animation: fadeIn 0.35s ease-out; }
      `}</style>

      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.headerBg, position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(8px)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-y-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentSoft}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Compass size={18} color={C.text} />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-xl truncate" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, lineHeight: 1.2 }}>WEALTH MANAGEMENT</div>
              <div style={{ fontSize: 10, color: C.textFaint, letterSpacing: "0.1em" }}>Quản Lý Gia Sản</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button onClick={() => setThemeMode((m) => (m === "dark" ? "light" : "dark"))} title="Đổi giao diện sáng/tối"
              style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.borderLight}`, background: C.bgPanel2, color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="text-right">
              <div style={{ fontSize: 11, color: C.textMuted }}>Tài sản ròng</div>
              <div className="text-sm sm:text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: C.accentText }}>{fmtFull(netWorth)}</div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-5 flex gap-1 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm whitespace-nowrap"
              style={{ background: tab === t.id ? C.bgPanel2 : "transparent", color: tab === t.id ? C.accentText : C.textMuted, border: tab === t.id ? `1px solid ${C.borderLight}` : "1px solid transparent" }}>
              <t.icon size={15} />{t.label}
              {t.id === "alerts" && alerts.length > 0 && <span style={{ background: C.danger, color: "#fff", fontSize: 10, borderRadius: 999, padding: "1px 6px" }}>{alerts.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-5 py-4 sm:py-6">
        {!loaded ? (
          <div className="flex items-center justify-center py-24" style={{ color: C.textMuted }}><Loader2 className="animate-spin mr-2" size={18} /> Đang tải dữ liệu...</div>
        ) : (
          <div className="fade-in">
            {tab === "alerts" && <AlertsOverviewTab alerts={alerts} reminders={reminders} />}
            {tab === "dashboard" && (
              <Dashboard
                totalAssets={totalAssets} totalLiabilities={totalLiabilities} netWorth={netWorth}
                allocation={allocation} tierTotals={tierTotals} netWorthHistory={netWorthHistory}
                backEndDTI={backEndDTI} liquidityRunway={liquidityRunway} liquidAssets={liquidAssets}
                totalMonthlyDebtService={totalMonthlyDebtService} monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense}
                netCashflow={netCashflow} goals={goals} alerts={alerts} assets={assets}
                dashboardSections={dashboardSections}
              />
            )}
            {tab === "assets" && (
              <AssetsTab assets={assets} setAssets={setAssets} liabilities={liabilities} setLiabilities={setLiabilities}
                accounts={accounts} setAccounts={setAccounts} onSync={syncAccount} />
            )}
            {tab === "goals" && (
              <GoalsTab goals={goals} setGoals={setGoals} netWorth={netWorth} netCashflow={netCashflow}
                netWorthHistory={netWorthHistory} defaultReturn={simSettings.defaultGoalReturn} />
            )}
            {tab === "advisor" && (
              <AdvisorTab messages={chatMessages} setMessages={setChatMessages} bookings={bookings} setBookings={setBookings}
                recommendations={computeAdvisorRecommendations({ assets, liabilities, goals, alerts })}
                snapshot={{ totalAssets, totalLiabilities, netWorth, allocation, tierTotals, monthlyIncome, monthlyExpense, goals, assets, liabilities }} />
            )}
            {tab === "simulator" && (
              <SimulatorTab liabilities={liabilities} liquidAssets={liquidAssets} totalMonthlyDebtService={totalMonthlyDebtService}
                monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense} simSettings={simSettings}
                goals={goals} allocation={allocation} netWorth={netWorth} />
            )}
            {tab === "settings" && (
              <SettingsTab alertSettings={alertSettings} setAlertSettings={setAlertSettings} simSettings={simSettings} setSimSettings={setSimSettings}
                dashboardSections={dashboardSections} setDashboardSections={setDashboardSections} />
            )}
            <div className="mt-5">
              <BottomNav tabs={tabs} tab={tab} setTab={setTab} />
            </div>
          </div>
        )}
      </div>
      <ScrollToTopButton />
    </div>
  );
}

/* -------------------------------- ALERT ENGINE -------------------------------- */
function computeAlerts({ liabilities, goals, tierTotals, alertSettings, backEndDTI, liquidityRunway, netCashflow, hasIncome, hasExpense, assets, totalAssets, netWorth, netWorthHistory }) {
  const list = [];
  const total = Object.values(tierTotals).reduce((a, b) => a + b, 0) || 1;
  const safePct = (tierTotals[1] / total) * 100;
  const specPct = (tierTotals[4] / total) * 100;
  const s = alertSettings;

  if (s.enabled.safe && total > 0 && safePct > s.safeMax) list.push({ id: "safe-high", level: "warn", title: "Tỷ trọng an toàn đang cao", detail: `${safePct.toFixed(0)}% tài sản nằm ở nhóm an toàn, vượt ngưỡng ${s.safeMax}%. Phần vốn này có thể tăng trưởng chậm hơn lạm phát.` });
  if (s.enabled.speculative && total > 0 && specPct > s.speculativeMax) list.push({ id: "spec-high", level: "danger", title: "Tỷ trọng đầu cơ vượt ngưỡng", detail: `${specPct.toFixed(0)}% tài sản ở nhóm đầu cơ, vượt ngưỡng ${s.speculativeMax}%. Nên rà soát mức độ phù hợp với khẩu vị rủi ro.` });
  if (s.enabled.rate) liabilities.forEach((l) => { if (Number(l.interestRate) >= s.highRatePct) list.push({ id: `rate-${l.id}`, level: "warn", title: `Lãi suất "${l.name}" khá cao`, detail: `${l.interestRate}%/năm, vượt ngưỡng ${s.highRatePct}%. Cân nhắc trả sớm hoặc tái cấu trúc.` }); });
  if (s.enabled.due) { const now = new Date(); liabilities.forEach((l) => { if (!l.dueDate) return; const days = Math.ceil((new Date(l.dueDate) - now) / 86400000); if (days >= 0 && days <= 30) list.push({ id: `due-${l.id}`, level: "warn", title: `"${l.name}" sắp đến hạn`, detail: `Còn khoảng ${days} ngày (${l.dueDate}). Chuẩn bị dòng tiền hoặc phương án tái cấu trúc.` }); }); }
  if (s.enabled.cashflow && hasIncome && netCashflow < 0) list.push({ id: "cashflow-neg", level: "danger", title: "Dòng tiền hàng tháng đang âm", detail: `Chi tiêu + trả nợ đang vượt thu nhập khoảng ${fmt(Math.abs(netCashflow))}/tháng (tính tự động từ tài khoản kết nối).` });
  if (s.enabled.dti && hasIncome && backEndDTI > s.dtiMax) list.push({ id: "dti-high", level: backEndDTI > 50 ? "danger" : "warn", title: "DTI (trả nợ / thu nhập) đang cao", detail: `Khoảng ${backEndDTI.toFixed(0)}% thu nhập dùng để trả nợ, vượt ngưỡng ${s.dtiMax}%. Theo chuẩn 28/36, trên 43% là vùng rủi ro cao khi vay thêm.` });
  if (s.enabled.runway && hasExpense && liquidityRunway < s.runwayMin) list.push({ id: "runway-low", level: liquidityRunway < 1.5 ? "danger" : "warn", title: "Quỹ thanh khoản mỏng", detail: `Tài sản thanh khoản cao chỉ đủ ${liquidityRunway.toFixed(1)} tháng chi tiêu, dưới ngưỡng ${s.runwayMin} tháng. Chuẩn phổ biến khuyến nghị 3-6 tháng.` });
  if (s.enabled.milestone) goals.forEach((g) => {
    if (!g.targetDate || !g.targetAmount) return;
    const now = new Date(); const target = new Date(g.targetDate);
    const monthsLeft = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
    const r = (Number(g.annualReturn) || 8) / 100 / 12; const contrib = Number(g.monthlyContribution) || 0; const current = Number(g.currentAmount) || 0;
    const fv = current * Math.pow(1 + r, monthsLeft) + contrib * ((Math.pow(1 + r, monthsLeft) - 1) / (r || 0.0001)) * (1 + r);
    if (monthsLeft > 0 && fv < Number(g.targetAmount) * 0.9) list.push({ id: `goal-${g.id}`, level: "warn", title: `Mục tiêu "${g.name}" có thể chậm tiến độ`, detail: `Dự phóng đạt ${fmt(fv)} vào ${g.targetDate}, thấp hơn mục tiêu ${fmt(g.targetAmount)}. Cân nhắc tăng đóng góp hoặc dời thời hạn.` });
  });
  if (s.enabled.concentration && totalAssets > 0) {
    const biggest = [...assets].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
    if (biggest) { const pct = ((Number(biggest.value) || 0) / totalAssets) * 100; if (pct > s.concentrationMax) list.push({ id: "concentration-high", level: pct > 60 ? "danger" : "warn", title: `Tài sản đang tập trung nhiều vào "${biggest.name}"`, detail: `Khoản này chiếm ${pct.toFixed(0)}% tổng tài sản, vượt ngưỡng ${s.concentrationMax}%. Rủi ro tập trung cao nếu giá trị tài sản này biến động mạnh.` }); }
  }
  if (s.enabled.drawdown && netWorthHistory.length >= 2) {
    const peak = Math.max(...netWorthHistory.map((h) => h.netWorth));
    if (peak > 0) { const drawdownPct = ((peak - netWorth) / peak) * 100; if (drawdownPct > s.drawdownMax) list.push({ id: "drawdown-high", level: drawdownPct > 25 ? "danger" : "warn", title: "Tài sản ròng đang giảm so với đỉnh gần đây", detail: `Đang thấp hơn ${drawdownPct.toFixed(0)}% so với đỉnh ${fmt(peak)}, vượt ngưỡng ${s.drawdownMax}%.` }); }
  }
  return list;
}

/* -------------------------------- REMINDER ENGINE (separate from Risk) -------------------------------- */
function computeReminders({ goals, liabilities, assets }) {
  const list = [];
  const now = new Date();

  // upcoming loan maturity heads-up, before it becomes an urgent Risk alert (31-90 days out)
  liabilities.forEach((l) => {
    if (!l.dueDate) return;
    const days = Math.ceil((new Date(l.dueDate) - now) / 86400000);
    if (days > 30 && days <= 90) list.push({ id: `remind-due-${l.id}`, title: `Khoản vay "${l.name}" sắp đến hạn trong ${days} ngày`, detail: `Đáo hạn ${l.dueDate}. Có thời gian để chuẩn bị dòng tiền hoặc tìm phương án tái cấu trúc trước khi trở thành cảnh báo khẩn.` });
  });

  // recurring monthly contribution reminders for active goals
  goals.forEach((g) => {
    if (Number(g.monthlyContribution) > 0) {
      list.push({ id: `remind-goal-${g.id}`, title: `Đến kỳ đóng góp cho "${g.name}"`, detail: `Mức đóng góp định kỳ ${fmt(g.monthlyContribution)}/tháng theo kế hoạch hiện tại.` });
    }
  });

  // mock market-volatility reminder if holding gold (no live price feed in this demo)
  const hasGold = assets.some((a) => a.category === "gold");
  if (hasGold) {
    list.push({ id: "remind-gold", title: "Giá vàng đang biến động mạnh (mô phỏng)", detail: "Đây là nhắc nhở minh họa — trong bản thật, hệ thống sẽ theo dõi giá vàng thời gian thực và cảnh báo khi biến động vượt ngưỡng bạn đặt, để bạn cân nhắc lại tỷ trọng vàng trong danh mục." });
  }

  return list;
}

/* -------------------------------- ALERTS TAB (Rủi ro + Nhắc nhở) -------------------------------- */
function CollapsibleHeader({ title, open, onToggle, badge }) {
  return (
    <button onClick={onToggle} className="flex items-center justify-between w-full" style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", marginBottom: open ? 16 : 0 }}>
      <div className="flex items-center gap-2">
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text, fontSize: 19, fontWeight: 600 }}>{title}</h2>
        {badge}
      </div>
      <ChevronDown size={18} color={C.textMuted} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
    </button>
  );
}

function AlertsOverviewTab({ alerts, reminders }) {
  const [riskOpen, setRiskOpen] = useState(true);
  const [reminderOpen, setReminderOpen] = useState(true);
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card>
        <CollapsibleHeader title="Rủi ro" open={riskOpen} onToggle={() => setRiskOpen((o) => !o)}
          badge={alerts.length > 0 && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, background: C.statusCritical + "22", color: C.statusCritical }}>{alerts.length}</span>} />
        {riskOpen && (alerts.length === 0 ? <EmptyState text="Không có cảnh báo rủi ro nào — mọi chỉ số trong ngưỡng an toàn." /> : (
          <div className="flex flex-col gap-3">
            {[...alerts].sort((a, b) => (a.level === "danger" ? 0 : 1) - (b.level === "danger" ? 0 : 1)).map((a) => { const lc = a.level === "danger" ? C.statusCritical : C.statusWarning; return (
              <div key={a.id} className="rounded-xl p-4" style={{ background: lc + "14", border: `1px solid ${lc}55` }}>
                <div className="flex items-center gap-2 mb-1.5"><AlertTriangle size={15} color={lc} /><div style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</div></div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{a.detail}</div>
              </div>
            ); })}
          </div>
        ))}
      </Card>

      <Card>
        <CollapsibleHeader title="Nhắc nhở" open={reminderOpen} onToggle={() => setReminderOpen((o) => !o)}
          badge={reminders.length > 0 && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, background: C.accent + "22", color: C.accentText }}>{reminders.length}</span>} />
        {reminderOpen && (reminders.length === 0 ? <EmptyState text="Không có nhắc nhở nào hiện tại." /> : (
          <div className="flex flex-col gap-3">
            {reminders.map((r) => (
              <div key={r.id} className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.accent}44` }}>
                <div className="flex items-center gap-2 mb-1.5"><CalendarClock size={15} color={C.accentText} /><div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div></div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{r.detail}</div>
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* -------------------------------- DASHBOARD -------------------------------- */
const DASHBOARD_SECTIONS = [
  { key: "chart", label: "Biểu đồ Tài sản · Nợ · Tài sản ròng" },
  { key: "allocation", label: "Tỷ trọng tài sản & Phân tầng rủi ro" },
  { key: "performance", label: "Hiệu suất đầu tư" },
  { key: "cashflow", label: "Dòng tiền hàng tháng" },
  { key: "debtHealth", label: "Sức khỏe nợ & thanh khoản" },
  { key: "goals", label: "Mục tiêu tài chính" },
  { key: "summary", label: "Tóm tắt hồ sơ tài chính" },
];
const DEFAULT_DASHBOARD_SECTIONS = Object.fromEntries(DASHBOARD_SECTIONS.map((s) => [s.key, true]));

function DashboardSectionsSettings({ sections, onChange, onReset }) {
  return (
    <>
      <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 10 }}>Chọn phần thông tin muốn hiển thị trong tab Tổng quan (3 thẻ tổng tài sản/nợ/tài sản ròng luôn hiển thị).</div>
      <div className="flex flex-col">
        {DASHBOARD_SECTIONS.map((s) => {
          const visible = sections[s.key] !== false;
          return (
            <button key={s.key} onClick={() => onChange({ ...sections, [s.key]: !visible })} className="flex items-center justify-between w-full"
              style={{ background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, padding: "10px 0", cursor: "pointer" }}>
              <span style={{ fontSize: 13.5, color: visible ? C.text : C.textFaint }}>{s.label}</span>
              {visible ? <Eye size={16} color={C.accent} /> : <EyeOff size={16} color={C.textFaint} />}
            </button>
          );
        })}
      </div>
      <GhostButton onClick={onReset} style={{ justifyContent: "center", width: "100%", marginTop: 12 }}><RotateCcw size={14} /> Đặt lại mặc định</GhostButton>
    </>
  );
}

function Dashboard({ totalAssets, totalLiabilities, netWorth, allocation, tierTotals, netWorthHistory, backEndDTI, liquidityRunway, liquidAssets, totalMonthlyDebtService, monthlyIncome, monthlyExpense, netCashflow, goals, alerts, assets, dashboardSections }) {
  const sec = (key) => dashboardSections[key] !== false;
  const total = Object.values(tierTotals).reduce((a, b) => a + b, 0) || 1;
  const dti = dtiBand(backEndDTI); const runway = runwayBand(liquidityRunway);
  const growth = cagr(netWorthHistory);
  const chartData = netWorthHistory.map((h) => ({ ...h, label: monthLabel(h.date) }));

  const perf = assets.map((a) => ({ a, p: assetPerformance(a) })).filter((x) => x.p).sort((x, y) => y.p.totalReturnPct - x.p.totalReturnPct);
  const totalCost = assets.reduce((s, a) => s + (Number(a.costBasis) || 0), 0);
  const totalGain = assets.reduce((s, a) => s + ((Number(a.value) || 0) - (Number(a.costBasis) || 0)) * (a.costBasis ? 1 : 0), 0);
  const portfolioReturnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : null;

  const profileLines = buildProfileSummary({ netWorth, growth, tierTotals, backEndDTI, liquidityRunway, goals, alerts, hasIncome: monthlyIncome > 0 });

  const savingsRate = monthlyIncome > 0 ? (netCashflow / monthlyIncome) * 100 : null;
  const savingsNote = savingsRate === null ? null : savingsRate < 0
    ? "Dòng tiền đang âm — chi tiêu và trả nợ vượt thu nhập hàng tháng."
    : savingsRate >= 20
      ? `Đang tiết kiệm ${savingsRate.toFixed(0)}% thu nhập, vượt chuẩn khuyến nghị 20% (quy tắc 50/30/20).`
      : savingsRate >= 10
        ? `Đang tiết kiệm ${savingsRate.toFixed(0)}% thu nhập, thấp hơn chuẩn khuyến nghị 20%.`
        : `Đang tiết kiệm ${savingsRate.toFixed(0)}% thu nhập, khá thấp so với chuẩn khuyến nghị 20% — tốc độ tích lũy sẽ chậm.`;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card style={{ padding: 0 }}>
        <div className="grid grid-cols-3">
          <div className="p-3 sm:p-4" style={{ borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>Tổng tài sản</div>
            <div className="text-lg sm:text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, marginTop: 4 }}>{fmt(totalAssets)}</div>
          </div>
          <div className="p-3 sm:p-4" style={{ borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>Tổng nợ</div>
            <div className="text-lg sm:text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: C.danger, marginTop: 4 }}>{fmt(totalLiabilities)}</div>
          </div>
          <div className="p-3 sm:p-4">
            <div style={{ fontSize: 11, color: C.textMuted }}>Tài sản ròng</div>
            <div className="text-lg sm:text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: C.accentText, marginTop: 4 }}>{fmt(netWorth)}</div>
          </div>
        </div>
      </Card>

      {sec("chart") && (
        <Card>
          <SimpleTitle title="Tài sản · Nợ · Tài sản ròng" />
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fill: C.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{ background: C.bgPanel2, border: `1px solid ${C.borderLight}`, borderRadius: 10, color: C.text }} />
                <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
                <Line type="monotone" dataKey="assets" name="Tài sản" stroke={C.catBlue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="liabilities" name="Nợ" stroke={C.catRed} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="netWorth" name="Tài sản ròng" stroke={C.catGreen} strokeWidth={2.5} dot={{ fill: C.catGreen, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {sec("allocation") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card>
            <SimpleTitle title="Tỷ trọng tài sản" />
            {allocation.length === 0 ? <EmptyState text="Chưa có dữ liệu tài sản." /> : (
              <div style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={2}>
                      {allocation.map((d, i) => <Cell key={i} fill={d.color} stroke={C.bgPanel} strokeWidth={2} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{ background: C.bgPanel2, border: `1px solid ${C.borderLight}`, borderRadius: 10, color: C.text }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-col gap-1.5 mt-2">
              {allocation.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span style={{ width: 8, height: 8, borderRadius: 99, background: d.color }} /><span style={{ color: C.textMuted }}>{d.name}</span></div>
                  <span>{((d.value / total) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SimpleTitle title="Phân tầng rủi ro" />
            <div className="flex flex-col gap-2.5 mt-1">
              {[1, 2, 3, 4].sort((a, b) => tierTotals[b] - tierTotals[a]).map((tier) => { const pct = (tierTotals[tier] / total) * 100; return (
                <div key={tier}>
                  <div className="flex items-center justify-between text-xs mb-1"><span style={{ color: C.textMuted }}>{TIERS[tier].label}</span><span>{pct.toFixed(0)}%</span></div>
                  <div style={{ height: 10, background: C.bg, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: TIERS[tier].color, borderRadius: 6 }} /></div>
                </div>
              ); })}
            </div>
          </Card>
        </div>
      )}

      {sec("performance") && (
        <Card>
          <SimpleTitle title="Hiệu suất đầu tư" action={growth !== null && <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, background: C.accent + "22", color: C.accentText }}>Tài sản ròng ~{growth.toFixed(1)}%/năm<InfoTag termKey="cagr" /></span>} />
          {perf.length === 0 ? <EmptyState text="Chưa có tài sản nào có vốn gốc để tính hiệu suất." /> : (
            <>
              {portfolioReturnPct !== null && (
                <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.textMuted }}>Lãi/lỗ chưa hiện thực hóa (toàn danh mục)</span>
                  <div className="flex items-center">
                    <span style={{ fontSize: 12, color: C.textFaint, width: 110, textAlign: "right" }}>{fmt(totalGain)}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: portfolioReturnPct >= 0 ? C.success : C.danger, width: 65, textAlign: "right" }}>{portfolioReturnPct >= 0 ? "+" : ""}{portfolioReturnPct.toFixed(1)}%</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {perf.map(({ a, p }) => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <span style={{ fontSize: 13, color: C.text }}>{a.name}</span>
                    <div className="flex items-center flex-shrink-0">
                      <span style={{ fontSize: 11, color: C.textFaint, width: 90, textAlign: "right" }}>{p.annualizedPct !== null ? `${p.annualizedPct >= 0 ? "+" : ""}${p.annualizedPct.toFixed(1)}%/năm` : ""}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: p.totalReturnPct >= 0 ? C.success : C.danger, width: 60, textAlign: "right" }}>{p.totalReturnPct >= 0 ? "+" : ""}{p.totalReturnPct.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {sec("cashflow") && (
        <Card>
          <SimpleTitle title="Dòng tiền hàng tháng" />
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div><div style={{ fontSize: 11, color: C.textMuted }}>Thu nhập</div><div className="text-sm sm:text-lg" style={{ fontWeight: 700, color: C.success }}>{fmt(monthlyIncome)}</div></div>
            <div><div style={{ fontSize: 11, color: C.textMuted }}>Chi tiêu + trả nợ</div><div className="text-sm sm:text-lg" style={{ fontWeight: 700, color: C.danger }}>{fmt(monthlyExpense + totalMonthlyDebtService)}</div></div>
            <div><div style={{ fontSize: 11, color: C.textMuted }}>Dòng tiền ròng</div><div className="text-sm sm:text-lg" style={{ fontWeight: 700, color: netCashflow >= 0 ? C.success : C.danger }}>{netCashflow >= 0 ? "+" : ""}{fmt(netCashflow)}{savingsRate !== null ? ` (${savingsRate >= 0 ? "+" : ""}${savingsRate.toFixed(0)}%)` : ""}</div></div>
          </div>
          {savingsNote && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 10, lineHeight: 1.5 }}>{savingsNote}</div>}
        </Card>
      )}

      {sec("debtHealth") && (
        <Card>
          <SimpleTitle title="Sức khỏe nợ & thanh khoản" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5"><span style={{ fontSize: 12, color: C.textMuted }}>DTI<InfoTag termKey="dti" /></span><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: dti.color + "22", color: dti.color }}>{dti.label}</span></div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{backEndDTI ? `${backEndDTI.toFixed(0)}%` : "—"}</div>
              <div style={{ height: 8, background: C.bg, borderRadius: 5, marginTop: 8 }}><div style={{ width: `${Math.min(100, backEndDTI)}%`, height: "100%", background: dti.color, borderRadius: 5 }} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5"><span style={{ fontSize: 12, color: C.textMuted }}>Quỹ thanh khoản<InfoTag termKey="runway" /></span><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: runway.color + "22", color: runway.color }}>{runway.label}</span></div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{liquidityRunway ? `${liquidityRunway.toFixed(1)} tháng` : "—"}</div>
              <div style={{ height: 8, background: C.bg, borderRadius: 5, marginTop: 8 }}><div style={{ width: `${Math.min(100, (liquidityRunway / 6) * 100)}%`, height: "100%", background: runway.color, borderRadius: 5 }} /></div>
            </div>
          </div>
        </Card>
      )}

      {sec("goals") && (
        <Card>
          <SimpleTitle title="Mục tiêu tài chính" />
          {goals.length === 0 ? <EmptyState text="Chưa có mục tiêu nào — thêm ở tab Mục tiêu." /> : (
            <div className="flex flex-col gap-4">
              {goals.map((g) => { const pct = Math.min(100, ((Number(g.currentAmount) || 0) / (Number(g.targetAmount) || 1)) * 100); return (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-xs mb-1.5"><span style={{ color: C.text, fontWeight: 500 }}>{g.name}</span><span style={{ color: C.textMuted }}>{fmt(g.currentAmount)} / {fmt(g.targetAmount)} ({pct.toFixed(0)}%)</span></div>
                  <div style={{ height: 10, background: C.bg, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.accentText})`, borderRadius: 6 }} /></div>
                </div>
              ); })}
            </div>
          )}
        </Card>
      )}

      {sec("summary") && (
        <Card>
          <SimpleTitle title="Tóm tắt hồ sơ tài chính" />
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {profileLines.map((line, i) => <li key={i} style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6 }}>{line}</li>)}
          </ul>
        </Card>
      )}

    </div>
  );
}

/* -------------------------------- ASSETS TAB -------------------------------- */
function AssetsTab({ assets, setAssets, liabilities, setLiabilities, accounts, setAccounts, onSync }) {
  const [modal, setModal] = useState(null);
  const [connectModal, setConnectModal] = useState(false);

  const saveAsset = (data) => { if (data.id) setAssets(assets.map((a) => (a.id === data.id ? data : a))); else setAssets([...assets, { ...data, id: genId(), source: "manual" }]); setModal(null); };
  const saveLiability = (data) => { if (data.id) setLiabilities(liabilities.map((l) => (l.id === data.id ? data : l))); else setLiabilities([...liabilities, { ...data, id: genId() }]); setModal(null); };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card>
        <SimpleTitle title="Danh mục tài sản" action={<GoldButton onClick={() => setModal({ type: "asset", editing: null })}><Plus size={15} /> Thêm tài sản</GoldButton>} />
        {assets.length === 0 ? <EmptyState text="Chưa có tài sản nào." /> : (
          <div className="flex flex-col gap-2">
            {[...assets].sort((x, y) => (Number(y.value) || 0) - (Number(x.value) || 0)).map((a) => {
              const cat = CATEGORIES[a.category]; const Icon = cat?.icon || DollarSign; const tier = TIERS[a.tierOverride || cat?.tier || 3];
              const catColor = categoryColor(a.category);
              const gain = (Number(a.value) || 0) - (Number(a.costBasis) || 0);
              return (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: catColor + "1E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={16} color={catColor} /></div>
                    <div className="min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name} {a.source === "synced" && <span style={{ fontSize: 10, color: C.success, marginLeft: 4 }}>● đồng bộ</span>}</div>
                      <div style={{ fontSize: 11, color: C.textFaint }}>{cat?.label} · {tier.label}{a.updatedAt ? ` · cập nhật ${a.updatedAt}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right" style={{ minWidth: 130 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{fmtFull(a.value)}</div>{a.costBasis ? <div style={{ fontSize: 11, color: gain >= 0 ? C.success : C.danger }}>{gain >= 0 ? "+" : ""}{fmt(gain)}</div> : null}</div>
                    {a.source !== "synced" ? <button onClick={() => setModal({ type: "asset", editing: a })} style={{ color: C.textMuted }}><Pencil size={14} /></button> : <div style={{ width: 14 }} />}
                    <button onClick={() => setAssets(assets.filter((x) => x.id !== a.id))} style={{ color: C.danger }}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <SimpleTitle title="Khoản vay & nghĩa vụ" action={<GhostButton onClick={() => setModal({ type: "liability", editing: null })}><Plus size={15} /> Thêm khoản vay</GhostButton>} />
        {liabilities.length === 0 ? <EmptyState text="Chưa có khoản vay nào." /> : (
          <div className="flex flex-col gap-2">
            {liabilities.map((l) => (
              <div key={l.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3" style={{ background: C.catOrange + "0D", border: `1px solid ${C.catOrange}44`, borderLeft: `3px solid ${C.catOrange}` }}>
                <div className="min-w-0"><div style={{ fontSize: 14, fontWeight: 500 }}>{l.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>Lãi suất {l.interestRate || 0}%/năm{l.dueDate ? ` · đáo hạn ${l.dueDate}` : ""}{liabilityMonthlyPayment(l) > 0 ? ` · trả góp ${fmtFull(liabilityMonthlyPayment(l))}/th` : ""}</div></div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.danger }}>{fmtFull(l.balance)}</div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setModal({ type: "liability", editing: l })} style={{ color: C.textMuted }}><Pencil size={14} /></button>
                    <button onClick={() => setLiabilities(liabilities.filter((x) => x.id !== l.id))} style={{ color: C.danger }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SimpleTitle title="Tài khoản đã liên kết"
          action={<GhostButton onClick={() => setConnectModal(true)}><Plus size={15} /> Kết nối tài khoản</GhostButton>} />
        {accounts.length === 0 ? <EmptyState text="Chưa kết nối tài khoản nào." /> : (
          <div className="flex flex-col gap-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: C.bgPanel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Landmark size={15} color={C.accent} /></div>
                  <div className="min-w-0"><div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>Đồng bộ lần cuối: {a.lastSynced} · <span style={{ color: C.success }}>Đã kết nối</span></div></div>
                </div>
                <button onClick={() => onSync(a.id)} style={{ color: C.textMuted, flexShrink: 0 }}><RefreshCw size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {modal?.type === "asset" && <AssetModal editing={modal.editing} onClose={() => setModal(null)} onSave={saveAsset} />}
      {modal?.type === "liability" && <LiabilityModal editing={modal.editing} onClose={() => setModal(null)} onSave={saveLiability} />}
      {connectModal && (
        <ModalShell title="Kết nối tài khoản" onClose={() => setConnectModal(false)}>
          <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 12 }}>Chọn tổ chức để mô phỏng kết nối (dữ liệu minh họa, chưa phải liên kết thật).</div>
          <div className="flex flex-col gap-2">
            {INSTITUTIONS.map((inst) => (
              <button key={inst.id} onClick={() => {
                const newAcc = { id: genId(), institutionId: inst.id, name: `${inst.name} - Tài khoản mới`, type: inst.type, lastSynced: todayStr(), status: "connected" };
                setAccounts([...accounts, newAcc]); setConnectModal(false);
              }} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}>
                <span>{inst.name}</span><span style={{ fontSize: 11, color: C.textFaint }}>{inst.type === "bank" ? "Ngân hàng" : "Chứng khoán"}</span>
              </button>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function AssetModal({ editing, onClose, onSave }) {
  const [f, setF] = useState(editing || { category: "cash", name: "", value: "", costBasis: "", note: "", dueDate: "", tierOverride: "", purchasedAt: "" });
  const canSave = f.name && f.value !== "";
  return (
    <ModalShell title={editing ? "Sửa tài sản" : "Thêm tài sản"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Loại tài sản"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></Field>
        <Field label="Tên khoản"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên tài sản" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Giá trị hiện tại (đ)"><TextInput type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} placeholder="0" /></Field>
          <Field label="Vốn gốc (đ, tùy chọn)"><TextInput type="number" value={f.costBasis} onChange={(e) => setF({ ...f, costBasis: e.target.value })} placeholder="0" /></Field>
        </div>
        <Field label="Ngày mua (tùy chọn, để tính hiệu suất theo năm)"><TextInput type="date" value={f.purchasedAt} onChange={(e) => setF({ ...f, purchasedAt: e.target.value })} /></Field>
        <Field label="Ghi đè mức rủi ro (tùy chọn)"><Select value={f.tierOverride || ""} onChange={(e) => setF({ ...f, tierOverride: e.target.value })}><option value="">Mặc định theo loại</option>{Object.entries(TIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></Field>
        <Field label="Ghi chú"><TextInput value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Tùy chọn" /></Field>
        <GoldButton disabled={!canSave} onClick={() => onSave({ ...f, updatedAt: todayStr() })} style={{ justifyContent: "center", marginTop: 6 }}><Check size={15} /> Lưu tài sản</GoldButton>
      </div>
    </ModalShell>
  );
}

function LiabilityModal({ editing, onClose, onSave }) {
  const [f, setF] = useState(editing || { name: "", balance: "", interestRate: "", dueDate: "", note: "", termMonths: "", monthlyPayment: "" });
  const canSave = f.name && f.balance !== "";
  const computedPayment = f.termMonths && !f.monthlyPayment ? amortizedPayment(f.balance, f.interestRate, f.termMonths) : null;
  return (
    <ModalShell title={editing ? "Sửa khoản vay" : "Thêm khoản vay"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Tên khoản vay"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="VD: Vay mua nhà VCB" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dư nợ hiện tại (đ)"><TextInput type="number" value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} placeholder="0" /></Field>
          <Field label="Lãi suất (%/năm)"><TextInput type="number" value={f.interestRate} onChange={(e) => setF({ ...f, interestRate: e.target.value })} placeholder="0" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kỳ hạn còn lại (tháng)"><TextInput type="number" value={f.termMonths} onChange={(e) => setF({ ...f, termMonths: e.target.value })} placeholder="VD: 180" /></Field>
          <Field label="Trả góp / tháng (tùy chọn)"><TextInput type="number" value={f.monthlyPayment} onChange={(e) => setF({ ...f, monthlyPayment: e.target.value })} placeholder="Để trống để tự tính" /></Field>
        </div>
        {computedPayment > 0 && <div style={{ fontSize: 12, color: C.accentText }}>Ước tính trả góp: {fmtFull(computedPayment)}/tháng</div>}
        <Field label="Ngày đáo hạn (nếu có)"><TextInput type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
        <GoldButton disabled={!canSave} onClick={() => onSave(f)} style={{ justifyContent: "center", marginTop: 6 }}><Check size={15} /> Lưu khoản vay</GoldButton>
      </div>
    </ModalShell>
  );
}

/* -------------------------------- GOALS TAB -------------------------------- */
const GOAL_TEMPLATES = [
  { key: "emergency", name: "Quỹ khẩn cấp", targetAmount: 150000000, years: 1.5, annualReturn: 5, icon: Shield, colorKey: "catBlue" },
  { key: "firsthome", name: "Mua nhà lần đầu (trả trước)", targetAmount: 800000000, years: 5, annualReturn: 7, icon: Home, colorKey: "catOrange" },
  { key: "wedding", name: "Đám cưới", targetAmount: 300000000, years: 2, annualReturn: 5, icon: Star, colorKey: "catMagenta" },
  { key: "childeducation", name: "Học phí con", targetAmount: 1500000000, years: 15, annualReturn: 8, icon: Target, colorKey: "catYellow" },
  { key: "retirement", name: "Quỹ nghỉ hưu", targetAmount: 8000000000, years: 25, annualReturn: 8, icon: Wallet, colorKey: "catViolet" },
  { key: "car", name: "Mua xe", targetAmount: 600000000, years: 3, annualReturn: 6, icon: TrendingUp, colorKey: "catAqua" },
];
function goalColor(goalName, index) {
  const match = GOAL_TEMPLATES.find((t) => t.name === goalName);
  const key = match ? match.colorKey : GOAL_TEMPLATES[index % GOAL_TEMPLATES.length].colorKey;
  return C[key];
}

function GoalsTab({ goals, setGoals, netWorth, netCashflow, netWorthHistory, defaultReturn }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [template, setTemplate] = useState(null);
  const save = (g) => { if (g.id) setGoals(goals.map((x) => (x.id === g.id ? g : x))); else setGoals([...goals, { ...g, id: genId() }]); setModal(false); setEditing(null); setTemplate(null); };
  const remove = (id) => setGoals(goals.filter((g) => g.id !== id));

  const totalContribution = goals.reduce((s, g) => s + (Number(g.monthlyContribution) || 0), 0);
  const overCommitted = netCashflow > 0 && totalContribution > netCashflow;
  const growth = cagr(netWorthHistory);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card>
        <SimpleTitle title="Khả năng đóng góp cho mục tiêu" />
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div><div style={{ fontSize: 11, color: C.textMuted }}>Dòng tiền khả dụng/tháng</div><div className="text-sm sm:text-lg" style={{ fontWeight: 700 }}>{fmt(netCashflow)}</div></div>
          <div><div style={{ fontSize: 11, color: C.textMuted }}>Tổng cam kết cho mục tiêu</div><div className="text-sm sm:text-lg" style={{ fontWeight: 700, color: overCommitted ? C.danger : C.text }}>{fmt(totalContribution)}</div></div>
          <div><div style={{ fontSize: 11, color: C.textMuted }}>Tăng trưởng tài sản ròng gần đây</div><div className="text-sm sm:text-lg" style={{ fontWeight: 700 }}>{growth !== null ? `~${growth.toFixed(1)}%/năm` : "—"}</div></div>
        </div>
        {overCommitted && <div style={{ fontSize: 12, color: C.danger, marginTop: 10 }}>Tổng mức đóng góp cho các mục tiêu đang vượt dòng tiền khả dụng khoảng {fmt(totalContribution - netCashflow)}/tháng. Cân nhắc điều chỉnh mức đóng góp hoặc thời hạn một số mục tiêu.</div>}
      </Card>

      <Card>
        <SimpleTitle title="Mẫu mục tiêu theo vòng đời" />
        <div className="flex gap-2 flex-wrap">
          {GOAL_TEMPLATES.map((t) => (
            <button key={t.key} onClick={() => { setTemplate(t); setEditing(null); setModal(true); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm" style={{ background: C[t.colorKey] + "14", border: `1px solid ${C[t.colorKey]}44`, color: C.textMuted }}>
              <t.icon size={13} color={C[t.colorKey]} /> {t.name}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SimpleTitle title="Mục tiêu tài chính" action={<GoldButton onClick={() => { setEditing(null); setTemplate(null); setModal(true); }}><Plus size={15} /> Thêm mục tiêu</GoldButton>} />
        {goals.length === 0 ? <EmptyState text="Chưa có mục tiêu nào." /> : (
          <div className="flex flex-col gap-4">
            {goals.map((g, i) => <GoalCard key={g.id} g={g} growth={growth} color={goalColor(g.name, i)} onEdit={() => { setEditing(g); setTemplate(null); setModal(true); }} onRemove={() => remove(g.id)} />)}
          </div>
        )}
      </Card>
      {modal && <GoalModal editing={editing} template={template} defaultReturn={defaultReturn} onClose={() => { setModal(false); setEditing(null); setTemplate(null); }} onSave={save} />}
    </div>
  );
}

function GoalCard({ g, growth, color, onEdit, onRemove }) {
  const now = new Date(); const target = new Date(g.targetDate);
  const monthsLeft = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
  const r = (Number(g.annualReturn) || 8) / 100 / 12; const contrib = Number(g.monthlyContribution) || 0; const current = Number(g.currentAmount) || 0;
  const fv = current * Math.pow(1 + r, monthsLeft) + contrib * ((Math.pow(1 + r, monthsLeft) - 1) / (r || 0.0001)) * (1 + r);
  const targetAmt = Number(g.targetAmount) || 1;
  const pct = Math.min(100, (fv / targetAmt) * 100);
  const onTrack = fv >= targetAmt * 0.95;
  const fvFromCurrent = current * Math.pow(1 + r, monthsLeft);
  const annuityFactor = ((Math.pow(1 + r, monthsLeft) - 1) / (r || 0.0001)) * (1 + r);
  const requiredContrib = monthsLeft > 0 ? Math.max(0, (targetAmt - fvFromCurrent) / (annuityFactor || 1)) : 0;

  return (
    <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center justify-between mb-2">
        <div><div style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>Mục tiêu {fmtFull(g.targetAmount)} vào {g.targetDate}</div></div>
        <div className="flex items-center gap-3"><button onClick={onEdit} style={{ color: C.textMuted }}><Pencil size={14} /></button><button onClick={onRemove} style={{ color: C.danger }}><Trash2 size={14} /></button></div>
      </div>
      <div style={{ height: 8, background: C.bgPanel2, borderRadius: 5, overflow: "hidden", marginBottom: 8 }}><div style={{ width: `${pct}%`, height: "100%", background: onTrack ? C.success : C.statusWarning, borderRadius: 5 }} /></div>
      <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: C.textMuted }}>
        <div>Dự phóng đạt: <b style={{ color: C.text }}>{fmt(fv)}</b> ({pct.toFixed(0)}%)</div>
        <div>Đóng góp cần thiết: <b style={{ color: C.text }}>{fmt(requiredContrib)}/th</b></div>
      </div>
      <div style={{ fontSize: 11, color: onTrack ? C.success : C.statusWarning, marginTop: 6 }}>{onTrack ? "Đang trên đà đạt mục tiêu" : "Có thể cần tăng đóng góp hoặc điều chỉnh thời hạn"}</div>
      {growth !== null && (
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>
          Giả định lợi nhuận {g.annualReturn}%/năm cho mục tiêu này, so với tăng trưởng tài sản ròng thực tế gần đây ~{growth.toFixed(1)}%/năm.
        </div>
      )}
    </div>
  );
}

function GoalModal({ editing, template, defaultReturn, onClose, onSave }) {
  const initial = editing || (template ? { name: template.name, targetAmount: template.targetAmount, targetDate: yearsAheadStr(template.years), currentAmount: "", monthlyContribution: "", annualReturn: template.annualReturn } : { name: "", targetAmount: "", targetDate: "", currentAmount: "", monthlyContribution: "", annualReturn: defaultReturn || 8 });
  const [f, setF] = useState(initial);
  const canSave = f.name && f.targetAmount && f.targetDate;
  return (
    <ModalShell title={editing ? "Sửa mục tiêu" : template ? `Thêm mục tiêu: ${template.name}` : "Thêm mục tiêu"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {template && <div style={{ fontSize: 11, color: C.textFaint }}>Đã điền sẵn theo mẫu — chị có thể chỉnh lại số tiền, thời hạn, mức đóng góp cho phù hợp.</div>}
        <Field label="Tên mục tiêu"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số tiền mục tiêu (đ)"><TextInput type="number" value={f.targetAmount} onChange={(e) => setF({ ...f, targetAmount: e.target.value })} /></Field>
          <Field label="Ngày mục tiêu"><TextInput type="date" value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số dư hiện có (đ)"><TextInput type="number" value={f.currentAmount} onChange={(e) => setF({ ...f, currentAmount: e.target.value })} /></Field>
          <Field label="Đóng góp / tháng (đ)"><TextInput type="number" value={f.monthlyContribution} onChange={(e) => setF({ ...f, monthlyContribution: e.target.value })} /></Field>
        </div>
        <Field label="Lợi nhuận kỳ vọng (%/năm)"><TextInput type="number" value={f.annualReturn} onChange={(e) => setF({ ...f, annualReturn: e.target.value })} /></Field>
        <GoldButton disabled={!canSave} onClick={() => onSave(f)} style={{ justifyContent: "center", marginTop: 6 }}><Check size={15} /> Lưu mục tiêu</GoldButton>
      </div>
    </ModalShell>
  );
}

/* -------------------------------- ADVISOR TAB -------------------------------- */
function AdvisorTab({ messages, setMessages, snapshot, bookings, setBookings, recommendations }) {
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const chatBodyRef = useRef(null);
  const [bookingAdvisor, setBookingAdvisor] = useState(null);
  const [chattingAdvisor, setChattingAdvisor] = useState(null);
  useEffect(() => {
    if (messages.length === 0) return;
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const sortedAdvisors = [...ADVISORS].sort((x, y) => (recommendations[y.id] ? 1 : 0) - (recommendations[x.id] ? 1 : 0));

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() }; const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      const text = await mockChatReply(userMsg.content, snapshot);
      setMessages([...newMessages, { role: "assistant", content: text }]);
    } catch (e) { setMessages([...newMessages, { role: "assistant", content: "Có lỗi khi kết nối. Vui lòng thử lại." }]); }
    setLoading(false);
  };
  const suggestions = ["Nếu mua thêm một căn hộ trả góp thì ảnh hưởng thế nào?", "Cơ cấu tài sản hiện tại có đang quá thận trọng không?", "Tôi có đang đi đúng hướng cho mục tiêu đã đặt không?"];

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card style={{ display: "flex", flexDirection: "column", height: "62vh" }}>
        <SimpleTitle title="Cố vấn AI" />
        <div ref={chatBodyRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
          {messages.length === 0 && (
            <div className="flex flex-col gap-2">
              <div style={{ fontSize: 13, color: C.textFaint, marginBottom: 4 }}>Gợi ý câu hỏi:</div>
              {suggestions.map((s, i) => <button key={i} onClick={() => setInput(s)} className="text-left rounded-xl px-3.5 py-2.5" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 13 }}>{s} <ChevronRight size={12} style={{ display: "inline", marginLeft: 4 }} /></button>)}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
              <div style={{ background: m.role === "user" ? C.accent : C.bg, color: m.role === "user" ? C.onAccent : C.text, border: `1px solid ${m.role === "user" ? C.accent + "55" : C.border}`, borderRadius: 14, padding: "10px 14px", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ alignSelf: "flex-start", color: C.textFaint, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={14} className="animate-spin" /> Đang phân tích...</div>}
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <TextInput value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Hỏi về một kịch bản tài chính..." />
          <GoldButton onClick={send} disabled={loading || !input.trim()} style={{ padding: "9px 14px" }}><Send size={15} /></GoldButton>
        </div>
      </Card>

      <Card>
        <SimpleTitle title="Đặt lịch chuyên gia tư vấn gia sản" />
        <div className="flex flex-col gap-2.5">
          {sortedAdvisors.map((a) => { const rec = recommendations[a.id]; return (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3" style={{ background: C.bg, border: `1px solid ${rec ? C.accent + "55" : C.border}` }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: C.accentSoft, color: C.accentText }}>{a.level}</span>
                  {rec && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: C.catYellow + "2A", color: C.catYellowText }}>Đề xuất cho bạn</span>}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{a.title}</div>
                <div style={{ fontSize: 11, color: C.textFaint }}>{a.specialties.join(" · ")}</div>
                {rec && <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>{rec}</div>}
                <div className="flex items-center gap-1 mt-1" style={{ fontSize: 11, color: C.accent }}><Star size={11} fill={C.accent} />{a.rating} ({a.reviews} đánh giá)</div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accentText }}>{fmt(a.rate)}/giờ</div>
                <div className="flex items-center gap-2">
                  <GhostButton onClick={() => setChattingAdvisor(a)} style={{ padding: "6px 10px" }}><MessageCircle size={13} /> Chat</GhostButton>
                  <GhostButton onClick={() => setBookingAdvisor(a)} style={{ padding: "6px 10px" }}><CalendarClock size={13} /> Đặt lịch</GhostButton>
                </div>
              </div>
            </div>
          ); })}
        </div>
        {bookings.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Lịch đã đặt:</div>
            {bookings.map((b) => <div key={b.id} style={{ fontSize: 12, color: C.text, marginBottom: 3 }}>✓ {b.advisorName} — {b.date} lúc {b.time}</div>)}
          </div>
        )}
      </Card>

      {bookingAdvisor && <BookingModal advisor={bookingAdvisor} onClose={() => setBookingAdvisor(null)} onConfirm={(booking) => { setBookings([...bookings, booking]); setBookingAdvisor(null); }} />}
      {chattingAdvisor && <AdvisorChatModal advisor={chattingAdvisor} onClose={() => setChattingAdvisor(null)} />}
    </div>
  );
}

function BookingModal({ advisor, onClose, onConfirm }) {
  const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [note, setNote] = useState("");
  const canBook = date && time;
  return (
    <ModalShell title={`Đặt lịch với ${advisor.name}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div style={{ fontSize: 12, color: C.textFaint }}>{advisor.title} · {fmt(advisor.rate)}/giờ</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngày"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Giờ"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
        <Field label="Ghi chú (tùy chọn)"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: muốn trao đổi về khoản vay mua nhà" /></Field>
        <GoldButton disabled={!canBook} onClick={() => onConfirm({ id: genId(), advisorId: advisor.id, advisorName: advisor.name, date, time, note })} style={{ justifyContent: "center", marginTop: 6 }}><Check size={15} /> Xác nhận đặt lịch</GoldButton>
        <div style={{ fontSize: 11, color: C.textFaint }}>Đây là bản mô phỏng đặt lịch minh họa, chưa kết nối hệ thống thanh toán/lịch thật.</div>
      </div>
    </ModalShell>
  );
}

function AdvisorChatModal({ advisor, onClose }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <ModalShell title={`Chat với ${advisor.name}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div style={{ fontSize: 12, color: C.textFaint }}>{advisor.title}</div>
        {sent ? (
          <div className="rounded-xl p-4 text-center" style={{ background: C.bg, border: `1px solid ${C.success}44` }}>
            <div style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>Đã gửi tin nhắn</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{advisor.name} thường phản hồi trong vòng vài giờ làm việc.</div>
          </div>
        ) : (
          <>
            <TextArea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Nhắn nhanh cho ${advisor.name}, ví dụ: "Tôi muốn hỏi về khoản vay mua nhà lãi suất đang cao"`} style={{ minHeight: 90, resize: "vertical" }} />
            <GoldButton disabled={!message.trim()} onClick={() => setSent(true)} style={{ justifyContent: "center" }}><Send size={15} /> Gửi tin nhắn</GoldButton>
          </>
        )}
        <div style={{ fontSize: 11, color: C.textFaint }}>Đây là bản mô phỏng nhắn tin minh họa, chưa kết nối hệ thống chat thật.</div>
      </div>
    </ModalShell>
  );
}
function SimulatorTab({ liabilities, liquidAssets, totalMonthlyDebtService, monthlyIncome, monthlyExpense, simSettings, goals, allocation, netWorth }) {
  const [scenario, setScenario] = useState("purchase");
  const totalGoalContribution = goals.reduce((s, g) => s + (Number(g.monthlyContribution) || 0), 0);
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card>
        <SimpleTitle title="Mô phỏng quyết định tài chính" />
        <div className="flex gap-2 flex-wrap">
          {[{ id: "purchase", label: "Mua tài sản mới bằng vay" }, { id: "stress", label: "Stress-test lãi suất" }, { id: "prepay", label: "Trả nợ sớm" }].map((s) => (
            <button key={s.id} onClick={() => setScenario(s.id)} className="px-3.5 py-2 rounded-full text-sm" style={{ background: scenario === s.id ? C.accent : "transparent", border: `1px solid ${scenario === s.id ? C.accent : C.borderLight}`, color: scenario === s.id ? C.onAccent : C.textMuted }}>{s.label}</button>
          ))}
        </div>
      </Card>
      {scenario === "purchase" && <PurchaseSimulator liquidAssets={liquidAssets} totalMonthlyDebtService={totalMonthlyDebtService} monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense} simSettings={simSettings} goals={goals} totalGoalContribution={totalGoalContribution} allocation={allocation} netWorth={netWorth} />}
      {scenario === "stress" && <StressTestSimulator liabilities={liabilities} monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense} totalGoalContribution={totalGoalContribution} />}
      {scenario === "prepay" && <PrepaySimulator liabilities={liabilities} liquidAssets={liquidAssets} monthlyExpense={monthlyExpense} simSettings={simSettings} totalGoalContribution={totalGoalContribution} />}
    </div>
  );
}

function ResultRow({ label, before, after, format = fmt, betterWhen = "lower" }) {
  const improved = betterWhen === "lower" ? after <= before : after >= before;
  return (
    <div className="grid grid-cols-3 gap-3 items-center py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12.5, color: C.textMuted }}>{label}</div>
      <div style={{ fontSize: 13.5, color: C.textFaint, textAlign: "right" }}>{format(before)}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: improved ? C.success : C.danger, textAlign: "right" }}>{format(after)}</div>
    </div>
  );
}

function GoalImpactNote({ newCashflow, totalGoalContribution }) {
  if (totalGoalContribution <= 0) return null;
  const short = totalGoalContribution - newCashflow;
  if (short <= 0) return <div style={{ fontSize: 12, color: C.success, marginTop: 8 }}>Dòng tiền còn lại vẫn đủ để duy trì mức đóng góp hiện tại cho các mục tiêu ({fmt(totalGoalContribution)}/tháng).</div>;
  return <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>Sau kịch bản này, dòng tiền còn lại không đủ để duy trì mức đóng góp hiện tại cho các mục tiêu ({fmt(totalGoalContribution)}/tháng) — thiếu khoảng {fmt(short)}/tháng.</div>;
}

function AIInterpretButton({ getPayload }) {
  const [loading, setLoading] = useState(false); const [text, setText] = useState("");
  const run = async () => {
    setLoading(true); setText("");
    try {
      const t = await mockInterpret(getPayload());
      setText(t || "Không nhận được phản hồi.");
    } catch (e) { setText("Có lỗi khi kết nối AI."); }
    setLoading(false);
  };
  return (
    <div className="mt-2">
      <GhostButton onClick={run} style={{ borderColor: C.accent, color: C.accentText }}>{loading ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />} Nhờ AI diễn giải kết quả này</GhostButton>
      {text && <div className="mt-3 rounded-xl p-3.5" style={{ background: C.bg, border: `1px solid ${C.accent}44`, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</div>}
    </div>
  );
}

function PurchaseSimulator({ liquidAssets, totalMonthlyDebtService, monthlyIncome, monthlyExpense, simSettings, goals, totalGoalContribution, allocation, netWorth }) {
  const [price, setPrice] = useState("");
  const [downPct, setDownPct] = useState(simSettings.defaultDownPct);
  const [rate, setRate] = useState(simSettings.defaultRate);
  const [termYears, setTermYears] = useState(simSettings.defaultTermYears);
  const [discountRate, setDiscountRate] = useState(simSettings.defaultGoalReturn);
  const P = Number(price) || 0; const downAmt = (P * Number(downPct)) / 100; const loanAmt = Math.max(0, P - downAmt);
  const newPayment = amortizedPayment(loanAmt, rate, Number(termYears) * 12);
  const newTotalDebtService = totalMonthlyDebtService + newPayment;
  const newDTI = monthlyIncome > 0 ? (newTotalDebtService / monthlyIncome) * 100 : 0;
  const oldDTI = monthlyIncome > 0 ? (totalMonthlyDebtService / monthlyIncome) * 100 : 0;
  const newLiquid = liquidAssets - downAmt;
  const oldRunway = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 0;
  const newRunway = monthlyExpense > 0 ? newLiquid / monthlyExpense : 0;
  const oldCashflow = monthlyIncome - monthlyExpense - totalMonthlyDebtService;
  const newCashflow = monthlyIncome - monthlyExpense - newTotalDebtService;
  const hasData = P > 0;
  // standard finance: NPV of the loan's payment stream, and opportunity cost of the down payment
  const npvLoanCost = npvOfAnnuity(newPayment, discountRate, Number(termYears) * 12);
  const nominalTotalPaid = newPayment * Number(termYears) * 12;
  const downPaymentFV = futureValue(downAmt, discountRate, Number(termYears));
  const realEstatePct = allocation.find((a) => a.name === CATEGORIES.realestate.label);
  const realEstateShareAfter = netWorth > 0 ? (((realEstatePct?.value || 0) + P) / (netWorth + loanAmt)) * 100 : null;

  return (
    <Card>
      <SimpleTitle title="Mua tài sản mới bằng vay ngân hàng" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Giá trị tài sản (đ)"><TextInput type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="VD: 3000000000" /></Field>
        <Field label="Trả trước (%)"><TextInput type="number" value={downPct} onChange={(e) => setDownPct(e.target.value)} /></Field>
        <Field label="Lãi suất vay (%/năm)"><TextInput type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Kỳ hạn vay (năm)"><TextInput type="number" value={termYears} onChange={(e) => setTermYears(e.target.value)} /></Field>
        <Field label="Lãi suất chiết khấu / cơ hội (%/năm)"><TextInput type="number" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} /></Field>
      </div>
      {!hasData ? <div style={{ color: C.textFaint, fontSize: 13 }}>Nhập giá trị tài sản để xem kết quả.</div> : (
        <>
          <div className="rounded-xl p-4 mb-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div><div style={{ fontSize: 11, color: C.textFaint }}>Số tiền vay</div><div style={{ fontSize: 17, fontWeight: 700, color: C.accentText }}>{fmtFull(loanAmt)}</div></div>
              <div><div style={{ fontSize: 11, color: C.textFaint }}>Trả góp / tháng</div><div style={{ fontSize: 17, fontWeight: 700, color: C.accentText }}>{fmtFull(newPayment)}</div></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs mb-1" style={{ color: C.textFaint }}><div>Chỉ số</div><div style={{ textAlign: "right" }}>Hiện tại</div><div style={{ textAlign: "right" }}>Sau khi mua</div></div>
            <ResultRow label="DTI" before={oldDTI} after={newDTI} format={(v) => `${v.toFixed(0)}%`} />
            <ResultRow label="Quỹ thanh khoản (tháng)" before={oldRunway} after={newRunway} format={(v) => `${v.toFixed(1)} th`} betterWhen="higher" />
            <ResultRow label="Dòng tiền ròng / tháng" before={oldCashflow} after={newCashflow} betterWhen="higher" />
            {realEstateShareAfter !== null && <ResultRow label="Tỷ trọng BĐS / tổng tài sản" before={((realEstatePct?.value || 0) / (netWorth || 1)) * 100} after={realEstateShareAfter} format={(v) => `${v.toFixed(0)}%`} betterWhen="lower" />}
          </div>
          <div className="rounded-xl p-4 mb-3" style={{ background: C.bg, border: `1px solid ${C.accent}33` }}>
            <div style={{ fontSize: 11, color: C.accentText, marginBottom: 6 }}>Chuẩn tài chính: giá trị hiện tại (PV) & tương lai (FV)<InfoTag termKey="pv_fv" /><InfoTag termKey="npv" /></div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span style={{ color: C.textMuted }}>Tổng tiền trả nợ danh nghĩa</span><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmt(nominalTotalPaid)}</div></div>
              <div><span style={{ color: C.textMuted }}>Quy về hiện giá (NPV, chiết khấu {discountRate}%/năm)</span><div style={{ fontSize: 14, fontWeight: 600, color: C.accentText }}>{fmt(npvLoanCost)}</div></div>
              <div><span style={{ color: C.textMuted }}>Trả trước hôm nay</span><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmt(downAmt)}</div></div>
              <div><span style={{ color: C.textMuted }}>Chi phí cơ hội (FV nếu đầu tư thay vì trả trước)</span><div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>{fmt(downPaymentFV)}</div></div>
            </div>
          </div>
          <div className="flex gap-3 text-xs" style={{ color: C.textFaint }}><span>DTI sau mua: <b style={{ color: dtiBand(newDTI).color }}>{dtiBand(newDTI).label}</b></span><span>·</span><span>Thanh khoản: <b style={{ color: runwayBand(newRunway).color }}>{runwayBand(newRunway).label}</b></span></div>
          <GoalImpactNote newCashflow={newCashflow} totalGoalContribution={totalGoalContribution} />
          <AIInterpretButton getPayload={() => ({
            kich_ban: "Mua tài sản mới bằng vay", gia_tri_tai_san: P, tra_truoc: downAmt, so_tien_vay: loanAmt,
            lai_suat_nam: rate, ky_han_nam: termYears, tra_gop_thang: Math.round(newPayment),
            DTI_truoc_pct: Math.round(oldDTI), DTI_sau_pct: Math.round(newDTI),
            quy_thanh_khoan_truoc_thang: Number(oldRunway.toFixed(1)), quy_thanh_khoan_sau_thang: Number(newRunway.toFixed(1)),
            dong_tien_rong_truoc: Math.round(oldCashflow), dong_tien_rong_sau: Math.round(newCashflow),
            npv_chi_phi_vay: Math.round(npvLoanCost), chi_phi_co_hoi_tra_truoc_fv: Math.round(downPaymentFV),
            ty_trong_bds_sau_pct: realEstateShareAfter !== null ? Math.round(realEstateShareAfter) : null,
            tong_cam_ket_muc_tieu_thang: totalGoalContribution, cac_muc_tieu_hien_co: goals.map((g) => g.name),
          })} />
        </>
      )}
      <div style={{ fontSize: 11, color: C.textFaint, marginTop: 12 }}>Giả định: trả trước lấy từ tài sản thanh khoản cao. Không tính phí giao dịch/thuế trước bạ.</div>
    </Card>
  );
}

function StressTestSimulator({ liabilities, monthlyIncome, monthlyExpense, totalGoalContribution }) {
  const steps = [0, 1, 2, 3, 5];
  const stressable = liabilities.filter(isLiabilityStressable);
  const fixed = liabilities.filter((l) => !isLiabilityStressable(l));
  const fixedPayment = fixed.reduce((s, l) => s + liabilityMonthlyPayment(l), 0);
  const rows = steps.map((bump) => {
    const stressedPayment = stressable.reduce((s, l) => s + amortizedPayment(l.balance, Number(l.interestRate || 0) + bump, l.termMonths), 0);
    const total = stressedPayment + fixedPayment;
    const dti = monthlyIncome > 0 ? (total / monthlyIncome) * 100 : 0;
    const cf = monthlyIncome - monthlyExpense - total;
    return { bump, total, dti, cf };
  });
  const worst = rows[rows.length - 1];
  return (
    <Card>
      <SimpleTitle title="Nếu lãi suất vay tăng thêm..." />
      {stressable.length === 0 ? <div style={{ color: C.textFaint, fontSize: 13 }}>Chưa có khoản vay nào đủ dữ liệu — nhập "Kỳ hạn còn lại" ở Sổ tài sản.</div> : (
        <>
          <div className="grid grid-cols-4 gap-2 text-xs mb-2" style={{ color: C.textFaint }}><div>Lãi suất tăng</div><div style={{ textAlign: "right" }}>Tổng trả nợ/th</div><div style={{ textAlign: "right" }}>DTI</div><div style={{ textAlign: "right" }}>Dòng tiền ròng</div></div>
          {rows.map((r) => { const band = dtiBand(r.dti); return (
            <div key={r.bump} className="grid grid-cols-4 gap-2 items-center py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: r.bump === 0 ? 600 : 400 }}>+{r.bump} điểm %</div>
              <div style={{ fontSize: 13, textAlign: "right" }}>{fmt(r.total)}</div>
              <div style={{ fontSize: 13, color: band.color, textAlign: "right", fontWeight: 600 }}>{r.dti.toFixed(0)}%</div>
              <div style={{ fontSize: 13, color: r.cf >= 0 ? C.success : C.danger, textAlign: "right" }}>{r.cf >= 0 ? "+" : ""}{fmt(r.cf)}</div>
            </div>
          ); })}
          <GoalImpactNote newCashflow={worst.cf} totalGoalContribution={totalGoalContribution} />
          <AIInterpretButton getPayload={() => ({ kich_ban: "Stress-test lãi suất vay", cac_muc_lai_tang: rows.map((r) => ({ tang_diem_pct: r.bump, tong_tra_no_thang: Math.round(r.total), DTI_pct: Math.round(r.dti), dong_tien_rong: Math.round(r.cf) })), tong_cam_ket_muc_tieu_thang: totalGoalContribution })} />
        </>
      )}
    </Card>
  );
}

function PrepaySimulator({ liabilities, liquidAssets, monthlyExpense, simSettings, totalGoalContribution }) {
  const [selectedId, setSelectedId] = useState(liabilities[0]?.id || "");
  const [prepayAmt, setPrepayAmt] = useState("");
  const [altReturn, setAltReturn] = useState(simSettings.defaultGoalReturn);
  const l = liabilities.find((x) => x.id === selectedId);
  const amt = Math.min(Number(prepayAmt) || 0, l?.balance || 0);
  let interestSaved = null, newPayment = null, remainingYears = 0;
  if (l && l.termMonths && amt > 0) {
    const newBalance = Number(l.balance) - amt;
    newPayment = amortizedPayment(newBalance, l.interestRate, l.termMonths);
    const oldTotalPaid = liabilityMonthlyPayment(l) * l.termMonths;
    const newTotalPaid = newPayment * l.termMonths + amt;
    interestSaved = oldTotalPaid - newTotalPaid;
    remainingYears = l.termMonths / 12;
  }
  const newRunway = monthlyExpense > 0 ? (liquidAssets - amt) / monthlyExpense : 0;
  // standard finance: opportunity cost — future value of that same amount if invested instead of prepaying
  const investFV = amt > 0 ? futureValue(amt, altReturn, remainingYears) : 0;
  const investGain = investFV - amt;
  return (
    <Card>
      <SimpleTitle title="Trả nợ sớm bằng tiền nhàn rỗi" />
      {liabilities.length === 0 ? <div style={{ color: C.textFaint, fontSize: 13 }}>Chưa có khoản vay nào.</div> : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Chọn khoản vay"><Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{liabilities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
            <Field label="Số tiền trả sớm (đ)"><TextInput type="number" value={prepayAmt} onChange={(e) => setPrepayAmt(e.target.value)} placeholder="0" /></Field>
          </div>
          {!l?.termMonths ? <div style={{ color: C.textFaint, fontSize: 13 }}>Khoản vay này chưa có "kỳ hạn còn lại".</div> : amt > 0 ? (
            <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div><div style={{ fontSize: 11, color: C.textFaint }}>Trả góp mới / tháng</div><div style={{ fontSize: 17, fontWeight: 700, color: C.success }}>{fmtFull(newPayment)}</div></div>
                <div><div style={{ fontSize: 11, color: C.textFaint }}>Lãi tiết kiệm ước tính</div><div style={{ fontSize: 17, fontWeight: 700, color: C.accentText }}>{fmtFull(Math.max(0, interestSaved))}</div></div>
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>Thanh khoản sau trả sớm: <b style={{ color: runwayBand(newRunway).color }}>{newRunway.toFixed(1)} tháng ({runwayBand(newRunway).label})</b></div>

              <div className="rounded-xl p-3 mb-2" style={{ background: C.bgPanel2, border: `1px solid ${C.accent}33` }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div style={{ fontSize: 11, color: C.accentText }}>So sánh: trả nợ vs đầu tư số tiền này</div>
                  <div className="flex items-center gap-1 flex-shrink-0"><span style={{ fontSize: 11, color: C.textFaint, whiteSpace: "nowrap" }}>Lợi nhuận thay thế</span><TextInput type="number" style={{ width: 55, flexShrink: 0 }} value={altReturn} onChange={(e) => setAltReturn(e.target.value)} /><span style={{ fontSize: 11, color: C.textFaint }}>%/năm</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span style={{ color: C.textMuted }}>Lãi tiết kiệm khi trả nợ (chắc chắn)</span><div style={{ fontSize: 14, fontWeight: 600, color: C.success }}>{fmt(Math.max(0, interestSaved))}</div></div>
                  <div><span style={{ color: C.textMuted }}>Lãi ước tính nếu đầu tư thay vào đó ({remainingYears.toFixed(0)} năm)</span><div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>{fmt(investGain)}</div></div>
                </div>
              </div>
              <AIInterpretButton getPayload={() => ({ kich_ban: "Trả nợ sớm", khoan_vay: l.name, so_tien_tra_som: amt, tra_gop_cu: Math.round(liabilityMonthlyPayment(l)), tra_gop_moi: Math.round(newPayment), lai_tiet_kiem_uoc_tinh: Math.round(Math.max(0, interestSaved)), quy_thanh_khoan_sau_thang: Number(newRunway.toFixed(1)), loi_nhuan_neu_dau_tu_thay_the_pct_nam: altReturn, lai_uoc_tinh_neu_dau_tu: Math.round(investGain), tong_cam_ket_muc_tieu_thang: totalGoalContribution })} />
            </div>
          ) : <div style={{ color: C.textFaint, fontSize: 13 }}>Nhập số tiền muốn trả sớm.</div>}
        </>
      )}
    </Card>
  );
}

/* -------------------------------- SETTINGS TAB -------------------------------- */
function RuleRow({ enabled, onToggle, label, children }) {
  return (
    <>
      <div className="flex items-center gap-2.5"><button onClick={onToggle} style={{ color: enabled ? C.accent : C.textFaint }}>{enabled ? <Bell size={16} /> : <BellOff size={16} />}</button><span style={{ fontSize: 13, color: enabled ? C.text : C.textFaint }}>{label}</span></div>
      <div className="flex items-center justify-end">{children}</div>
    </>
  );
}
function RuleGroupLabel({ children, first }) {
  return (
    <div style={{ gridColumn: "1 / -1", fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: first ? 0 : 6, paddingTop: first ? 0 : 10, borderTop: first ? "none" : `1px solid ${C.border}` }}>{children}</div>
  );
}

function SettingsTab({ alertSettings, setAlertSettings, simSettings, setSimSettings, dashboardSections, setDashboardSections }) {
  const toggle = (key) => setAlertSettings({ ...alertSettings, enabled: { ...alertSettings.enabled, [key]: !alertSettings.enabled[key] } });
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card>
        <SimpleTitle title="Ngưỡng & quy tắc cảnh báo" />
        <div className="grid gap-x-6 gap-y-4 items-center" style={{ gridTemplateColumns: "1fr auto" }}>
          <RuleGroupLabel first>Phân bổ rủi ro</RuleGroupLabel>
          <RuleRow enabled={alertSettings.enabled.safe} onToggle={() => toggle("safe")} label="Tỷ trọng an toàn vượt ngưỡng"><div className="flex items-center gap-2"><TextInput type="number" style={{ width: 70 }} value={alertSettings.safeMax} onChange={(e) => setAlertSettings({ ...alertSettings, safeMax: Number(e.target.value) })} /><span style={{ color: C.textFaint, fontSize: 12, width: 46, display: "inline-block" }}>%</span></div></RuleRow>
          <RuleRow enabled={alertSettings.enabled.speculative} onToggle={() => toggle("speculative")} label="Tỷ trọng đầu cơ vượt ngưỡng"><div className="flex items-center gap-2"><TextInput type="number" style={{ width: 70 }} value={alertSettings.speculativeMax} onChange={(e) => setAlertSettings({ ...alertSettings, speculativeMax: Number(e.target.value) })} /><span style={{ color: C.textFaint, fontSize: 12, width: 46, display: "inline-block" }}>%</span></div></RuleRow>
          <RuleRow enabled={alertSettings.enabled.concentration} onToggle={() => toggle("concentration")} label="Một tài sản chiếm tỷ trọng quá lớn"><div className="flex items-center gap-2"><TextInput type="number" style={{ width: 70 }} value={alertSettings.concentrationMax} onChange={(e) => setAlertSettings({ ...alertSettings, concentrationMax: Number(e.target.value) })} /><span style={{ color: C.textFaint, fontSize: 12, width: 46, display: "inline-block" }}>%</span></div></RuleRow>

          <RuleGroupLabel>Nợ vay & tín dụng</RuleGroupLabel>
          <RuleRow enabled={alertSettings.enabled.rate} onToggle={() => toggle("rate")} label="Lãi vay vượt ngưỡng"><div className="flex items-center gap-2"><TextInput type="number" style={{ width: 70 }} value={alertSettings.highRatePct} onChange={(e) => setAlertSettings({ ...alertSettings, highRatePct: Number(e.target.value) })} /><span style={{ color: C.textFaint, fontSize: 12, width: 46, display: "inline-block" }}>%/năm</span></div></RuleRow>
          <RuleRow enabled={alertSettings.enabled.due} onToggle={() => toggle("due")} label="Khoản vay sắp đáo hạn (30 ngày)" />
          <RuleRow enabled={alertSettings.enabled.dti} onToggle={() => toggle("dti")} label="DTI vượt ngưỡng"><div className="flex items-center gap-2"><TextInput type="number" style={{ width: 70 }} value={alertSettings.dtiMax} onChange={(e) => setAlertSettings({ ...alertSettings, dtiMax: Number(e.target.value) })} /><span style={{ color: C.textFaint, fontSize: 12, width: 46, display: "inline-block" }}>%</span></div></RuleRow>

          <RuleGroupLabel>Dòng tiền & thanh khoản</RuleGroupLabel>
          <RuleRow enabled={alertSettings.enabled.cashflow} onToggle={() => toggle("cashflow")} label="Dòng tiền tháng âm" />
          <RuleRow enabled={alertSettings.enabled.runway} onToggle={() => toggle("runway")} label="Quỹ thanh khoản dưới ngưỡng"><div className="flex items-center gap-2"><TextInput type="number" style={{ width: 70 }} value={alertSettings.runwayMin} onChange={(e) => setAlertSettings({ ...alertSettings, runwayMin: Number(e.target.value) })} /><span style={{ color: C.textFaint, fontSize: 12, width: 46, display: "inline-block" }}>tháng</span></div></RuleRow>

          <RuleGroupLabel>Mục tiêu & biến động tài sản</RuleGroupLabel>
          <RuleRow enabled={alertSettings.enabled.milestone} onToggle={() => toggle("milestone")} label="Mục tiêu có nguy cơ chậm tiến độ" />
          <RuleRow enabled={alertSettings.enabled.drawdown} onToggle={() => toggle("drawdown")} label="Tài sản ròng giảm so với đỉnh"><div className="flex items-center gap-2"><TextInput type="number" style={{ width: 70 }} value={alertSettings.drawdownMax} onChange={(e) => setAlertSettings({ ...alertSettings, drawdownMax: Number(e.target.value) })} /><span style={{ color: C.textFaint, fontSize: 12, width: 46, display: "inline-block" }}>%</span></div></RuleRow>
        </div>
      </Card>

      <Card>
        <SimpleTitle title="Tùy chỉnh hiển thị Tổng quan" />
        <DashboardSectionsSettings sections={dashboardSections} onChange={setDashboardSections} onReset={() => setDashboardSections(DEFAULT_DASHBOARD_SECTIONS)} />
      </Card>

      <Card>
        <SimpleTitle title="Giá trị mặc định cho tab Mô phỏng" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Lãi suất vay mặc định (%/năm)"><TextInput type="number" value={simSettings.defaultRate} onChange={(e) => setSimSettings({ ...simSettings, defaultRate: Number(e.target.value) })} /></Field>
          <Field label="Kỳ hạn vay mặc định (năm)"><TextInput type="number" value={simSettings.defaultTermYears} onChange={(e) => setSimSettings({ ...simSettings, defaultTermYears: Number(e.target.value) })} /></Field>
          <Field label="Trả trước mặc định (%)"><TextInput type="number" value={simSettings.defaultDownPct} onChange={(e) => setSimSettings({ ...simSettings, defaultDownPct: Number(e.target.value) })} /></Field>
          <Field label="Lợi nhuận kỳ vọng mục tiêu mặc định (%/năm)"><TextInput type="number" value={simSettings.defaultGoalReturn} onChange={(e) => setSimSettings({ ...simSettings, defaultGoalReturn: Number(e.target.value) })} /></Field>
        </div>
      </Card>

      <Card>
        <SimpleTitle title="Tùy chỉnh khác" />
        <Field label="Định dạng số tiền">
          <Select value={simSettings.unitFormat} onChange={(e) => setSimSettings({ ...simSettings, unitFormat: e.target.value })}>
            <option value="compact">Rút gọn (VD: 2.5 tỷ)</option>
            <option value="full">Đầy đủ (VD: 2.500.000.000 đ)</option>
          </Select>
        </Field>
        <div className="flex items-center gap-2 mt-3" style={{ fontSize: 11, color: C.textFaint }}><Info size={12} /> Toàn bộ dữ liệu (tài sản, mục tiêu, lịch sử) được lưu riêng tư trên thiết bị của bạn.</div>
      </Card>

      <Card>
        <SimpleTitle title="Từ điển thuật ngữ" />
        <div className="flex flex-col gap-4">
          {Object.values(TERMS).map((t, i) => (
            <div key={i}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{t.term}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2, lineHeight: 1.6 }}>{t.def}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
