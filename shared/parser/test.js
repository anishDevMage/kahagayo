const P = require("./parser.js");
const ctx = { today: "2026-11-01", accounts: P.DEFAULT_ACCOUNTS, defaultAccount: "cash" };
const cases = [
  ["lunch 85", { type: "expense", amount: 85, category: "food", account: "cash", note: "lunch", confident: true }],
  ["grab 120 tm", { type: "expense", amount: 120, category: "transport", account: "truemoney", note: "grab" }],
  ["7-11 snacks 45 truemoney", { amount: 45, account: "truemoney" }],
  ["top up tm 500 from kbank", { type: "transfer", amount: 500, account: "bank", toAccount: "truemoney", confident: true }],
  ["topup 300", { type: "transfer", amount: 300, account: "bank", toAccount: "truemoney" }],
  ["phone top up 200 tm", { type: "expense", amount: 200, category: "bills", account: "truemoney" }],
  ["+15000 allowance", { type: "income", amount: 15000, category: "pay" }],
  ["salary 15,000", { type: "income", amount: 15000, category: "pay" }],
  ["rent 5,000 bank", { type: "expense", amount: 5000, category: "home", account: "bank" }],
  ["ข้าว 50", { type: "expense", amount: 50, category: "food", account: "cash" }],
  ["bts 44 yesterday", { amount: 44, category: "transport", date: "2026-10-31", note: "bts" }],
  ["atm 1000", { type: "transfer", amount: 1000, account: "bank", toAccount: "cash" }],
  ["cafe amazon 65", { amount: 65, category: "food" }],
  ["water bill 150", { amount: 150, category: "bills" }],
  ["1.2k shopee", { amount: 1200, category: "shopping" }],
  ["85 kfc", { amount: 85, category: "food" }],
  ["movie 220 at 19:30", { amount: 220, category: "fun" }],
  ["something 99", { amount: 99, category: "other", confident: false }],
  ["refund shopee 300", { type: "income", amount: 300, category: "refund" }],
  ["kbank to tm 1000", { type: "transfer", amount: 1000, account: "bank", toAccount: "truemoney" }],
  ["netflix 419", { amount: 419, category: "bills" }],
  ["500 from mom", { type: "income", amount: 500, category: "received" }],
  ["grabfood 180", { amount: 180, category: "food" }],
  ["coffee ฿65.50 scb", { amount: 65.5, category: "food", account: "bank" }],
  ["3 coffees 180", { amount: 180 }],
  ["hello", { amount: null, confident: false }],
  ["กาแฟ 60 ทรูมันนี่", { amount: 60, category: "food", account: "truemoney" }],
  ["deposit 2000", { type: "transfer", amount: 2000, account: "cash", toAccount: "bank" }],
];
let fail = 0;
for (const [input, exp] of cases) {
  const out = P.parseEntry(input, ctx);
  const d = out[0] || {};
  const bad = Object.entries(exp).filter(([k, v]) => d[k] !== v);
  if (bad.length) { fail++; console.log("FAIL", JSON.stringify(input), "->", JSON.stringify(d), "expected", JSON.stringify(exp)); }
  else console.log("ok  ", input.padEnd(28), "->", d.type, d.amount, d.category || "", d.account + (d.toAccount ? ">" + d.toAccount : ""), JSON.stringify(d.note), d.confident ? "✓" : "?");
}
// multi-item
const multi = P.parseEntry("lunch 85, coffee 60 tm", ctx);
console.log("multi:", multi.map(d => [d.note, d.amount, d.category, d.account].join("|")).join("  ;  "));
if (!(multi.length === 2 && multi.every(d => d.account === "truemoney"))) { fail++; console.log("FAIL multi"); }
const multi2 = P.parseEntry("lunch and coffee 145", ctx);
console.log("multi2:", multi2.map(d => [d.note, d.amount, d.category].join("|")).join(" ; "));
if (multi2.length !== 1 || multi2[0].amount !== 145) { fail++; console.log("FAIL multi2"); }
// month math
const txns = [
  { date: "2026-11-01", type: "expense", amount: 85.1 },
  { date: "2026-11-01", type: "expense", amount: 0.2 },
  { date: "2026-11-02", type: "expense", amount: 120 },
  { date: "2026-11-03", type: "income", amount: 15000 },
  { date: "2026-11-03", type: "transfer", amount: 500 },
  { date: "2026-10-31", type: "expense", amount: 999 },
];
const s1 = P.monthSummary(txns, 2026, 11, "2026-11-03", 9000);
console.log("summary:", JSON.stringify({ spent: s1.spent, received: s1.received, dim: s1.dim, elapsed: s1.elapsed, avg: s1.dailyAvg, pace: s1.pace, budget: s1.budget, perDay: s1.perDay.slice(0, 4) }));
if (s1.spent !== 205.3 || s1.received !== 15000 || s1.dim !== 30 || s1.pace !== Math.round(205.3 / 3 * 30) || s1.budget.daysLeft !== 28 || s1.budget.perDay !== Math.floor((9000 - 205.3) / 28)) { fail++; console.log("FAIL summary"); }
const s2 = P.monthSummary(txns, 2026, 11, "2026-11-01", null);
if (s2.pace !== null || s2.elapsed !== 1) { fail++; console.log("FAIL pace gate"); }
console.log(fail ? fail + " failures" : "all passed");
