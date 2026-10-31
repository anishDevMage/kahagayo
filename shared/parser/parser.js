// ---------- Kahagayo: categories, accounts and the chat-line parser (pure, no DOM) ----------

const EXPENSE_CATS = [
  { id: "food", name: "Food & drink", code: "FOOD", kw: ["lunch", "dinner", "breakfast", "brunch", "meal", "food", "rice", "noodle", "noodles", "coffee", "cafe", "café", "cafe amazon", "café amazon", "tea", "milk tea", "bubble tea", "boba", "snack", "snacks", "dessert", "bakery", "cake", "pizza", "burger", "kfc", "mcdonald", "mcdonalds", "starbucks", "drink", "drinks", "juice", "beer", "canteen", "grabfood", "grab food", "lineman", "line man", "foodpanda", "robinhood", "ข้าว", "อาหาร", "กาแฟ", "ชานม", "ก๋วยเตี๋ยว", "ขนม", "เบียร์", "ส้มตำ", "หมูกระทะ"] },
  { id: "groceries", name: "Groceries", code: "GROC", kw: ["grocery", "groceries", "7-11", "7/11", "7eleven", "7-eleven", "seven", "lotus", "lotus's", "big c", "bigc", "tops", "makro", "villa market", "gourmet market", "family mart", "familymart", "lawson", "supermarket", "market", "ตลาด", "เซเว่น", "โลตัส", "แม็คโคร"] },
  { id: "transport", name: "Transport", code: "TRAN", kw: ["grab", "bolt", "taxi", "bts", "mrt", "arl", "airport link", "train", "bus", "van", "motorbike", "motosai", "fuel", "petrol", "gas", "parking", "toll", "ferry", "boat", "flight", "แท็กซี่", "รถไฟ", "รถไฟฟ้า", "รถเมล์", "วิน", "น้ำมัน", "ทางด่วน"] },
  { id: "shopping", name: "Shopping", code: "SHOP", kw: ["shopping", "shop", "clothes", "shirt", "shoes", "shopee", "lazada", "amazon", "uniqlo", "h&m", "ikea", "mall", "electronics", "gadget", "ช้อปปิ้ง", "เสื้อ", "รองเท้า"] },
  { id: "bills", name: "Bills & subscriptions", code: "BILL", kw: ["bill", "bills", "electric", "electricity", "water bill", "internet", "wifi", "fiber", "phone", "mobile", "ais", "dtac", "truemove", "true move", "sim", "subscription", "netflix", "spotify", "youtube premium", "icloud", "chatgpt", "claude", "ค่าไฟ", "ค่าน้ำ", "ค่าเน็ต", "ค่าโทรศัพท์", "บิล", "มือถือ"] },
  { id: "home", name: "Rent & home", code: "HOME", kw: ["rent", "dorm", "dormitory", "room", "condo", "apartment", "laundry", "cleaning", "household", "ค่าเช่า", "หอ", "ซักผ้า"] },
  { id: "health", name: "Health", code: "HLTH", kw: ["pharmacy", "medicine", "clinic", "hospital", "doctor", "dentist", "gym", "fitness", "vitamin", "vitamins", "boots", "watsons", "ยา", "หมอ", "โรงพยาบาล", "คลินิก", "ฟิตเนส"] },
  { id: "study", name: "Study", code: "STDY", kw: ["book", "books", "textbook", "course", "course fee", "tuition", "printing", "print", "photocopy", "stationery", "udemy", "coursera", "หนังสือ", "ปริ้น", "ถ่ายเอกสาร"] },
  { id: "fun", name: "Fun & travel", code: "FUN", kw: ["movie", "cinema", "concert", "bar", "party", "game", "games", "steam", "karaoke", "trip", "travel", "hotel", "massage", "ticket", "tickets", "หนัง", "เที่ยว", "คาราโอเกะ", "นวด"] },
  { id: "gifts", name: "Gifts & giving", code: "GIFT", kw: ["gift", "gifts", "present", "donation", "donate", "temple", "tamboon", "merit", "ของขวัญ", "ทำบุญ"] },
  { id: "other", name: "Other", code: "OTHR", kw: [] },
];

const INCOME_CATS = [
  { id: "pay", name: "Pay & allowance", code: "PAY", kw: ["salary", "allowance", "stipend", "scholarship", "paycheck", "payday", "wage", "wages", "income", "earned", "got paid", "เงินเดือน"] },
  { id: "received", name: "Money received", code: "RCVD", kw: ["received", "from mom", "from dad", "from home", "from parents", "ได้รับ", "ได้เงิน"] },
  { id: "refund", name: "Refund", code: "RFND", kw: ["refund", "refunded", "cashback", "คืนเงิน"] },
  { id: "other_in", name: "Other income", code: "OTHR", kw: [] },
];

const DEFAULT_ACCOUNTS = [
  { id: "cash", name: "Cash", code: "CSH" },
  { id: "truemoney", name: "TrueMoney", code: "TMN" },
  { id: "bank", name: "Bank", code: "BNK" },
];

const ACCOUNT_ALIASES = {
  cash: ["cash", "เงินสด"],
  truemoney: ["tm", "tmn", "truemoney", "true money", "true wallet", "truewallet", "wallet", "ทรูมันนี่", "ทรูวอเล็ท"],
  bank: ["bank", "kbank", "k plus", "kplus", "scb", "scb easy", "bbl", "bangkok bank", "ktb", "krungthai", "krungsri", "ttb", "gsb", "uob", "cimb", "promptpay", "prompt pay", "qr", "debit", "กสิกร", "ไทยพาณิชย์", "กรุงไทย", "กรุงศรี", "พร้อมเพย์"],
};

const TOPUP_KW = ["top up", "top-up", "topup", "reload", "เติมเงิน"];
const WITHDRAW_KW = ["withdraw", "withdrew", "atm", "ถอน", "ถอนเงิน"];
const DEPOSIT_KW = ["deposit", "deposited", "ฝาก", "ฝากเงิน"];
const PHONE_KW = ["phone", "mobile", "ais", "dtac", "truemove", "true move", "sim", "มือถือ"];
const YESTERDAY_KW = ["yesterday", "เมื่อวาน", "เมื่อวานนี้"];
const TODAY_KW = ["today", "วันนี้"];
const FILLER_KW = ["from", "to", "via", "with", "using", "paid", "spent", "bought", "by", "at", "on", "baht", "thb", "บาท", "จาก", "ไป", "เข้า"];

const CAT_BY_ID = {};
EXPENSE_CATS.forEach((c) => { CAT_BY_ID[c.id] = Object.assign({ type: "expense" }, c); });
INCOME_CATS.forEach((c) => { CAT_BY_ID[c.id] = Object.assign({ type: "income" }, c); });

const THAI_RE = /[฀-๿]/;

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// All occurrences of a keyword in lower-cased text. Latin keywords match on word edges;
// Thai is written without spaces, so Thai keywords match anywhere.
function findAll(text, kw, plural) {
  const out = [];
  if (!kw) return out;
  if (THAI_RE.test(kw)) {
    let i = text.indexOf(kw);
    while (i !== -1) { out.push({ start: i, end: i + kw.length }); i = text.indexOf(kw, i + kw.length); }
    return out;
  }
  const re = new RegExp("(^|[^a-z0-9])(" + escapeRe(kw) + (plural ? "(?:e?s)?" : "") + ")(?=$|[^a-z0-9])", "g");
  let m;
  while ((m = re.exec(text))) {
    const s = m.index + m[1].length;
    out.push({ start: s, end: s + m[2].length });
    re.lastIndex = s + m[2].length;
  }
  return out;
}

function anyMatch(text, list) {
  for (const kw of list) { const f = findAll(text, kw); if (f.length) return f[0]; }
  return null;
}

function spansFor(text, list, plural) {
  const spans = [];
  for (const kw of list) spans.push(...findAll(text, kw, plural));
  return spans;
}

function mask(text, spans) {
  const chars = text.split("");
  for (const s of spans) for (let i = s.start; i < s.end; i++) chars[i] = " ";
  return chars.join("");
}

function pad2(n) { return String(n).padStart(2, "0"); }
function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return ymd(dt);
}

function round2(n) { return Math.round(Number(n) * 100) / 100; }
function sumBaht(list) {
  let satang = 0;
  for (const v of list) satang += Math.round(Number(v) * 100);
  return satang / 100;
}

// Account mentions in order of appearance, longest alias first so "scb easy" beats "scb".
function accountMentions(text, accounts) {
  const found = [];
  for (const a of accounts) {
    const aliases = new Set([...(ACCOUNT_ALIASES[a.id] || []), a.name.toLowerCase(), (a.code || "").toLowerCase()]);
    for (const al of aliases) {
      if (!al || al.length < 2) continue;
      for (const sp of findAll(text, al)) found.push({ id: a.id, start: sp.start, end: sp.end, len: al.length });
    }
  }
  found.sort((x, y) => x.start - y.start || y.len - x.len);
  const out = [];
  let lastEnd = -1;
  for (const f of found) { if (f.start >= lastEnd) { out.push(f); lastEnd = f.end; } }
  return out;
}

// Amount candidates in masked text: "85", "1,250", "85.50", "฿85", "85 baht", "1.2k", "+15000".
function amountCandidates(masked) {
  const re = /(\+\s*)?(฿\s*|thb\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?(?!\d)(?:\s*(k)(?![a-z]))?/gi;
  const out = [];
  let m;
  while ((m = re.exec(masked))) {
    const intPart = m[3].replace(/,/g, "");
    let value = Number(intPart + (m[4] ? "." + m[4] : ""));
    if (m[5]) value *= 1000;
    const after = masked.slice(m.index + m[0].length);
    const suffix = after.match(/^\s*(฿|baht|thb|บาท|b(?![a-z]))/i);
    out.push({
      value, plus: !!m[1], currency: !!m[2] || !!suffix,
      start: m.index, end: m.index + m[0].length + (suffix ? suffix[0].length : 0),
    });
  }
  return out.filter((c) => c.value > 0);
}

function bestCategory(text) {
  let best = null;
  for (const c of [...EXPENSE_CATS, ...INCOME_CATS]) {
    for (const kw of c.kw) {
      for (const sp of findAll(text, kw, true)) {
        const cand = { id: c.id, len: kw.length, start: sp.start, end: sp.end };
        if (!best || cand.len > best.len || (cand.len === best.len && cand.start < best.start)) best = cand;
      }
    }
  }
  return best;
}

function cleanNote(original, removeSpans) {
  const keep = original.split("");
  for (const s of removeSpans) for (let i = s.start; i < s.end; i++) keep[i] = " ";
  return keep.join("")
    .replace(/[+฿]/g, " ")
    .replace(/\s*[-–—>→:,;.]+\s*$/g, "")
    .replace(/^\s*[-–—>→:,;.]+\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse one piece (no separators) of a chat line into a draft transaction.
function parseOne(original, ctx) {
  const text = original.toLowerCase();
  const accounts = ctx.accounts && ctx.accounts.length ? ctx.accounts : DEFAULT_ACCOUNTS;
  const has = (id) => accounts.some((a) => a.id === id);
  const draft = {
    type: "expense", amount: null, category: null, account: null, toAccount: null,
    date: ctx.today, note: "", source: "chat", raw: original.trim(), confident: false,
  };

  // Words that must not be read as amounts or kept in the note.
  const mentions = accountMentions(text, accounts);
  const catSpans = [];
  for (const c of [...EXPENSE_CATS, ...INCOME_CATS]) catSpans.push(...spansFor(text, c.kw, true));
  const timeSpans = [];
  const timeRe = /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(?:am|pm)\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi;
  let tm;
  while ((tm = timeRe.exec(text))) timeSpans.push({ start: tm.index, end: tm.index + tm[0].length });
  const masked = mask(text, [...mentions, ...catSpans, ...timeSpans]);

  // Amount: a number with a currency mark wins, then one with "+", then the largest.
  const cands = amountCandidates(masked);
  let amt = cands.find((c) => c.currency) || cands.find((c) => c.plus) || null;
  if (!amt && cands.length) amt = cands.reduce((a, b) => (b.value > a.value ? b : a));
  if (amt) draft.amount = round2(amt.value);

  // Date words.
  const yest = anyMatch(text, YESTERDAY_KW);
  if (yest) draft.date = addDays(ctx.today, -1);

  // Transfer between the person's own accounts?
  const topup = anyMatch(text, TOPUP_KW);
  const phone = anyMatch(text, PHONE_KW);
  const withdraw = anyMatch(text, WITHDRAW_KW);
  const deposit = anyMatch(text, DEPOSIT_KW);
  const distinct = [...new Set(mentions.map((m) => m.id))];
  const dirWord = /(^|[^a-z])(to|into)([^a-z]|$)|→|->|>|ไป|เข้า/.test(text);
  const fromIdx = (() => { const f = findAll(text, "from")[0] || findAll(text, "จาก")[0]; return f ? f.start : -1; })();

  if (topup && !phone) {
    draft.type = "transfer";
    const wallet = has("truemoney") ? "truemoney" : null;
    const nonWallet = mentions.find((m) => m.id !== wallet);
    draft.toAccount = wallet || (mentions[0] && mentions[0].id) || null;
    draft.account = (nonWallet && nonWallet.id !== draft.toAccount ? nonWallet.id : null) || (has("bank") && draft.toAccount !== "bank" ? "bank" : null);
  } else if (withdraw) {
    draft.type = "transfer";
    const src = mentions.find((m) => m.id !== "cash");
    draft.account = src ? src.id : (has("bank") ? "bank" : null);
    draft.toAccount = has("cash") ? "cash" : null;
  } else if (deposit) {
    draft.type = "transfer";
    const dst = mentions.find((m) => m.id !== "cash");
    draft.account = has("cash") ? "cash" : null;
    draft.toAccount = dst ? dst.id : (has("bank") ? "bank" : null);
  } else if (distinct.length >= 2 && (dirWord || fromIdx !== -1)) {
    draft.type = "transfer";
    let from = mentions[0], to = mentions.find((m) => m.id !== from.id);
    if (fromIdx !== -1) {
      const afterFrom = mentions.find((m) => m.start > fromIdx);
      if (afterFrom) { from = afterFrom; to = mentions.find((m) => m.id !== from.id); }
    }
    draft.account = from.id;
    draft.toAccount = to ? to.id : null;
  }

  if (draft.type === "transfer") {
    const fromName = (accounts.find((a) => a.id === draft.account) || {}).name || "?";
    const toName = (accounts.find((a) => a.id === draft.toAccount) || {}).name || "?";
    const removeSpans = [...mentions, ...timeSpans, ...spansFor(text, [...TOPUP_KW, ...WITHDRAW_KW, ...DEPOSIT_KW, ...YESTERDAY_KW, ...TODAY_KW, ...FILLER_KW])];
    if (amt) removeSpans.push({ start: amt.start, end: amt.end });
    draft.note = cleanNote(original, removeSpans) || (topup ? "Top up " + toName : withdraw ? "Cash withdrawal" : deposit ? "Cash deposit" : fromName + " to " + toName);
    draft.confident = !!(draft.amount && draft.account && draft.toAccount && draft.account !== draft.toAccount);
    return draft;
  }

  // Income or expense.
  const cat = bestCategory(text);
  const incomeCat = cat && CAT_BY_ID[cat.id].type === "income";
  if ((amt && amt.plus) || incomeCat) draft.type = "income";
  if (draft.type === "income") {
    draft.category = incomeCat ? cat.id : "other_in";
  } else {
    draft.category = cat ? cat.id : "other";
  }
  draft.account = mentions.length ? mentions[0].id : (ctx.defaultAccount || accounts[0].id);

  const removeSpans = [...mentions, ...timeSpans, ...spansFor(text, [...YESTERDAY_KW, ...TODAY_KW, ...FILLER_KW])];
  if (amt) removeSpans.push({ start: amt.start, end: amt.end });
  draft.note = cleanNote(original, removeSpans) || CAT_BY_ID[draft.category].name;
  draft.confident = !!(draft.amount && draft.category !== "other" && draft.category !== "other_in");
  return draft;
}

// A chat line may hold several entries: "lunch 85, coffee 60 tm".
function parseEntry(line, ctx) {
  const src = String(line || "").trim();
  if (!src) return [];
  const parts = src.split(/\s*;\s*|\n+|,\s+|\s+and\s+|\s+&\s+|\s+และ\s*/i).map((p) => p.trim()).filter(Boolean);
  let drafts;
  if (parts.length > 1) {
    drafts = parts.map((p) => parseOne(p, ctx));
    if (drafts.some((d) => !d.amount)) drafts = [parseOne(src, ctx)];
    else {
      // One account named in one part applies to every part that names none.
      const named = drafts.filter((d, i) => accountMentions(parts[i].toLowerCase(), ctx.accounts || DEFAULT_ACCOUNTS).length);
      if (named.length === 1 && named[0].type !== "transfer") {
        drafts.forEach((d, i) => {
          if (d.type !== "transfer" && !accountMentions(parts[i].toLowerCase(), ctx.accounts || DEFAULT_ACCOUNTS).length) d.account = named[0].account;
        });
      }
    }
  } else {
    drafts = [parseOne(src, ctx)];
  }
  return drafts;
}

// ---------- month arithmetic ----------
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

// Summary numbers for one month. `today` is "YYYY-MM-DD"; txns are plain objects.
function monthSummary(txns, y, m, today, budget) {
  const prefix = y + "-" + pad2(m) + "-";
  const inMonth = txns.filter((t) => typeof t.date === "string" && t.date.startsWith(prefix));
  const spent = sumBaht(inMonth.filter((t) => t.type === "expense").map((t) => t.amount));
  const received = sumBaht(inMonth.filter((t) => t.type === "income").map((t) => t.amount));
  const dim = daysInMonth(y, m);
  const [ty, tmo, td] = today.split("-").map(Number);
  let elapsed;
  if (ty === y && tmo === m) elapsed = td;
  else if (ty > y || (ty === y && tmo > m)) elapsed = dim;
  else elapsed = 0;
  const isCurrent = ty === y && tmo === m;
  const dailyAvg = elapsed > 0 ? round2(spent / elapsed) : 0;
  const pace = isCurrent && elapsed >= 3 ? Math.round((spent / elapsed) * dim) : null;
  let budgetInfo = null;
  if (budget && budget > 0) {
    const left = round2(budget - spent);
    const daysLeft = isCurrent ? dim - td + 1 : (elapsed === 0 ? dim : 0);
    budgetInfo = { budget, left, daysLeft, perDay: daysLeft > 0 && left > 0 ? Math.floor(left / daysLeft) : 0, share: Math.min(1, spent / budget), over: spent > budget };
  }
  const perDay = new Array(dim).fill(0);
  inMonth.filter((t) => t.type === "expense").forEach((t) => {
    const d = Number(t.date.slice(8, 10));
    if (d >= 1 && d <= dim) perDay[d - 1] = round2(perDay[d - 1] + Number(t.amount));
  });
  return { inMonth, spent, received, dim, elapsed, isCurrent, dailyAvg, pace, budget: budgetInfo, perDay };
}

if (typeof module !== "undefined") {
  module.exports = { EXPENSE_CATS, INCOME_CATS, DEFAULT_ACCOUNTS, parseEntry, parseOne, monthSummary, sumBaht, round2, addDays, daysInMonth, accountMentions };
}
