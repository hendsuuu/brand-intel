(() => {
"use strict";
let D = null;          /* active project dataset (set by activateProject) */
const C = window.Charts, esc = C.esc, I = window.I18N;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sum = (a, k) => a.reduce((x, y) => x + (k ? y[k] : y), 0);

/* ---------------- Storage (per-viewer conveniences only) ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("bi." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("bi." + k, JSON.stringify(v)); } catch {} }
};

/* ---------------- State ---------------- */
const S = {
  lang: store.get("lang", "en"), theme: store.get("theme", null), range: store.get("range", 30),
  route: "home", q: {},
  m: { sources: null, sent: [], emo: [], geo: [], minInf: 0, imp: "all", visit: "all", smart: "", topic: "", search: "", sort: "new", sel: null, limit: 40 },
  ins: { tab: "engagement" }, alerts: { tab: "activity" }, ws: { tab: "team" },
  st: { tpl: "statement", tone: "warm", lang: "en", msgs: [0, 1], brief: "", ctx: null, text: "", gen: null, draftId: null },
  pl: { month: new Date(2026, 10, 1), view: "month", channel: "", status: "", kinds: ["social", "press", "internal"], prefill: null },
  val: { method: "ave", sort: "value" }
};

/* ---------------- i18n + formatting ---------------- */
const missing = window.__missing = new Set();
function t(k, v) {
  let s = I[S.lang] && I[S.lang][k];
  if (s === undefined) { missing.add(S.lang + ":" + k); s = I.en[k]; }
  if (s === undefined) s = k;
  if (v) s = s.replace(/\{(\w+)\}/g, (_, n) => (v[n] ?? ""));
  /* UI copy is written for the first project; other projects get their own name. */
  if (D && D.project.id !== "kkb" && s.includes("Kura Kura Bali")) s = s.split("Kura Kura Bali").join(D.project.name);
  return s;
}
/* Plural-aware lookup: uses "<key>.one" when n === 1 and the language defines it. */
function tn(k, n, v = {}) { return t(n === 1 && I[S.lang][k + ".one"] ? k + ".one" : k, { ...v, n }); }
const loc = () => (S.lang === "id" ? "id-ID" : "en-GB");
const nf = (n, o) => new Intl.NumberFormat(loc(), o).format(n);
const fN = n => nf(n, { notation: "compact", maximumFractionDigits: 1 });
const fI = n => nf(Math.round(n));
const fP = (x, d = 0) => nf(x, { style: "percent", maximumFractionDigits: d });
const fIDR = n => nf(n, { style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 1 });
const fD = (d, o = { day: "numeric", month: "short" }) => new Intl.DateTimeFormat(loc(), o).format(d);
const fDT = d => fD(d, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fTime = d => fD(d, { hour: "2-digit", minute: "2-digit" });
function ago(d) {
  const s = (d - D.TODAY) / 1000, a = Math.abs(s), r = new Intl.RelativeTimeFormat(loc(), { numeric: "auto" });
  if (a < 3600) return r.format(Math.round(s / 60), "minute");
  if (a < 86400) return r.format(Math.round(s / 3600), "hour");
  if (a < 86400 * 7) return r.format(Math.round(s / 86400), "day");
  return fD(d);
}

/* ---------------- Icons ---------------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  bars: '<path d="M6 20V10M12 20V4M18 20v-7"/>',
  coins: '<circle cx="9" cy="9" r="6"/><path d="M15.5 9.6a6 6 0 1 1-5.9 6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checksq: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  alertc: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  arrowr: '<path d="M5 12h14M13 5l7 7-7 7"/>'
};
const ic = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;

/* ---------------- Shared bits ---------------- */
const SENT = { pos: "--pos", neu: "--neu", neg: "--neg" };
const SRC_CODE = { blogs: "BL", bluesky: "BS", instagram: "IG", facebook: "FB", x: "X", tiktok: "TT", youtube: "YT", news: "NW", reviews: "RV", forums: "FR", linkedin: "in", google: "G" };
const CH_COLOR = { instagram: "--s1", facebook: "--s2", linkedin: "--s3", google: "--s4" };
const KIND_COLOR = { social: "--s1", press: "--s2", internal: "--s3" };
const sentPill = s => `<span class="pill"><i class="dot" style="background:var(${SENT[s]})"></i>${t("s." + s)}</span>`;
const srcBadge = s => `<span class="src" title="${esc(t("src." + s))}" aria-label="${esc(t("src." + s))}">${SRC_CODE[s] || "?"}</span>`;
const infoBtn = txt => `<button class="info" type="button" data-tip="${esc(txt)}" aria-label="${esc(txt)}">${ic("info")}</button>`;
const legend = items => `<div class="legend">${items.map(([l, c, line]) => `<span><i class="${line ? "line" : ""}" style="background:var(${c})"></i>${esc(l)}</span>`).join("")}</div>`;
const statusDot = st => `<span class="st ${st}"><i></i>${t("pst." + st)}</span>`;
const sev = s => `<span class="sev ${s}">${ic(s === "critical" ? "alert" : s === "good" ? "check" : "alertc")}${t("sev." + s)}</span>`;
const member = id => D.team.find(m => m.id === id);
/* Page header. To keep screens calm, the description lives behind an (i) next to the title;
   pages whose subtitle carries live numbers (Home) pass keep=true to show it. */
function head(title, desc, actions = "", keep = false) {
  return `<div class="page-head"><div class="titles"><h1>${title}${desc && !keep ? infoBtn(desc.replace(/<[^>]+>/g, "")) : ""}</h1>${desc && keep ? `<p>${desc}</p>` : ""}</div><div class="row wrap">${actions}</div></div>`;
}

function deltaHTML(cur, prev, { goodUp = true, points = false, abs = false } = {}) {
  const d = points ? (cur - prev) * 100 : abs ? cur - prev : prev ? (cur - prev) / prev : 0;
  const up = d >= 0, good = up === goodUp;
  const txt = points || abs ? `${up ? "+" : "−"}${nf(Math.abs(d), { maximumFractionDigits: 0 })} ${t("common.pts")}` : `${up ? "+" : "−"}${fP(Math.abs(d))}`;
  return `<span class="${good ? "up" : "down"}" aria-label="${up ? t("common.up") : t("common.down")} ${txt}">${up ? "▲" : "▼"} ${txt}</span> ${t("common.vsPrev")}`;
}
function kpi(label, value, delta, info) {
  return `<div class="card kpi"><div class="label">${label}${info ? infoBtn(info) : ""}</div><div class="value">${value}</div><div class="delta">${delta}</div></div>`;
}
function chartCard({ id, title, info, leg, right = "", table, foot = "" }) {
  return `<section class="card"><div class="card-head"><h2>${title}</h2>${info ? infoBtn(info) : ""}<span class="spacer"></span>${right}
    <button class="btn sm ghost" data-tbl="${id}" aria-pressed="false">${t("common.table")}</button></div>
    <div class="card-body">${leg ? `<div style="margin-bottom:10px">${leg}</div>` : ""}<div class="chart" id="${id}"></div>
    <div class="scroll-x" id="${id}-table" hidden>${table}</div>${foot}</div></section>`;
}
function tableHTML(cols, rows) {
  return `<table class="t"><thead><tr>${cols.map(c => `<th class="${c.r ? "r" : ""}">${c.l}</th>`).join("")}</tr></thead><tbody>${rows.map(r =>
    `<tr>${r.map((v, i) => `<td class="${cols[i].r ? "r num" : ""}">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function hbars(rows, color = "--s1") {
  const m = Math.max(...rows.map(r => r.v));
  return rows.map(r => `<div class="hbar"><span class="ink2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.l}</span>
    <div class="track" role="img" aria-label="${esc(r.l)}: ${r.d || fI(r.v)}"><i style="width:${(r.v / m) * 100}%;background:var(${r.c || color})"></i></div><b class="num">${r.d || fN(r.v)}</b></div>`).join("");
}
function seg100(parts) {
  const tot = sum(parts, "v");
  return `<div class="seg100" role="img" aria-label="${esc(parts.map(p => p.l + " " + fP(p.v / tot)).join(", "))}">${parts.map(p =>
    `<i style="width:${(p.v / tot) * 100}%;background:var(${p.c})" data-tip="${esc(p.l)}: ${fP(p.v / tot)}"></i>`).join("")}</div>`;
}
function emptyState(icon, title, body) { return `<div class="empty">${ic(icon)}<b>${title}</b><p>${body}</p></div>`; }

/* ---------------- Scoring ----------------
   All scores use log scales so a single viral post or a giant outlet can't dominate.
   Impact (0–10, per mention)   = 40% reach + 40% interactions + 20% author audience
   Influence (0–10, per author) = 60% audience size + 40% average interactions per mention
   Presence (0–100, per brand)  = 35% mention volume + 35% reach + 30% interactions        */
const clamp01 = x => Math.max(0, Math.min(1, x));
const lnorm = (v, lo, hi) => clamp01((Math.log10(Math.max(v, 1)) - lo) / (hi - lo));
const inter = m => m.reactions + m.comments + m.shares;
/* Scale bands are calibrated to Kura Kura Bali's volume (reach 30–100K, interactions 1–1,000 per mention); re-tune in the backend as the brand grows. */
const impact = m => Math.round(100 * (0.4 * lnorm(m.reach, 1.5, 5) + 0.4 * lnorm(inter(m) + 1, 0, 3) + 0.2 * lnorm(m.author.followers, 2, 6.5))) / 10;
function influence(a) {
  const ms = D.mentions.filter(x => x.author === a), avg = ms.length ? sum(ms.map(inter)) / ms.length : 0;
  return Math.round(100 * (0.6 * lnorm(a.followers, 2, 6.5) + 0.4 * lnorm(avg + 1, 0, 3))) / 10;
}
const presence = g => Math.round(100 * (0.35 * lnorm(g.tot, 1, 4.2) + 0.35 * lnorm(g.reach, 5, 8.5) + 0.3 * lnorm(g.inter, 3, 6.5)));
function scoreChip(v, max = 10, label) {
  const pct = (v / max) * 100;
  return `<span class="score-chip" title="${esc(label || "")}"><span class="sbar"><i style="width:${pct}%"></i></span><b class="num">${nf(v, { maximumFractionDigits: 1 })}</b><span class="muted">/${max}</span></span>`;
}

/* ---------------- Period helpers ---------------- */
function period() {
  const r = S.range, cur = D.days.slice(-r), prev = D.days.slice(-2 * r, -r);
  const agg = a => { const pos = sum(a, "pos"), neu = sum(a, "neu"), neg = sum(a, "neg"), tot = pos + neu + neg, reactions = sum(a, "reactions"), comments = sum(a, "comments"), shares = sum(a, "shares");
    const g = { pos, neu, neg, tot, reach: sum(a, "reach"), net: (pos - neg) / tot, reactions, comments, shares, views: sum(a, "views"), inter: reactions + comments + shares }; g.presence = presence(g); return g; };
  const sovOf = slice => { const all = D.brands.map(b => sum(slice(D.brandDaily[b.key]))); return all[0] / sum(all); };
  return { cur, prev, c: agg(cur), p: agg(prev), sov: sovOf(a => a.slice(-r)), sovPrev: sovOf(a => a.slice(-2 * r, -r)) };
}
function buckets(arr, r) {
  if (r <= 30) return arr.map((d, i) => ({ i, items: [d] }));
  const out = []; for (let i = 0; i < arr.length; i += 7) out.push({ i, items: arr.slice(i, i + 7) }); return out;
}
function volumeChart(el) {
  const r = S.range, cur = D.days.slice(-r), B = buckets(cur, r);
  const rows = B.map(b => {
    const d0 = b.items[0].date, d1 = b.items[b.items.length - 1].date;
    return { label: fD(d0), tip: b.items.length > 1 ? `${fD(d0)} – ${fD(d1)}` : fD(d0, { weekday: "short", day: "numeric", month: "short" }),
      values: { neg: sum(b.items, "neg"), neu: sum(b.items, "neu"), pos: sum(b.items, "pos") } };
  });
  const evs = D.events.map((e, k) => ({ ...e, n: k + 1 })).filter(e => e.back < r)
    .map(e => ({ n: e.n, i: Math.floor((r - 1 - e.back) / (r <= 30 ? 1 : 7)) }));
  C.stacked(el, rows, [{ key: "neg", name: t("s.neg"), color: "--neg" }, { key: "neu", name: t("s.neu"), color: "--neu" }, { key: "pos", name: t("s.pos"), color: "--pos" }],
    { fmt: fI, fmtY: fN, markers: evs, totalLabel: t("common.total"), aria: t("ch.volume") });
  return { rows, evs };
}
function volumeTable() {
  const r = S.range, cur = D.days.slice(-r), B = buckets(cur, r);
  return tableHTML([{ l: t("common.date") }, { l: t("s.pos"), r: 1 }, { l: t("s.neu"), r: 1 }, { l: t("s.neg"), r: 1 }, { l: t("common.total"), r: 1 }],
    B.slice().reverse().map(b => { const p = sum(b.items, "pos"), n = sum(b.items, "neu"), g = sum(b.items, "neg"); return [fD(b.items[0].date), fI(p), fI(n), fI(g), fI(p + n + g)]; }));
}
function eventNotes() {
  const r = S.range, ev = D.events.map((e, k) => ({ back: e.back, n: k + 1, k: e.key })).filter(e => e.back < r);
  if (!ev.length) return "";
  return `<div class="row wrap small ink2" style="margin-top:10px;gap:14px">${ev.map(e => `<span><b>${e.n}</b> ${t(e.k)} · ${fD(new Date(D.TODAY - e.back * 864e5))}</span>`).join("")}</div>`;
}

/* ================================================================ VIEWS */
const V = {};

/* ---------------- HOME ---------------- */
V.home = {
  html() {
    const Pd = period(), hr = D.TODAY.getHours();
    const openAlerts = D.alerts.filter(a => a.state === "open");
    const failed = D.posts.filter(p => p.status === "failed");
    const impNew = D.mentions.filter(m => !isVisited(m) && impact(m) >= IMPORTANT && m.date > new Date(+D.TODAY - 7 * 864e5));
    const negNew = D.mentions.filter(m => !isVisited(m) && m.sentiment === "neg" && m.date > new Date(+D.TODAY - 7 * 864e5));
    const items = [];
    openAlerts.forEach(a => items.push({ cls: a.sev === "critical" ? "critical" : a.sev === "serious" ? "serious" : "calm", icon: a.kind === "volumeUp" ? "chart" : a.kind === "influencer" ? "sparkles" : "alert",
      title: alertTitle(a), body: alertBody(a), meta: ago(a.at), acts: alertActs(a) }));
    if (negNew.length) items.push({ cls: "serious", icon: "inbox", title: tn("attn.neg.title", negNew.length), body: t("attn.neg.body"), acts: [[t("act.openInbox"), "#/mentions?sentiment=neg&visit=not", 1]] });
    if (impNew.length) items.push({ cls: "calm", icon: "inbox", title: tn("attn.imp.title", impNew.length), body: t("attn.imp.body"), acts: [[t("act.openInbox"), "#/mentions?imp=important&visit=not", 1]] });
    failed.forEach(p => items.push({ cls: "critical", icon: "calendar", title: t("attn.failed.title"), body: t("attn.failed.body", { s: esc(p.summary), d: fDT(new Date(p.scheduleDate)) }), acts: [[t("act.fixPlanner"), `#/planner?post=${p._id}`, 1]] }));
    const upcoming = D.posts.filter(p => { const d = new Date(p.scheduleDate); return d >= D.TODAY - 36e5 * 12 && d < +D.TODAY + 7 * 864e5 && p.status !== "failed"; })
      .sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
    const up = Pd.c.tot >= Pd.p.tot;
    return head(t(hr < 12 ? "home.morning" : hr < 18 ? "home.afternoon" : "home.evening", { name: "Hendra" }),
      tn(up ? "home.sumUp" : "home.sumDown", items.length, { d: fP(Math.abs(Pd.c.tot / Pd.p.tot - 1)), r: t("range." + S.range) }),
      `<a class="btn" href="#/reports">${ic("file")}${t("act.weeklyReport")}</a><a class="btn primary" href="#/studio">${ic("pen")}${t("act.newDraft")}</a>`, true) +
    (() => { const b = aiBrief(); return aiCard("ai-brief", t("ai.brief.t"), b.body, b.n, `<button class="btn sm" data-aiask="1">${ic("sparkles")}${t("ai.askMore")}</button><a class="btn sm" href="#/reports">${t("ai.fullReport")}</a>`) + '<div style="height:16px"></div>'; })() +
    `<div class="grid g4">
      ${kpi(t("kpi.mentions"), fI(Pd.c.tot), deltaHTML(Pd.c.tot, Pd.p.tot), t("kpi.mentions.i"))}
      ${kpi(t("kpi.reach"), fN(Pd.c.reach), deltaHTML(Pd.c.reach, Pd.p.reach), t("kpi.reach.i"))}
      ${kpi(t("kpi.inter"), fN(Pd.c.inter), deltaHTML(Pd.c.inter, Pd.p.inter), t("kpi.inter.i"))}
      ${kpi(t("kpi.presence"), `${Pd.c.presence}<span class="muted" style="font-size:16px;font-weight:500">/100</span>`, deltaHTML(Pd.c.presence, Pd.p.presence, { abs: true }), t("kpi.presence.i"))}
    </div>
    <div class="grid g-main" style="margin-top:16px">
      <section class="card" aria-labelledby="h-attn"><div class="card-head"><h2 id="h-attn">${t("home.attention")}</h2><span class="pill plain">${items.length}</span></div>
        <div class="card-body flush" style="margin-top:6px">${items.length ? items.map(it => `<div class="attn ${it.cls}"><span class="ic">${ic(it.icon)}</span><div style="flex:1;min-width:0">
          <div class="row"><b>${it.title}</b><span class="spacer"></span>${it.meta ? `<span class="small muted nowrap">${it.meta}</span>` : ""}</div>
          <p class="ink2 small" style="margin-top:2px">${it.body}</p>
          <div class="acts">${it.acts.map(([l, h, pr]) => h.startsWith("#") ? `<a class="btn sm ${pr ? "primary" : ""}" href="${h}">${l}</a>` : `<button class="btn sm" data-act="${h}">${l}</button>`).join("")}</div></div></div>`).join("")
          : emptyState("check", t("home.allClear"), t("home.allClear.b"))}</div></section>
      <section class="card"><div class="card-head"><h2>${t("home.next7")}</h2><span class="spacer"></span><a class="btn sm ghost" href="#/planner">${t("act.openPlanner")}${ic("arrowr")}</a></div>
        <div class="card-body">${upcoming.length ? upcoming.map(p => `<a href="#/planner?post=${p._id}" class="row" style="text-decoration:none;padding:8px 0;border-bottom:1px solid var(--border);align-items:flex-start">
          <div style="width:52px;flex:none"><div class="small muted">${fD(new Date(p.scheduleDate), { weekday: "short" })}</div><b class="num">${fD(new Date(p.scheduleDate), { day: "numeric" })}</b></div>
          <div style="min-width:0;flex:1"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.summary)}</div>
          <div class="row small muted" style="margin-top:2px">${statusDot(p.status)} · ${p.kind === "social" ? p.accountIds.map(a => SRC_CODE[D.accounts.find(x => x._id === a).platform]).join(" ") : t("kind." + p.kind)} · ${fTime(new Date(p.scheduleDate))}</div></div></a>`).join("")
          : emptyState("calendar", t("home.noUpcoming"), "")}</div></section>
    </div>
    <div style="margin-top:16px">${chartCard({ id: "ch-vol", title: t("ch.volume"), info: t("ch.volume.i"),
      leg: legend([[t("s.pos"), "--pos"], [t("s.neu"), "--neu"], [t("s.neg"), "--neg"]]), table: volumeTable(), foot: eventNotes(),
      right: `<a class="btn sm ghost" href="#/insights">${t("act.allInsights")}${ic("arrowr")}</a>` })}</div>`;
  },
  mount() { volumeChart($("#ch-vol")); }
};
function alertVars(a) { return { topic: a.topic ? t("topic." + a.topic) : "", outlet: a.outlet, author: a.author, f: nf(a.factor || 0, { maximumFractionDigits: 1 }), n: a.count, r: fN(a.reach || 0) }; }
function alertActs(a) {
  if (a.kind === "negSpike") return [[t("act.reviewMentions"), `#/mentions?topic=${a.topic}&sentiment=neg&status=all`, 1], [t("act.draftStatement"), `#/studio?tpl=statement&alert=${a.id}`]];
  if (a.kind === "volumeUp") return [[t("act.reviewMentions"), `#/mentions?topic=${a.topic}&status=all`, 1], [t("act.draftPost"), `#/studio?tpl=caption&alert=${a.id}`], [t("act.createVisual"), `#/create?alert=${a.id}`]];
  if (a.kind === "influencer") return [[t("act.reviewMentions"), `#/mentions?status=all&search=${encodeURIComponent(a.author.split(" ")[0])}`, 1], [t("act.draftOutreach"), `#/studio?tpl=mediaEmail&alert=${a.id}`]];
  return [[t("act.openCoverage"), `#/mentions?status=all&search=${encodeURIComponent(a.outlet || "")}`, 1], [t("act.dismiss"), `dismiss:${a.id}`]];
}
function alertTitle(a) { return t("alert." + a.kind, alertVars(a)); }
function alertBody(a) { return t("alert." + a.kind + ".b", alertVars(a)); }

/* ---------------- MENTIONS ---------------- */
/* Visited status is per user and automatic: opening a mention marks it visited for the
   current user only. Prototype keeps it in this browser; production stores it per user on the server. */
const ME = "u4";
let visited = new Set();
const visitedKey = () => "visited." + ME + "." + D.project.id;
function loadVisited() {
  let ids = store.get(visitedKey(), null);
  if (!Array.isArray(ids)) { ids = D.mentions.filter(m => m.date < new Date(+D.TODAY - 3 * 864e5)).map(m => m.id); store.set(visitedKey(), ids); }
  visited = new Set(ids);
}
const isVisited = m => visited.has(m.id);
function markVisited(ids) { let ch = false; ids.forEach(id => { if (!visited.has(id)) { visited.add(id); ch = true; } }); if (ch) store.set(visitedKey(), [...visited]); }
const IMPORTANT = 6;
const ALL_SRC = () => [...new Set(D.mentions.map(m => m.source))];
const inRange = m => m.date > new Date(+D.TODAY - S.range * 864e5);

/* Smart context search (demo): maps a plain-language request to concepts and their
   words in English and Indonesian. Production uses semantic (embedding) search. */
const CONCEPTS = {
  parking: ["parkir", "parking"], price: ["harga", "price", "mahal", "diskon", "discount", "miring", "high"],
  traffic: ["macet", "traffic", "jalan ke", "road", "padat", "congested", "shuttle"],
  investment: ["investasi", "investment", "investor", "kek", "sez", "economic zone", "ekonomi khusus", "btid", "mitsubishi"],
  fashion: ["fashion", "fesyen", "runway", "outfit", "labdanation", "designer"],
  shopping: ["outlet", "belanja", "shopping", "merek", "brands", "sepatu", "asics", "diskon"],
  education: ["siswa", "school", "sekolah", "buku", "literasi", "literacy", "acs", "students"],
  environment: ["mangrove", "spesies", "tanaman", "green", "hijau", "eco", "sustainable", "berkelanjutan"],
  award: ["award", "penghargaan", "raih", "best retail", "propertyguru"],
  security: ["keamanan", "security", "pangdam"],
  question: ["?", "ada yang tahu", "does anyone", "berapa", "how much"],
  complaint: ["mahal", "macet", "padat", "overpriced", "semoga ada", "still feel high"],
  food: ["kuliner", "chocolate", "coklat", "food"], beach: ["sunset", "pantai", "beach", "coastal", "pesisir"]
};
const ALIAS = { parkir: "parking", harga: "price", prices: "price", mahal: "price", macet: "traffic", akses: "traffic", access: "traffic", invest: "investment", investor: "investment", investors: "investment",
  fesyen: "fashion", belanja: "shopping", sekolah: "education", pendidikan: "education", lingkungan: "environment", hijau: "environment", penghargaan: "award", keamanan: "security",
  pertanyaan: "question", questions: "question", asking: "question", bertanya: "question", keluhan: "complaint", complaints: "complaint", complain: "complaint", kuliner: "food", makanan: "food", pantai: "beach" };
function smartTerms(q) {
  const toks = q.toLowerCase().match(/[\p{L}\d?]+/gu) || [], concepts = new Set();
  toks.forEach(w => { if (CONCEPTS[w]) concepts.add(w); else if (ALIAS[w]) concepts.add(ALIAS[w]); else Object.keys(CONCEPTS).forEach(c => { if (w.length >= 4 && c.startsWith(w)) concepts.add(c); }); });
  if (q.includes("?")) concepts.add("question");
  return { concepts: [...concepts], terms: [...concepts].flatMap(c => CONCEPTS[c]) };
}
function mFiltered() {
  const m = S.m, q = m.search.trim().toLowerCase(), sm = m.smart.trim() ? smartTerms(m.smart) : null;
  let L = D.mentions.filter(x => inRange(x) && m.sources.includes(x.source) &&
    (!m.sent.length || m.sent.includes(x.sentiment)) && (!m.emo.length || m.emo.includes(x.emotion)) && (!m.geo.length || m.geo.includes(x.location)) &&
    influence(x.author) >= m.minInf && (m.imp === "all" || impact(x) >= IMPORTANT) &&
    (m.visit === "all" || (m.visit === "visited") === isVisited(x)) && (!m.topic || x.topic === m.topic) &&
    (!q || x.text.toLowerCase().includes(q) || x.author.name.toLowerCase().includes(q) || x.author.handle.toLowerCase().includes(q) || (x.translation || "").toLowerCase().includes(q)) &&
    (!sm || !sm.terms.length || sm.terms.some(tm => (x.text + " " + (x.translation || "")).toLowerCase().includes(tm))));
  if (m.sort === "reach") L = L.slice().sort((a, b) => b.reach - a.reach);
  if (m.sort === "inter") L = L.slice().sort((a, b) => inter(b) - inter(a));
  if (m.sort === "impact") L = L.slice().sort((a, b) => impact(b) - impact(a));
  return L;
}
function activeFilterCount() {
  const m = S.m; return (m.sources.length !== ALL_SRC().length) + !!m.sent.length + !!m.emo.length + !!m.geo.length + (m.minInf > 0) + (m.imp !== "all") + (m.visit !== "all") + !!m.smart.trim() + !!m.topic;
}
function resetMFilters() { Object.assign(S.m, { sources: ALL_SRC(), sent: [], emo: [], geo: [], minInf: 0, imp: "all", visit: "all", smart: "", topic: "", search: "" }); }
const cbx = (group, val, checked, label, extra = "") => `<label class="fcheck"><input type="checkbox" data-fgroup="${group}" value="${esc(val)}" ${checked ? "checked" : ""}>${extra}<span>${label}</span></label>`;
function filtersHTML() {
  const m = S.m, base = D.mentions.filter(inRange), count = f => base.filter(f).length, srcs = ALL_SRC().sort((a, b) => count(x => x.source === b) - count(x => x.source === a));
  const locs = [...new Set(base.map(x => x.location))].sort((a, b) => count(x => x.location === b) - count(x => x.location === a));
  const emos = [...new Set(base.map(x => x.emotion))];
  const sm = m.smart.trim() ? smartTerms(m.smart) : null, n = activeFilterCount();
  return `<div class="card-head"><h2>${t("mf.title")}</h2>${n ? `<span class="pill plain">${n}</span>` : ""}<span class="spacer"></span>${n ? `<button class="btn sm ghost" data-mreset="1">${t("act.clearFilters")}</button>` : ""}</div>
  <div class="card-body stack" style="gap:18px">
    <fieldset class="fgroup"><legend>${t("mf.sources")}</legend>
      ${cbx("srcAll", "all", m.sources.length === srcs.length, `<b>${t("mf.all")}</b>`, "")}<div class="fgrid">${srcs.map(k => cbx("src", k, m.sources.includes(k), `${t("src." + k)} <span class="muted num">${count(x => x.source === k)}</span>`, srcBadge(k).replace('class="src"', 'class="src xs"'))).join("")}</div></fieldset>
    <fieldset class="fgroup"><legend>${t("common.sentiment")}</legend><div class="row wrap">${["pos", "neu", "neg"].map(s => cbx("sent", s, m.sent.includes(s), t("s." + s), `<i class="dot" style="background:var(${SENT[s]})"></i>`)).join("")}</div><p class="help">${t("mf.anyHint")}</p></fieldset>
    <fieldset class="fgroup"><legend>${t("common.emotion")}</legend><div class="fgrid">${emos.map(e => cbx("emo", e, m.emo.includes(e), `${t("emo." + e)} <span class="muted num">${count(x => x.emotion === e)}</span>`)).join("")}</div></fieldset>
    <div class="fgroup"><label class="flabel" for="mf-inf">${t("score.influence")} <span class="muted">${t("mf.atLeast")}</span> <b class="num" id="mf-inf-v">${m.minInf}</b>/10</label>
      <input type="range" id="mf-inf" min="0" max="10" step="1" value="${m.minInf}" style="width:100%"></div>
    <div class="fgroup"><span class="flabel">${t("mf.importance")} ${infoBtn(t("mf.importance.i", { n: IMPORTANT }))}</span><div class="seg" role="group" aria-label="${t("mf.importance")}">${["all", "important"].map(k => `<button data-mimp="${k}" aria-pressed="${m.imp === k}">${t("mf.imp." + k)}</button>`).join("")}</div></div>
    <div class="fgroup"><span class="flabel">${t("mf.visited")} ${infoBtn(t("mf.visited.i"))}</span><div class="seg" role="group" aria-label="${t("mf.visited")}">${["all", "not", "visited"].map(k => `<button data-mvisit="${k}" aria-pressed="${m.visit === k}">${t("mf.v." + k)}</button>`).join("")}</div></div>
    <fieldset class="fgroup"><legend>${t("common.location")}</legend><div class="fgrid">${locs.map(l => cbx("geo", l, m.geo.includes(l), `${esc(l)} <span class="muted num">${count(x => x.location === l)}</span>`)).join("")}</div></fieldset>
    <div class="fgroup"><label class="flabel" for="mf-smart">${ic("sparkles")} ${t("mf.smart")}</label>
      <textarea id="mf-smart" class="input" rows="2" placeholder="${t("mf.smartPh")}">${esc(m.smart)}</textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm primary" data-msmart="1">${t("mf.smartGo")}</button>${m.smart ? `<button class="btn sm ghost" data-msmartclear="1">${t("act.clear")}</button>` : ""}</div>
      ${sm ? `<p class="help" style="margin-top:6px">${sm.concepts.length ? t("mf.smartMatched") + " " + sm.concepts.map(c => `<span class="pill plain">${t("concept." + c)}</span>`).join(" ") : t("mf.smartNone")}</p>` : `<p class="help" style="margin-top:6px">${t("mf.smartH")}</p>`}</div>
  </div>`;
}
V.mentions = {
  html() {
    return head(t("nav.mentions"), t("mentions.desc"), `<button class="btn" data-aisum="1">${ic("sparkles")}${t("ai.summarize")}</button><button class="btn" data-act="markAllVisited">${ic("check")}${t("mf.markAll")}</button><button class="btn" data-act="export">${ic("download")}${t("act.export")}</button>`) +
      `<div class="inbox">
        <section class="card" aria-label="${t("mentions.list")}">
          <div class="m-toolbar">
            <label class="sr-only" for="m-q">${t("common.search")}</label>
            <input id="m-q" class="input" type="search" placeholder="${t("mentions.searchPh")}" value="${esc(S.m.search)}" style="flex:1;min-width:180px">
            <select class="select" id="m-sort" aria-label="${t("common.sort")}">${["new", "impact", "inter", "reach"].map(k => `<option value="${k}" ${S.m.sort === k ? "selected" : ""}>${t("sort." + k)}</option>`).join("")}</select>
            <button class="btn filters-btn" data-mfopen="1">${ic("search")}${t("mf.title")}<span id="mf-badge"></span></button>
          </div>
          <div id="m-active"></div>
          <div id="m-list" role="list" style="margin-top:10px;border-top:1px solid var(--border)"></div>
          <div class="kbd-hint hide-sm"><span><kbd>J</kbd> <kbd>K</kbd> ${t("kbd.move")}</span><span><kbd>Enter</kbd> ${t("kbd.open")}</span><span><kbd>R</kbd> ${t("kbd.reply")}</span></div>
        </section>
        <aside class="card mfilters" id="m-filters" aria-label="${t("mf.title")}">${filtersHTML()}</aside>
      </div>`;
  },
  mount() { renderMList(); bindFilterInputs(); }
};
function bindFilterInputs() {
  const r = $("#mf-inf"); if (r) r.addEventListener("input", () => { S.m.minInf = +r.value; $("#mf-inf-v").textContent = r.value; renderMList(); });
  const sm = $("#mf-smart"); if (sm) sm.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); S.m.smart = sm.value; refreshFilters(); renderMList(); } });
}
function refreshFilters() { $("#m-filters").innerHTML = filtersHTML(); bindFilterInputs(); }
function renderMList() {
  const L = mFiltered(), m = S.m, n = activeFilterCount(), notV = L.filter(x => !isVisited(x)).length;
  const badge = $("#mf-badge"); if (badge) badge.textContent = n ? ` · ${n}` : "";
  $("#m-active").innerHTML = `<div class="row wrap" style="padding:10px 12px 0">${m.topic ? `<button class="chip" data-mclear="topic" aria-pressed="true">${t("common.topic")}: ${t("topic." + m.topic)} <span class="x">${ic("x")}</span></button>` : ""}
    <span class="small muted">${t("mentions.results", { n: fI(L.length) })} · ${t("mf.notVisitedN", { n: notV })} · ${t("range." + S.range)}</span></div>`;
  $("#m-list").innerHTML = L.length ? L.slice(0, m.limit).map(x => { const v = isVisited(x), sc = impact(x);
      return `<div class="m-item ${v ? "" : "unread"}" role="listitem" tabindex="0" data-mid="${x.id}" aria-label="${esc(x.author.name)}${v ? "" : ", " + t("mf.v.not")}">
      ${srcBadge(x.source)}
      <div class="body"><div class="meta"><b>${esc(x.author.name)}</b><span>${esc(x.author.handle)}</span><span>·</span><span>${ago(x.date)}</span>${x.lang === "id" ? `<span class="lang">ID</span>` : ""}${v ? `<span class="visited-tag">${ic("check")}${t("mf.v.visited")}</span>` : `<span class="new-tag">${t("mf.v.not")}</span>`}</div>
      <div class="text">${esc(x.text)}</div>
      <div class="row wrap" style="margin-top:6px">${sentPill(x.sentiment)}<span class="pill plain">${t("emo." + x.emotion)}</span>${sc >= IMPORTANT ? `<span class="pill" style="background:var(--accent-soft);color:var(--accent)">${ic("alertc")}${t("mf.imp.important")}</span>` : ""}
        <span class="small muted">${t("common.reach")} ${fN(x.reach)} · ${t("kpi.inter")} ${fN(inter(x))}</span><span class="spacer"></span>
        <span data-tip="${esc(t("score.impact"))}">${scoreChip(sc, 10, t("score.impact"))}</span></div></div></div>`; }).join("") +
      (L.length > m.limit ? `<div style="padding:12px;text-align:center"><button class="btn" data-more="1">${t("act.loadMore", { n: L.length - m.limit })}</button></div>` : "")
    : emptyState("search", t("mentions.none"), m.sources.length ? t("mentions.none.b") : t("mf.pickSource"));
}
function openMention(id) {
  const x = D.mentions.find(y => y.id === id); if (!x) return;
  markVisited([id]); S.m.sel = id;
  const el = $(`.m-item[data-mid="${id}"]`); if (el) { el.classList.remove("unread"); const tg = el.querySelector(".new-tag"); if (tg) tg.outerHTML = `<span class="visited-tag">${ic("check")}${t("mf.v.visited")}</span>`; }
  renderShell();
  const draw = showTr => `<div class="stack">
      <div class="row">${srcBadge(x.source)}<div style="min-width:0;flex:1"><b>${esc(x.author.name)}</b><div class="small muted">${esc(x.author.handle)} · ${fN(x.author.followers)} ${t("common.followers")}</div></div><span class="visited-tag">${ic("check")}${t("mf.v.visited")}</span></div>
      <div><div class="quote" lang="${showTr ? "en" : x.lang}">${esc(showTr ? x.translation : x.text)}</div>
        ${x.translation ? `<button class="btn sm ghost" id="mt-tr" style="margin-top:6px">${ic("globe")}${showTr ? t("act.showOriginal") : t("act.showTranslation")}</button>` : ""}</div>
      ${(() => { const a = aiAction(x); return `<div class="ai-inline"><span class="ai-badge">${ic("sparkles")}AI</span><div style="flex:1"><b>${t("ai.act." + a.k)}</b><p class="small ink2">${t("ai.act." + a.k + ".d")}</p></div>${a.cta === "reply" ? `<a class="btn sm primary" href="#/studio?tpl=reply&mention=${x.id}" data-close-nav="1">${t("act.draftResponse")}</a>` : a.cta === "post" ? `<a class="btn sm" href="#/studio?tpl=caption&mention=${x.id}" data-close-nav="1">${t("act.draftPost")}</a>` : ""}</div>`; })()}
      <dl class="kv">
        <dt>${t("common.sentiment")}</dt><dd><div class="row wrap">${sentPill(x.sentiment)}<span class="small muted">${t("m.aiSent", { c: fP(x.sentConf) })}</span>${infoBtn(t("m.aiSent.i"))}</div></dd>
        <dt>${t("common.emotion")}</dt><dd>${t("emo." + x.emotion)}</dd>
        <dt>${t("score.impact")}</dt><dd><div class="row">${scoreChip(impact(x))}${impact(x) >= IMPORTANT ? `<span class="pill plain">${t("mf.imp.important")}</span>` : ""}${infoBtn(t("score.impact.i"))}</div></dd>
        <dt>${t("score.influence")}</dt><dd><div class="row">${scoreChip(influence(x.author))}${infoBtn(t("score.influence.i"))}</div></dd>
        <dt>${t("kpi.inter")}</dt><dd><div class="num"><b>${fI(inter(x))}</b></div><div class="small muted">${t("m.reactions")} ${fI(x.reactions)} · ${t("m.comments")} ${fI(x.comments)} · ${t("m.shares")} ${fI(x.shares)}${x.views ? ` · ${t("m.views")} ${fN(x.views)}` : ""}</div></dd>
        <dt>${t("common.reach")}</dt><dd class="num">${fI(x.reach)}</dd>
        <dt>${t("common.topic")}</dt><dd>${t("topic." + x.topic)}</dd>
        <dt>${t("common.location")}</dt><dd>${esc(x.location)}</dd>
        <dt>${t("common.published")}</dt><dd>${fDT(x.date)}</dd>
      </dl></div>`;
  openDrawer({ title: t("mf.detail"), body: draw(false),
    foot: `<a class="btn" href="#" onclick="return false">${ic("external")}${t("act.openOriginal")}</a><span class="spacer"></span><a class="btn primary" href="#/studio?tpl=reply&mention=${x.id}" data-close-nav="1">${ic("pen")}${t("act.draftResponse")}</a>`,
    mount() { let tr = false; const b = () => { const btn = $("#mt-tr"); if (btn) btn.onclick = () => { tr = !tr; $(".drawer-body").innerHTML = draw(tr); b(); }; }; b(); } });
}

/* ---------------- INSIGHTS ---------------- */
V.insights = {
  html() {
    const tabs = ["engagement", "sentiment", "topics", "emotions", "audience"];
    return head(t("nav.insights"), t("insights.desc")) +
      `<div class="tabs" role="tablist">${tabs.map(k => `<button role="tab" aria-selected="${S.ins.tab === k}" data-instab="${k}">${t("ins." + k)}</button>`).join("")}</div><div id="ins-body">${aiInsightsCard()}<div style="height:16px"></div>${this[S.ins.tab]()}</div>`;
  },
  engagement() {
    const Pd = period(), c = Pd.c, p = Pd.p, er = c.inter / c.reach, erp = p.inter / p.reach;
    const top = D.mentions.filter(m => m.date > new Date(+D.TODAY - S.range * 864e5)).map(m => ({ m, sc: impact(m) })).sort((a, b) => b.sc - a.sc).slice(0, 8);
    const avgImp = top.length ? sum(top.map(x => x.sc)) / top.length : 0;
    return `<div class="grid g4">
        ${kpi(t("kpi.inter"), fN(c.inter), deltaHTML(c.inter, p.inter), t("kpi.inter.i"))}
        ${kpi(t("kpi.er"), fP(er, 2), deltaHTML(er, erp), t("kpi.er.i"))}
        ${kpi(t("kpi.presence"), `${c.presence}<span class="muted" style="font-size:16px;font-weight:500">/100</span>`, deltaHTML(c.presence, p.presence, { abs: true }), t("kpi.presence.i"))}
        ${kpi(t("kpi.avgImpact"), `${nf(avgImp, { maximumFractionDigits: 1 })}<span class="muted" style="font-size:16px;font-weight:500">/10</span>`, `<span>${t("kpi.avgImpact.s")}</span>`, t("score.impact.i"))}
      </div>
      <div class="grid g4" style="margin-top:16px">
        ${[["reactions", c.reactions, p.reactions], ["comments", c.comments, p.comments], ["shares", c.shares, p.shares], ["views", c.views, p.views]].map(([k, v, pv]) => kpi(t("m." + k), fN(v), deltaHTML(v, pv), t("m." + k + ".i"))).join("")}
      </div>
      <div style="margin-top:16px">${chartCard({ id: "ch-inter", title: t("ch.inter"), info: t("ch.inter.i"), leg: legend([[t("m.reactions"), "--s1"], [t("m.comments"), "--s2"], [t("m.shares"), "--s3"]]),
        table: tableHTML([{ l: t("common.date") }, { l: t("m.reactions"), r: 1 }, { l: t("m.comments"), r: 1 }, { l: t("m.shares"), r: 1 }], buckets(D.days.slice(-S.range), S.range).slice().reverse().map(b => [fD(b.items[0].date), fI(sum(b.items, "reactions")), fI(sum(b.items, "comments")), fI(sum(b.items, "shares"))])) })}</div>
      <div class="grid g-main" style="margin-top:16px">
        <section class="card"><div class="card-head"><h2>${t("ins.topImpact")}</h2>${infoBtn(t("score.impact.i"))}</div><div class="card-body flush scroll-x" style="margin-top:8px">
          <table class="t"><thead><tr><th>${t("nav.mentions")}</th><th class="r">${t("kpi.inter")}</th><th class="r">${t("common.reach")}</th><th>${t("score.impact")}</th></tr></thead><tbody>
          ${top.map(({ m, sc }) => `<tr class="click" data-href="#/mentions?status=all&search=${encodeURIComponent(m.text.slice(0, 24))}" tabindex="0"><td style="max-width:360px"><div class="row">${srcBadge(m.source)}<div style="min-width:0"><b class="small">${esc(m.author.name)}</b><div class="small ink2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.text)}</div></div></div></td>
            <td class="r num">${fN(inter(m))}</td><td class="r num">${fN(m.reach)}</td><td>${scoreChip(sc)}</td></tr>`).join("")}</tbody></table></div></section>
        <section class="card"><div class="card-head"><h2>${t("ins.scoring")}</h2></div><div class="card-body stack small ink2" style="gap:12px">
          <div><b class="ink" style="color:var(--ink)">${t("score.impact")}</b> <span class="muted">0–10</span><p>${t("score.impact.f")}</p></div>
          <div><b style="color:var(--ink)">${t("score.influence")}</b> <span class="muted">0–10</span><p>${t("score.influence.f")}</p></div>
          <div><b style="color:var(--ink)">${t("kpi.presence")}</b> <span class="muted">0–100</span><p>${t("score.presence.f")}</p></div>
          <p class="help">${t("score.log")}</p></div></section>
      </div>`;
  },
  sentiment() {
    const Pd = period(), c = Pd.c;
    const asp = D.aspects;
    return `<div class="grid g-main">${chartCard({ id: "ch-vol", title: t("ch.volume"), info: t("ch.volume.i"), leg: legend([[t("s.pos"), "--pos"], [t("s.neu"), "--neu"], [t("s.neg"), "--neg"]]), table: volumeTable(), foot: eventNotes() })}
      <section class="card"><div class="card-head"><h2>${t("ins.share")}</h2>${infoBtn(t("kpi.net.i"))}</div><div class="card-body">
        <div class="row" style="align-items:baseline;gap:6px"><span style="font-size:32px;font-weight:650" class="num">${(c.net >= 0 ? "+" : "") + nf(c.net * 100, { maximumFractionDigits: 0 })}</span><span class="muted">${t("kpi.net")}</span></div>
        <div class="delta small" style="margin:2px 0 14px">${deltaHTML(c.net, Pd.p.net, { points: true })}</div>
        ${seg100([{ l: t("s.pos"), v: c.pos, c: "--pos" }, { l: t("s.neu"), v: c.neu, c: "--neu" }, { l: t("s.neg"), v: c.neg, c: "--neg" }])}
        <div style="margin-top:12px">${[["pos", c.pos], ["neu", c.neu], ["neg", c.neg]].map(([k, v]) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--border)"><i style="width:10px;height:10px;border-radius:3px;background:var(${SENT[k]})"></i><span>${t("s." + k)}</span><span class="spacer"></span><b class="num">${fP(v / c.tot)}</b><span class="muted num small" style="width:56px;text-align:right">${fI(v)}</span></div>`).join("")}</div>
      </div></section></div>
      <div class="grid g2" style="margin-top:16px">
        <section class="card"><div class="card-head"><h2>${t("ins.aspects")}</h2>${infoBtn(t("ins.aspects.i"))}</div><div class="card-body">
          ${legend([[t("s.neg"), "--neg"], [t("s.pos"), "--pos"]])}
          <div style="margin-top:10px">${asp.map(a => `<div style="display:grid;grid-template-columns:minmax(96px,130px) 1fr 1fr;align-items:center;gap:0;margin:9px 0;font-size:13px">
            <span class="ink2">${t("asp." + a.key)}</span>
            <div style="display:flex;justify-content:flex-end;align-items:center;gap:6px;border-right:1px solid var(--axis);padding-right:2px"><span class="num small muted">${fP(a.neg)}</span><i data-tip="${esc(t("asp." + a.key))} · ${t("s.neg")}: ${fP(a.neg)}" style="display:block;height:10px;width:${a.neg * 100}%;background:var(--neg);border-radius:4px 0 0 4px"></i></div>
            <div style="display:flex;align-items:center;gap:6px;padding-left:2px"><i data-tip="${esc(t("asp." + a.key))} · ${t("s.pos")}: ${fP(a.pos)}" style="display:block;height:10px;width:${a.pos * 100}%;background:var(--pos);border-radius:0 4px 4px 0"></i><span class="num small muted">${fP(a.pos)}</span></div></div>`).join("")}</div>
        </div></section>
        <section class="card"><div class="card-head"><h2>${t("ins.keywords")}</h2>${infoBtn(t("ins.keywords.i"))}</div><div class="card-body flush scroll-x" style="margin-top:8px">
          ${tableHTML([{ l: t("common.keyword") }, { l: t("kpi.mentions"), r: 1 }, { l: t("common.change"), r: 1 }], D.keywords.map(k => [`<a href="#/mentions?search=${encodeURIComponent(k.w.split(" / ")[0])}&status=all">${esc(k.w)}</a>`, fI(k.v), `<span class="${k.d >= 0.3 ? "delta" : ""}">${k.d >= 0 ? "▲" : "▼"} ${fP(Math.abs(k.d))}</span>`]))}
        </div></section></div>`;
  },
  topics() {
    const tot = sum(D.topics, "count");
    return `<section class="card"><div class="card-head"><h2>${t("ins.topicsTitle")}</h2>${infoBtn(t("ins.topics.i"))}<span class="spacer"></span>${legend([[t("s.pos"), "--pos"], [t("s.neu"), "--neu"], [t("s.neg"), "--neg"]])}</div>
      <div class="card-body flush scroll-x" style="margin-top:8px"><table class="t"><thead><tr><th>${t("common.topic")}</th><th class="r">${t("kpi.mentions")}</th><th style="min-width:160px">${t("common.sentiment")}</th><th class="r">${t("common.reach")}</th><th class="r">${t("ins.convShare")}</th><th class="r">${t("common.change")}</th><th></th></tr></thead><tbody>
      ${D.topics.map(tp => `<tr class="click" data-href="#/mentions?topic=${tp.key}&status=all" tabindex="0"><td><b>${t("topic." + tp.key)}</b></td><td class="r num">${fI(tp.count)}</td>
        <td><div class="mini-bar" role="img" aria-label="${t("s.pos")} ${fP(tp.pos)}, ${t("s.neg")} ${fP(tp.neg)}"><i style="width:${tp.pos * 100}%;background:var(--pos)" data-tip="${t("s.pos")} ${fP(tp.pos)}"></i><i style="width:${(1 - tp.pos - tp.neg) * 100}%;background:var(--neu)" data-tip="${t("s.neu")} ${fP(1 - tp.pos - tp.neg)}"></i><i style="width:${tp.neg * 100}%;background:var(--neg)" data-tip="${t("s.neg")} ${fP(tp.neg)}"></i></div></td>
        <td class="r num">${fN(tp.reach)}</td><td class="r num">${fP(tp.count / tot)}</td><td class="r num">${tp.trend >= 0 ? "▲" : "▼"} ${fP(Math.abs(tp.trend))}</td><td class="r muted">${ic("right")}</td></tr>`).join("")}
      </tbody></table></div></section>`;
  },
  emotions() {
    return `<div class="grid g-main"><section class="card"><div class="card-head"><h2>${t("ins.emotionsTitle")}</h2>${infoBtn(t("ins.emotions.i"))}</div><div class="card-body">${hbars(D.emotions.map(e => ({ l: t("emo." + e.key), v: e.v })))}</div></section>
      <section class="card"><div class="card-head"><h2>${t("ins.emotionRead")}</h2></div><div class="card-body stack small ink2"><p>${t(D.simulated ? "ins.emotionRead.g1" : "ins.emotionRead.1")}</p><p>${t(D.simulated ? "ins.emotionRead.g2" : "ins.emotionRead.2")}</p>
      <a class="btn sm" href="#/mentions?sentiment=neg&status=all">${t("act.reviewNegative")}</a></div></section></div>`;
  },
  audience() {
    return `<div class="grid g2"><section class="card"><div class="card-head"><h2>${t("ins.sources")}</h2></div><div class="card-body">${hbars(D.sources.map(s => ({ l: t("src." + s.key), v: s.v })))}</div></section>
      <section class="card"><div class="card-head"><h2>${t("ins.locations")}</h2>${infoBtn(t("ins.locations.i"))}</div><div class="card-body">${hbars(D.geo.map(g => ({ l: g.key === "Other" ? t("common.other") : g.key, v: g.v })))}</div></section></div>
      <div class="grid g-main" style="margin-top:16px"><section class="card"><div class="card-head"><h2>${t("ins.voices")}</h2>${infoBtn(t("ins.voices.i"))}</div><div class="card-body flush scroll-x" style="margin-top:8px">
        ${tableHTML([{ l: t("common.author") }, { l: t("common.type") }, { l: t("common.followers"), r: 1 }, { l: t("kpi.mentions"), r: 1 }, { l: t("kpi.inter"), r: 1 }, { l: t("common.sentiment") }, { l: t("score.influence") }],
          D.authors.slice().sort((a, b) => influence(b) - influence(a)).slice(0, 8).map(a => { const ms = D.mentions.filter(m => m.author === a); const pos = ms.filter(m => m.sentiment === "pos").length, neg = ms.filter(m => m.sentiment === "neg").length;
            return [`<b>${esc(a.name)}</b><div class="small muted">${esc(a.handle)}</div>`, t("atype." + a.type), fN(a.followers), fI(ms.length), fN(sum(ms.map(inter))), sentPill(pos >= neg ? (pos ? "pos" : "neu") : "neg"), scoreChip(influence(a))]; }))}</div></section>
      <section class="card"><div class="card-head"><h2>${t("ins.hashtags")}</h2></div><div class="card-body flush scroll-x" style="margin-top:8px">
        ${tableHTML([{ l: "Hashtag" }, { l: t("kpi.mentions"), r: 1 }, { l: t("common.change"), r: 1 }], D.hashtags.map(h => [esc(h.tag), fI(h.v), `${h.d >= 0 ? "▲" : "▼"} ${fP(Math.abs(h.d))}`]))}</div></section></div>`;
  },
  mount() {
    if (S.ins.tab === "sentiment") volumeChart($("#ch-vol"));
    if (S.ins.tab === "engagement") {
      const B = buckets(D.days.slice(-S.range), S.range);
      C.stacked($("#ch-inter"), B.map(b => ({ label: fD(b.items[0].date), tip: b.items.length > 1 ? `${fD(b.items[0].date)} – ${fD(b.items[b.items.length - 1].date)}` : fD(b.items[0].date, { weekday: "short", day: "numeric", month: "short" }),
        values: { shares: sum(b.items, "shares"), comments: sum(b.items, "comments"), reactions: sum(b.items, "reactions") } })),
        [{ key: "shares", name: t("m.shares"), color: "--s3" }, { key: "comments", name: t("m.comments"), color: "--s2" }, { key: "reactions", name: t("m.reactions"), color: "--s1" }],
        { fmt: fI, fmtY: fN, totalLabel: t("kpi.inter"), aria: t("ch.inter") });
    }
  }
};

/* ---------------- BENCHMARK ---------------- */
V.benchmark = {
  html() {
    const r = S.range, tot = {}, prevTot = {};
    D.brands.forEach(b => { tot[b.key] = sum(D.brandDaily[b.key].slice(-r)); prevTot[b.key] = sum(D.brandDaily[b.key].slice(-2 * r, -r)); });
    const all = sum(Object.values(tot)), cols = ["--s1", "--s2", "--s3", "--s4"];
    const rows = D.brands.map((b, i) => ({ b, c: cols[i], v: tot[b.key], st: D.brandStats[b.key] }));
    this._rows = rows;
    return head(t("nav.benchmark"), t("bench.desc"), `<a class="btn" href="#/project-settings">${ic("settings")}${t("bench.manage")}</a>`) + aiCard("ai-bench", t("ai.bn.t"), aiBench(rows, all), sum(rows, "v")) + '<div style="height:16px"></div>' +
      `<div class="grid g-main"><section class="card"><div class="card-head"><h2>${t("kpi.sov")}</h2>${infoBtn(t("kpi.sov.i"))}</div><div class="card-body">
        ${seg100(rows.map(x => ({ l: x.b.name, v: x.v, c: x.c })))}
        <div style="margin-top:12px">${rows.map(x => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--border)"><i style="width:10px;height:10px;border-radius:3px;background:var(${x.c})"></i><span class="${x.b.own ? "" : "ink2"}" style="${x.b.own ? "font-weight:600" : ""}">${esc(x.b.name)}</span><span class="spacer"></span><b class="num">${fP(x.v / all)}</b><span class="small num" style="width:90px;text-align:right">${deltaHTML(x.v / all, prevTot[x.b.key] / sum(Object.values(prevTot)), { points: true }).replace(t("common.vsPrev"), "")}</span></div>`).join("")}</div>
      </div></section>
      ${chartCard({ id: "ch-bench", title: t("bench.trend"), info: t("bench.trend.i"), leg: legend(rows.map(x => [x.b.name, x.c, 1])),
        table: tableHTML([{ l: t("common.brand") }, { l: t("kpi.mentions"), r: 1 }], rows.map(x => [esc(x.b.name), fI(x.v)])) })}</div>
      <section class="card" style="margin-top:16px"><div class="card-head"><h2>${t("bench.compare")}</h2></div><div class="card-body flush scroll-x" style="margin-top:8px">
        ${tableHTML([{ l: t("common.brand") }, { l: t("kpi.mentions"), r: 1 }, { l: t("kpi.sov"), r: 1 }, { l: t("s.pos"), r: 1 }, { l: t("s.neg"), r: 1 }, { l: t("kpi.net"), r: 1 }, { l: t("kpi.reach"), r: 1 }],
          rows.map(x => [`<span class="row"><i style="width:10px;height:10px;border-radius:3px;background:var(${x.c})"></i>${x.b.own ? `<b>${esc(x.b.name)}</b>` : esc(x.b.name)}</span>`, fI(x.v), fP(x.v / all), fP(x.st.pos), fP(x.st.neg), `${x.st.pos - x.st.neg >= 0 ? "+" : ""}${nf((x.st.pos - x.st.neg) * 100, { maximumFractionDigits: 0 })}`, fN(x.v * 5600 * x.st.reach)]))}
      </div></section>`;
  },
  mount() {
    const r = S.range, step = r <= 30 ? (r <= 7 ? 1 : 3) : 7;
    const n = Math.floor(r / step), xs = [], idx0 = D.days.length - r;
    for (let k = 0; k < n; k++) { const d = D.days[idx0 + k * step].date; xs.push({ label: fD(d), tip: step > 1 ? `${fD(d)} – ${fD(D.days[Math.min(D.days.length - 1, idx0 + k * step + step - 1)].date)}` : fD(d) }); }
    const series = this._rows.map(x => ({ name: x.b.name, color: x.c, emph: x.b.own,
      values: Array.from({ length: n }, (_, k) => sum(D.brandDaily[x.b.key].slice(idx0 + k * step, idx0 + k * step + step))) }));
    C.lines($("#ch-bench"), xs, series, { fmt: fI, fmtY: fN, aria: t("bench.trend"), height: 260 });
  }
};

/* ---------------- MEDIA VALUE ---------------- */
const TONE_W = { pos: 1, neu: 0.5, neg: -1 }, PROM_W = { headline: 1.5, body: 1 };
/* Rate per article. Default: automatic estimate from monthly site traffic (≈ Rp 4 per monthly visit,
   clamped to Rp 1–40 jt). Key outlets can be overridden with the media-kit price (marked "Media kit"). */
const autoRate = o => Math.min(40e6, Math.max(1e6, Math.round((o.reach * 4) / 1e5) * 1e5));
const effRate = o => (o.verified ? o.rate : autoRate(o));
V.value = {
  html() {
    const f = S.range / 30;
    const rows = D.outlets.map((o, idx) => { const arts = Math.max(1, Math.round(o.articles * f)), r = effRate(o), ave = arts * r; return { ...o, idx, r, arts, ave, w: ave * TONE_W[o.tone] * PROM_W[o.prominence] }; });
    const key = S.val.method === "ave" ? "ave" : "w";
    const sorted = rows.slice().sort((a, b) => S.val.sort === "articles" ? b.arts - a.arts : S.val.sort === "reach" ? b.reach - a.reach : b[key] - a[key]);
    const totV = sum(rows, key), totA = sum(rows, "arts"), posShare = sum(rows.filter(r => r.tone === "pos"), "arts") / totA;
    const sortBtn = (k, l) => `<button data-vsort="${k}" aria-label="${t("common.sortBy", { c: l })}">${l}${S.val.sort === k ? ic("down") : ""}</button>`;
    return head(t("nav.value"), t("value.desc"),
      `<div class="seg" role="group" aria-label="${t("value.method")}"><button aria-pressed="${S.val.method === "ave"}" data-vm="ave">${t("value.ave")}</button><button aria-pressed="${S.val.method === "w"}" data-vm="w">${t("value.weighted")}</button></div>`) +
      `<div class="grid g4">${kpi(S.val.method === "ave" ? t("value.ave") : t("value.weighted"), fIDR(totV), deltaHTML(totV, totV * 0.86), S.val.method === "ave" ? t("value.ave.i") : t("value.weighted.i"))}
        ${kpi(t("value.articles"), fI(totA), deltaHTML(totA, totA * 0.91))}
        ${kpi(t("value.potReach"), fN(sum(rows, "reach")), deltaHTML(1.1, 1))}
        ${kpi(t("value.posShare"), fP(posShare), deltaHTML(posShare, posShare - 0.04, { points: true }), t("value.posShare.i"))}</div>
      <details class="card" style="margin-top:16px;padding:12px 16px"><summary style="cursor:pointer;font-weight:600">${t("value.how")}</summary>
        <div class="small ink2 stack" style="margin-top:10px;gap:8px"><p>${t("value.how.1")}</p><p>${t("value.how.2")}</p><p>${t("value.how.3")}</p></div></details>
      <section class="card" style="margin-top:16px"><div class="card-head"><h2>${t("value.byOutlet")}</h2></div><div class="card-body flush scroll-x" style="margin-top:8px">
        <table class="t"><thead><tr><th>${t("value.outlet")}</th><th>${t("value.tier")}</th><th class="r">${sortBtn("articles", t("value.articles"))}</th><th>${t("value.tone")}</th><th>${t("value.prominence")}</th><th class="r">${sortBtn("reach", t("common.reach"))}</th><th class="r">${t("value.rate")}</th><th class="r">${sortBtn("value", t("value.value"))}</th></tr></thead><tbody>
        ${sorted.map(o => `<tr><td><b>${esc(o.name)}</b></td><td>${t("value.tier" + o.tier)}</td><td class="r num">${o.arts}</td><td>${sentPill(o.tone)}</td><td>${t("prom." + o.prominence)}</td><td class="r num">${fN(o.reach)}</td><td class="r nowrap">${S.val.editing === o.idx
          ? `<span class="row" style="justify-content:flex-end"><label class="sr-only" for="rate-in">${t("value.rate")} ${esc(o.name)}</label><input id="rate-in" class="input num" type="number" min="0" step="500000" value="${o.r}" style="width:130px;text-align:right"><button class="btn sm primary" data-ratesave="${o.idx}">${t("act.save")}</button>${o.verified ? `<button class="btn sm ghost" data-rateauto="${o.idx}">${t("value.useAuto")}</button>` : ""}<button class="btn sm ghost icon" data-ratecancel="1" aria-label="${t("act.cancel")}">${ic("x")}</button></span>`
          : `<span class="row" style="justify-content:flex-end;gap:6px"><span class="num">${fIDR(o.r)}</span><span class="pill plain" data-tip="${esc(o.verified ? t("value.rateKit.i") : t("value.rateAuto.i"))}" style="${o.verified ? "background:var(--accent-soft);color:var(--accent);font-weight:700" : ""}">${o.verified ? t("value.rateKit") : t("value.rateAuto")}</span><button class="btn sm ghost icon" data-rateedit="${o.idx}" aria-label="${t("act.edit")} ${esc(o.name)}">${ic("pen")}</button></span>`}</td><td class="r num" style="${o[key] < 0 ? "color:var(--down-text)" : ""}">${o[key] < 0 ? "−" : ""}${fIDR(Math.abs(o[key]))}</td></tr>`).join("")}
        </tbody></table></div></section>`;
  }
};

/* ---------------- ALERTS ---------------- */
V.alerts = {
  html() {
    const open = D.alerts.filter(a => a.state === "open").length;
    return head(t("nav.alerts"), t("alerts.desc"), `<button class="btn primary" data-act="newRule">${ic("plus")}${t("alerts.newRule")}</button>`) +
      `<div class="tabs" role="tablist">${["activity", "rules"].map(k => `<button role="tab" aria-selected="${S.alerts.tab === k}" data-altab="${k}">${t("alerts." + k)}${k === "activity" && open ? `<span class="count">${open}</span>` : ""}</button>`).join("")}</div>` +
      (S.alerts.tab === "activity" ? `<section class="card">${D.alerts.map(a => `<div class="attn ${a.state === "open" ? (a.sev === "critical" ? "critical" : a.sev === "serious" ? "serious" : "calm") : ""}" style="${a.state !== "open" ? "opacity:.72" : ""}">
          <span class="ic">${ic(a.kind === "volumeUp" ? "chart" : a.kind === "influencer" ? "sparkles" : a.sev === "critical" ? "alert" : "bell")}</span><div style="flex:1;min-width:0">
          <div class="row wrap"><b>${alertTitle(a)}</b>${sev(a.sev)}<span class="spacer"></span><span class="small muted">${ago(a.at)}</span></div>
          <p class="small ink2" style="margin-top:2px">${alertBody(a)}</p>
          ${a.state === "open" ? `<div class="ai-inline" style="margin-top:8px"><span class="ai-badge">${ic("sparkles")}AI</span><p class="small" style="flex:1">${aiAlert(a)}</p></div>` : ""}
          <div class="acts">${a.state === "open" ? alertActs(a).filter(x => x[1].startsWith("#")).map(([l, h, pr]) => `<a class="btn sm ${pr ? "primary" : ""}" href="${h}">${l}</a>`).join("") + `<button class="btn sm ghost" data-act="dismiss:${a.id}">${t("act.resolve")}</button>`
            : `<span class="pill plain">${ic("check")}${t("alerts.resolved")}</span>`}</div></div></div>`).join("")}</section>`
      : `<section class="card">${D.alertRules.map(r => `<div class="attn calm"><span class="ic">${ic("bell")}</span><div style="flex:1;min-width:0"><b>${t("rule." + r.name)}</b>
          <p class="small ink2">${t("rule." + r.cond + ".d")}</p><div class="row wrap" style="margin-top:6px">${r.channels.map(c => `<span class="pill plain">${t("ch." + c)}</span>`).join("")}</div></div>
          <label class="switch" title="${t("alerts.toggle")}"><input type="checkbox" data-rule="${r.id}" ${r.on ? "checked" : ""} aria-label="${t("alerts.toggle")}: ${t("rule." + r.name)}"><span></span></label></div>`).join("")}</section>`);
  }
};
function ruleDrawer() {
  openDrawer({ title: t("alerts.newRule"), body: `<div class="stack">
    <div class="field"><label for="r-name">${t("rule.f.name")}</label><input id="r-name" class="input" placeholder="${t("rule.f.namePh")}"></div>
    <div class="field"><label for="r-trig">${t("rule.f.trigger")}</label><select id="r-trig" class="select">${["negSpike", "volume", "sensitive", "influencer"].map(k => `<option value="${k}">${t("rule.trig." + k)}</option>`).join("")}</select></div>
    <div class="grid g2" style="gap:10px"><div class="field"><label for="r-th">${t("rule.f.threshold")}</label><input id="r-th" class="input" type="number" value="2" min="1" step="0.5"><span class="help">${t("rule.f.thresholdH")}</span></div>
    <div class="field"><label for="r-win">${t("rule.f.window")}</label><select id="r-win" class="select"><option>1 h</option><option selected>2 h</option><option>6 h</option><option>24 h</option></select></div></div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">${t("rule.f.channels")}</legend>${["slack", "email", "whatsapp"].map(c => `<label class="row"><input type="checkbox" name="rch" value="${c}" ${c === "slack" ? "checked" : ""}> ${t("ch." + c)}</label>`).join("")}</fieldset>
    <p class="help">${t("rule.f.note")}</p></div>`,
    foot: `<span class="spacer"></span><button class="btn" data-close="1">${t("act.cancel")}</button><button class="btn primary" id="r-save">${t("act.saveRule")}</button>`,
    mount() { $("#r-save").onclick = () => { const n = $("#r-name").value.trim(); if (!n) { $("#r-name").setAttribute("aria-invalid", "true"); $("#r-name").focus(); toast(t("rule.f.nameReq")); return; }
      D.alertRules.push({ id: "r" + Date.now(), name: "custom", customName: n, on: true, cond: $("#r-trig").value, channels: $$('input[name="rch"]:checked').map(i => i.value) });
      I.en["rule.custom"] = I.id["rule.custom"] = n; closeDrawer(); S.alerts.tab = "rules"; rerender(); toast(t("toast.ruleSaved")); }; }
  });
}

/* ---------------- STUDIO ---------------- */
const TPLS = ["statement", "press", "reply", "caption", "internal", "mediaEmail"];
function keyMsgs(lang) { return D.settings.keyMessages.map(k => k[lang]); }
const defBrief = (L, tpl) => I[L][(D.project.id === "kkb" ? "st.defBrief." : "st.defBriefG.") + tpl];
/* Adapt the Kura Kura Bali templates to another project's brand. */
function brandify(txt) {
  if (D.project.id === "kkb") return txt;
  const n = D.project.name, tag = "#" + n.replace(/\s+/g, ""), mail = "press@" + (D.project.domain || n.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".com");
  return txt.replace("#KuraKuraBali #Serangan", tag).replace(/press@kurakurabali\.com/g, mail)
    .replace("Kura Kura Bali is a coastal destination on Serangan island, Bali.", "[One-sentence company description]")
    .replace("Kura Kura Bali adalah destinasi pesisir di Pulau Serangan, Bali.", "[Deskripsi singkat perusahaan]")
    .replace("Adding shuttle services from Sanur and Denpasar during events", "[First concrete action]")
    .replace("Menambah layanan shuttle dari Sanur dan Denpasar selama acara", "[Langkah konkret pertama]")
    .replace("residents and visitors", "our customers").replace("warga dan pengunjung", "pelanggan kami")
    .split("Kura Kura Bali").join(n);
}
function generate() {
  const s = S.st, L = s.lang, km = s.msgs.map(i => keyMsgs(L)[i]).filter(Boolean);
  const brief = s.brief.trim() || defBrief(L, s.tpl);
  const Brief = brief.charAt(0).toUpperCase() + brief.slice(1);
  const ctx = s.ctx;
  const open = { warm: { en: "We hear you, and we're sorry. ", id: "Kami mendengar Anda, dan kami mohon maaf. " }, neutral: { en: "", id: "" }, formal: { en: "", id: "" } }[s.tone][L];
  const kmList = km.length ? new Intl.ListFormat(L === "en" ? "en" : "id", { type: "conjunction" }).format(km) : "";
  const kmLine = km.length ? (L === "en" ? `This reflects our commitment to ${kmList}.` : `Ini mencerminkan komitmen kami terhadap ${kmList}.`) : "";
  const G = {
    en: {
      statement: `Statement from Kura Kura Bali\n\n${open}We are aware of ${brief}. We understand the concern this has caused for residents and visitors.\n\nWhat we are doing now:\n• Adding shuttle services from Sanur and Denpasar during events\n• Working with local authorities and community leaders on a longer-term plan\n• Sharing a progress update within 7 days\n\n${kmLine}\n\nMedia contact: press@kurakurabali.com`,
      press: `FOR IMMEDIATE RELEASE\n\n${Brief}\n\nDenpasar, ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(D.TODAY)}: Kura Kura Bali today shared news of ${brief}. ${kmLine}\n\n"Quote from a spokesperson about why this matters to Bali," said [Name, Title].\n\nAbout Kura Kura Bali\nKura Kura Bali is a coastal destination on Serangan island, Bali.\n\nMedia contact: press@kurakurabali.com`,
      reply: `${s.tone === "warm" ? "Thank you for raising this, and sorry for the trouble. " : "Thank you for your feedback. "}${ctx && ctx.topic === "access" ? "We are adding shuttles from Sanur and Denpasar and staggering arrival times for the next events. " : "Our team is looking into this now. "}Could you send us a DM with more details so we can follow up?`,
      caption: `${brief.charAt(0).toUpperCase() + brief.slice(1)}. 🌊\n\n${kmLine}\n\n#KuraKuraBali #Serangan`,
      internal: `Hi team,\n\nA quick update on ${brief}.\n\nWhat changes: [what is changing]\nWhen: [date]\nWho to ask: [name]\n\n${kmLine}\n\nThank you,\nCommunications`,
      mediaEmail: `Subject: Story idea: ${brief}\n\nDear [Name],\n\nI thought ${brief} might interest your readers. We can offer an interview with our team, photos, and a site visit.\n\n${kmLine}\n\nWould you have 15 minutes this week?\n\nBest regards,\nCommunications, Kura Kura Bali`
    },
    id: {
      statement: `Pernyataan Kura Kura Bali\n\n${open}Kami mengetahui adanya ${brief}. Kami memahami kekhawatiran yang dirasakan warga dan pengunjung.\n\nLangkah yang kami ambil:\n• Menambah layanan shuttle dari Sanur dan Denpasar selama acara\n• Bekerja sama dengan pemerintah daerah dan tokoh masyarakat untuk rencana jangka panjang\n• Menyampaikan perkembangan dalam 7 hari\n\n${kmLine}\n\nKontak media: press@kurakurabali.com`,
      press: `SIARAN PERS\nUntuk segera dipublikasikan\n\n${Brief}\n\nDenpasar, ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(D.TODAY)}: Kura Kura Bali hari ini menyampaikan kabar tentang ${brief}. ${kmLine}\n\n"Kutipan juru bicara tentang arti penting hal ini bagi Bali," ujar [Nama, Jabatan].\n\nTentang Kura Kura Bali\nKura Kura Bali adalah destinasi pesisir di Pulau Serangan, Bali.\n\nKontak media: press@kurakurabali.com`,
      reply: `${s.tone === "warm" ? "Terima kasih sudah menyampaikan ini, dan mohon maaf atas ketidaknyamanannya. " : "Terima kasih atas masukannya. "}${ctx && ctx.topic === "access" ? "Kami menambah shuttle dari Sanur dan Denpasar serta mengatur jadwal kedatangan untuk acara berikutnya. " : "Tim kami sedang menindaklanjuti. "}Boleh kirim detailnya lewat DM agar kami bisa bantu lebih lanjut?`,
      caption: `${brief.charAt(0).toUpperCase() + brief.slice(1)}. 🌊\n\n${kmLine}\n\n#KuraKuraBali #Serangan`,
      internal: `Halo tim,\n\nBerikut informasi singkat tentang ${brief}.\n\nApa yang berubah: [isi]\nKapan: [tanggal]\nNarahubung: [nama]\n\n${kmLine}\n\nTerima kasih,\nTim Komunikasi`,
      mediaEmail: `Subjek: Ide liputan: ${brief}\n\nYth. [Nama],\n\nKami rasa ${brief} bisa menarik bagi pembaca Anda. Kami dapat menyediakan wawancara, foto, dan kunjungan lokasi.\n\n${kmLine}\n\nApakah Anda punya waktu 15 menit minggu ini?\n\nSalam,\nTim Komunikasi Kura Kura Bali`
    }
  };
  return brandify(G[L][s.tpl]).replace(/\n{3,}/g, "\n\n");
}
function runChecks(text, lang, tpl) {
  if (!text.trim()) return null;
  const low = text.toLowerCase(), out = [];
  const kms = keyMsgs(lang), hit = kms.filter(k => low.includes(k.toLowerCase()));
  if (tpl !== "reply" && kms.length) out.push({ lv: hit.length >= 2 ? "ok" : hit.length ? "warn" : "bad", t: t("chk.km"), d: t("chk.km.d", { n: hit.length, m: kms.length }) + (hit.length < kms.length ? " " + t("chk.missing") + ": " + kms.filter(k => !hit.includes(k)).join(", ") : "") });
  const ban = D.settings.banned.filter(b => low.includes(b.toLowerCase()));
  out.push({ lv: ban.length ? "bad" : "ok", t: t("chk.claims"), d: ban.length ? t("chk.claims.bad", { w: ban.map(b => `“${b}”`).join(", ") }) : t("chk.claims.ok") });
  const sents = text.split(/[.!?]+\s/).filter(x => x.trim().split(/\s+/).length > 2), avg = sents.length ? sum(sents.map(x => x.trim().split(/\s+/).length)) / sents.length : 0;
  out.push({ lv: avg > 24 ? "warn" : "ok", t: t("chk.read"), d: t("chk.read.d", { n: nf(avg, { maximumFractionDigits: 0 }) }) });
  const ph = (text.match(/\[[^\]]+\]/g) || []);
  out.push({ lv: ph.length ? "warn" : "ok", t: t("chk.ph"), d: ph.length ? t("chk.ph.bad", { w: ph.slice(0, 3).join(" ") }) : t("chk.ph.ok") });
  if (["statement", "press"].includes(tpl)) { const has = /contact|kontak|@kurakurabali/i.test(text); out.push({ lv: has ? "ok" : "warn", t: t("chk.contact"), d: has ? t("chk.contact.ok") : t("chk.contact.bad") }); }
  if (["reply", "caption"].includes(tpl)) { const lim = tpl === "reply" ? 280 : 2200; out.push({ lv: text.length > lim ? "bad" : "ok", t: t("chk.len"), d: t("chk.len.d", { n: text.length, m: lim }) }); }
  const ex = (text.match(/!/g) || []).length;
  if (ex > 2) out.push({ lv: "warn", t: t("chk.tone"), d: t("chk.tone.d") });
  const score = Math.max(0, 100 - out.filter(c => c.lv === "bad").length * 25 - out.filter(c => c.lv === "warn").length * 10);
  return { out, score };
}
function checksHTML() {
  const r = runChecks(S.st.text, S.st.lang, S.st.tpl);
  if (!r) return `<p class="small muted">${t("chk.empty")}</p>`;
  const col = r.score >= 85 ? "--good" : r.score >= 60 ? "--serious" : "--critical", circ = 2 * Math.PI * 22;
  return `<div class="score" style="margin-bottom:6px"><svg class="ring" viewBox="0 0 56 56" role="img" aria-label="${t("chk.score")}: ${r.score}/100"><circle cx="28" cy="28" r="22" fill="none" stroke="var(--surface-3)" stroke-width="6"/>
    <circle cx="28" cy="28" r="22" fill="none" stroke="var(${col})" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(circ * r.score) / 100} ${circ}" transform="rotate(-90 28 28)"/>
    <text x="28" y="33" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)">${r.score}</text></svg>
    <div><b>${r.score >= 85 ? t("chk.ready") : r.score >= 60 ? t("chk.almost") : t("chk.needsWork")}</b><p class="small muted">${t("chk.scoreH")}</p></div></div>` +
    r.out.map(c => `<div class="check ${c.lv}"><span class="ic">${ic(c.lv === "ok" ? "check" : c.lv === "warn" ? "alertc" : "alert")}</span><div><b>${c.t}</b><p>${esc(c.d)}</p></div></div>`).join("");
}
const SAMPLES = {
  prFix: { en: [["are proud", "is proud", "grammar"], ["annouce", "announce", "spelling"], ["it's new", "its new", "grammar"], ["which have been", "which has been", "grammar"], ["guaranteed to be the best in the world", "designed to be one of Bali's most memorable coastal experiences", "claim"], ["6am - 6pm", "6 am to 6 pm", "style"]],
           id: [["di rancang", "dirancang", "spelling"], ["dijamin menjadi yang terbaik di dunia", "dirancang menjadi salah satu pengalaman pesisir paling berkesan di Bali", "claim"], ["jam 06.00-18.00", "pukul 06.00–18.00", "style"]] }
};
function proofSuggestions(text, lang) {
  const out = SAMPLES.prFix[lang].filter(([a]) => text.includes(a)).map(([a, b, k]) => ({ a, b, k }));
  if (/ {2,}/.test(text)) out.push({ a: (text.match(/\S+ {2,}\S+/) || [""])[0], b: (text.match(/\S+ {2,}\S+/) || [""])[0].replace(/ {2,}/g, " "), k: "spacing" });
  const sp = text.match(/\S+ [,.;:!?]/); if (sp) out.push({ a: sp[0], b: sp[0].replace(/ ([,.;:!?])/, "$1"), k: "spacing" });
  /* Repeated words, except brand names that legitimately repeat ("Kura Kura Bali"). */
  const protectedTerms = D.settings.keywords.concat(D.brands.map(b => b.name)).map(k => k.toLowerCase());
  const rep = [...text.matchAll(/\b(\w+) \1\b/gi)].find(m => !protectedTerms.some(p => p.includes(m[0].toLowerCase())));
  if (rep) out.push({ a: rep[0], b: rep[1], k: "repeat" });
  D.settings.banned.forEach(bn => { if (text.toLowerCase().includes(bn) && !out.find(o => o.a.toLowerCase().includes(bn))) out.push({ a: bn, b: "", k: "claim" }); });
  return out.filter(o => o.a);
}
function summarize(text, n) {
  const sents = (text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()).filter(Boolean);
  if (!sents.length) return null;
  const stop = new Set("the a an and or of to in on for is was are were be by with that this it as at from will has have had about yang dan di ke dari untuk dengan ini itu akan pada adalah dalam tidak".split(" "));
  const freq = {}; sents.forEach(s => s.toLowerCase().match(/[\p{L}\d]+/gu)?.forEach(w => { if (!stop.has(w) && w.length > 2) freq[w] = (freq[w] || 0) + 1; }));
  const scored = sents.map((s, i) => { const ws = s.toLowerCase().match(/[\p{L}\d]+/gu) || []; return { s, i, sc: sum(ws.map(w => freq[w] || 0)) / Math.sqrt(ws.length + 1) + (i === 0 ? 0.5 : 0) }; });
  const top = scored.slice().sort((a, b) => b.sc - a.sc).slice(0, n).sort((a, b) => a.i - b.i).map(x => x.s);
  const acts = sents.filter(s => /\b(will|must|should|need to|agreed|asked for|akan|harus|perlu|sepakat)\b/i.test(s));
  const wIn = text.trim().split(/\s+/).length, wOut = top.join(" ").split(/\s+/).length;
  return { top, acts, wIn, wOut };
}
V.studio = {
  html() {
    const s = S.st, ctx = s.ctx, wc = s.text.trim() ? s.text.trim().split(/\s+/).length : 0;
    const drafts = D.drafts.slice().sort((a, b) => b.saved - a.saved);
    return head(t("nav.studio"), t("studio.desc"), `<button class="btn" data-bv="1">${ic("sparkles")}${t("bv.title")}</button>`) + `<div class="studio"><div class="stack">
      ${ctx ? `<section class="card"><div class="card-body row" style="align-items:flex-start">${ic("link")}<div style="flex:1;min-width:0"><b class="small">${t("st.context")}</b>
        <p class="small ink2" style="margin-top:2px">${ctx.kind === "mention" ? `“${esc(ctx.text)}” · ${esc(ctx.author)}` : esc(ctx.text)}</p></div><button class="btn sm ghost" data-st="clearctx">${t("act.remove")}</button></div></section>` : ""}
      <section class="card"><div class="card-body stack" style="gap:12px">
        <div class="row wrap" style="gap:14px;align-items:flex-end">
          <div class="field" style="min-width:200px"><label for="st-tpl">${t("st.type")}</label><select id="st-tpl" class="select">${TPLS.map(k => `<option value="${k}" ${s.tpl === k ? "selected" : ""}>${t("tpl." + k)} · ${t("tpl." + k + ".d")}</option>`).join("")}</select></div>
          <div class="field"><span class="label">${t("st.outLang")}</span><div class="seg" role="group" aria-label="${t("st.outLang")}">${["en", "id"].map(k => `<button data-olang="${k}" aria-pressed="${s.lang === k}">${k === "en" ? "English" : "Indonesia"}</button>`).join("")}</div></div>
          <div class="field"><span class="label">${t("st.tone")}</span><div class="seg" role="group" aria-label="${t("st.tone")}">${["warm", "neutral", "formal"].map(k => `<button data-tone="${k}" aria-pressed="${s.tone === k}">${t("tone." + k)}</button>`).join("")}</div></div>
        </div>
        <div class="row" style="align-items:flex-end;gap:8px"><div class="field" style="flex:1"><label for="st-brief">${t("st.brief")}</label>
          <input id="st-brief" class="input" value="${esc(s.brief)}" placeholder="${esc(defBrief(s.lang, s.tpl))}"></div>
          <button class="btn primary" data-st="gen">${ic("sparkles")}${s.text ? t("st.regen") : t("st.gen")}</button></div>
      </div></section>
      <section class="card">
        <div class="row wrap" style="padding:10px 12px;border-bottom:1px solid var(--border);gap:6px" role="toolbar" aria-label="${t("st.tools")}">
          <button class="btn sm" data-st="translate">${ic("globe")}${t("st.translateTo", { l: s.lang === "en" ? "Indonesia" : "English" })}</button>
          <button class="btn sm" data-st="proof">${ic("check")}${t("st.proofread")}</button>
          <button class="btn sm" data-st="summ">${ic("file")}${t("st.summarize")}</button>
          <label class="btn sm">${ic("upload")}${t("st.upload")}<input type="file" id="st-file" accept=".txt,.md,.csv" hidden></label>
          <span class="spacer"></span><span class="small muted" id="st-wc">${t("st.words", { n: wc })}</span></div>
        <div class="card-body" id="st-edwrap"><label class="sr-only" for="st-text">${t("st.editor")}</label><textarea id="st-text" class="input editor" lang="${s.lang}" placeholder="${t("st.editorPh")}">${esc(s.text)}</textarea></div>
        <div class="card-foot row wrap"><button class="btn" data-st="copy">${ic("copy")}${t("act.copy")}</button><button class="btn ghost" data-st="clear">${t("st.new")}</button>
          <span class="spacer"></span>${s.tpl === "caption" ? `<a class="btn" href="#/create?brief=${encodeURIComponent(s.brief.trim() || defBrief(s.lang, "caption"))}">${ic("image")}${t("st.toVisual")}</a>` : ""}${["caption", "reply"].includes(s.tpl) ? `<button class="btn" data-st="toPlanner">${ic("calendar")}${t("st.toPlanner")}</button>` : ""}
          <button class="btn primary" data-st="save">${ic("check")}${s.draftId ? t("st.updateDraft") : t("st.saveDraft")}</button></div>
      </section>
      <section class="card"><div class="card-head"><h2>${t("st.drafts")}</h2><span class="pill plain">${drafts.length}</span></div>
        <div class="card-body flush scroll-x" style="margin-top:8px">${drafts.length ? `<table class="t"><tbody>${drafts.map(d => `<tr class="${d.id === s.draftId ? "" : "click"}" ${d.id === s.draftId ? "" : `data-draft="${d.id}" tabindex="0"`}>
          <td><b>${esc(d.title)}</b>${d.id === s.draftId ? ` <span class="pill plain">${t("st.editing")}</span>` : ""}<div class="small muted">${t("tpl." + d.tpl)} · ${d.lang.toUpperCase()} · ${ago(d.saved)}</div></td>
          <td class="r nowrap">${d.id === s.draftId ? "" : `<button class="btn sm">${t("act.open")}</button>`} <button class="btn sm ghost danger" data-deldraft="${d.id}" aria-label="${t("act.delete")}: ${esc(d.title)}">${ic("x")}</button></td></tr>`).join("")}</tbody></table>`
          : emptyState("file", t("st.noDrafts"), t("st.noDrafts.b"))}</div></section>
    </div>
    <aside class="stack" style="position:sticky;top:76px"><div id="st-side"></div>
      <section class="card"><div class="card-head"><h2>${t("st.checks")}</h2>${infoBtn(t("st.checks.i"))}</div><div class="card-body" id="st-checks">${checksHTML()}</div></section></aside></div>`;
  },
  mount() {
    const ta = $("#st-text");
    ta.addEventListener("input", () => { S.st.text = ta.value; $("#st-checks").innerHTML = checksHTML(); $("#st-wc").textContent = t("st.words", { n: ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0 }); });
    $("#st-brief").addEventListener("input", e => { S.st.brief = e.target.value; });
    $("#st-file").addEventListener("change", e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { S.st.text = String(r.result); S.st.gen = null; rerender(); toast(t("toast.loaded", { f: f.name })); }; r.readAsText(f); });
  }
};
function sidePanel(title, body) {
  $("#st-side").innerHTML = `<section class="card"><div class="card-head"><h2>${title}</h2><span class="spacer"></span><button class="btn sm ghost icon" data-st="closeSide" aria-label="${t("act.close")}">${ic("x")}</button></div><div class="card-body" id="st-side-body">${body}</div></section>`;
}
const txtFix = v => v.replace(/ {2,}/g, " ").replace(/ ,/g, ",");
function setEditor(text) { S.st.text = text; const ta = $("#st-text"); ta.value = text; ta.dispatchEvent(new Event("input")); }
function studioAction(a) {
  const s = S.st, txt = () => $("#st-text").value;
  if (a === "gen") {
    $("#st-edwrap").innerHTML = `<div aria-busy="true" aria-label="${t("st.generating")}">${[90, 100, 70, 95, 60, 85].map(w => `<div class="skeleton" style="width:${w}%"></div>`).join("")}<p class="small muted" style="margin-top:10px">${ic("sparkles")} ${t("st.generating")}</p></div>`;
    setTimeout(() => { s.text = generate(); s.gen = { text: s.text }; rerender(); $("#st-text").focus(); toast(t("toast.drafted")); }, 900);
  }
  if (a === "copy" || a === "copySum") {
    const v = a === "copy" ? txt() : $("#st-side-body").innerText;
    if (!v || !v.trim()) { toast(t("toast.nothingToCopy")); return; }
    try { navigator.clipboard.writeText(v).then(() => toast(t("toast.copied")), () => toast(t("toast.copyFail"))); } catch { toast(t("toast.copyFail")); }
  }
  if (a === "clear") { Object.assign(s, { text: "", brief: "", ctx: null, gen: null, draftId: null }); rerender(); }
  if (a === "save") {
    if (!txt().trim()) { toast(t("toast.nothingToSave")); $("#st-text").focus(); return; }
    const title = (s.brief.trim() || txt().trim().split("\n")[0]).slice(0, 70);
    if (s.draftId) Object.assign(D.drafts.find(d => d.id === s.draftId), { title, tpl: s.tpl, lang: s.lang, text: txt(), saved: new Date(D.TODAY.getTime() + 60e3) });
    else { s.draftId = "d" + Date.now(); D.drafts.push({ id: s.draftId, title, tpl: s.tpl, lang: s.lang, text: txt(), saved: new Date(D.TODAY.getTime() + 60e3) }); }
    rerender(); toast(t("toast.draftSaved"));
  }
  if (a === "toPlanner") { if (!txt().trim()) return toast(t("toast.nothingToSave")); S.pl.prefill = txt(); location.hash = "#/planner?compose=1"; }
  if (a === "clearctx") { s.ctx = null; rerender(); }
  if (a === "closeSide") $("#st-side").innerHTML = "";
  if (a === "translate") {
    const cur = txt(); if (!cur.trim()) { toast(t("toast.nothingToTranslate")); return; }
    const from = s.lang, to = from === "en" ? "id" : "en";
    const terms = D.settings.glossary.filter(g => cur.toLowerCase().includes(g[from].toLowerCase().replace(/ \(.+\)/, "")));
    const glossary = `<span class="label">${t("st.glossaryUsed")}</span><div class="row wrap" style="margin-top:6px">${terms.length ? terms.map(g => `<span class="pill plain">${esc(g[from])} → ${esc(g[to])}</span>`).join("") : `<span class="small muted">${t("st.noGlossary")}</span>`}</div>`;
    if (s.gen && cur === s.gen.text) {
      /* Demo: generated drafts are re-written in the other language with the same brief. */
      s.lang = to; s.text = generate(); s.gen = { text: s.text }; rerender();
      sidePanel(t("st.translated"), `<p class="small ink2" style="margin-bottom:10px">${t("st.translatedB", { l: to === "en" ? "English" : "Indonesia" })}</p>${glossary}`);
    } else sidePanel(t("st.translate"), `<p class="small ink2" style="margin-bottom:10px">${t("st.trDemo")}</p>${glossary}`);
  }
  if (a === "proof") {
    const sug = proofSuggestions(txt(), s.lang);
    sidePanel(t("st.suggestions"), sug.length ? `<div class="row" style="margin-bottom:8px"><span class="small muted">${t("st.nSugg", { n: sug.length })}</span><span class="spacer"></span><button class="btn sm" data-st="acceptAll">${t("st.acceptAll")}</button></div>` +
      sug.map((g, i) => `<div class="sugg"><div class="row"><span class="pill plain">${t("pr." + g.k)}</span><span class="spacer"></span><button class="btn sm" data-sgacc="${i}">${t("act.accept")}</button><button class="btn sm ghost" data-sgrej="${i}">${t("act.ignore")}</button></div>
        <p style="margin-top:8px"><del>${esc(g.a)}</del> ${g.b ? `→ <ins>${esc(g.b)}</ins>` : `<span class="small muted">(${t("pr.remove")})</span>`}</p><p class="small muted" style="margin-top:4px">${t("pr." + g.k + ".d")}</p></div>`).join("")
      : emptyState("check", t("st.prNone"), t("st.prNone.b")));
    $("#st-side")._sug = sug;
  }
  if (a === "acceptAll") $$("[data-sgacc]").forEach(b => !b.disabled && b.click());
  if (a === "summ") {
    const r = summarize(txt(), 3);
    if (!r) { toast(t("toast.nothingToSummarize")); return; }
    sidePanel(t("st.summary"), `<p class="small muted" style="margin-bottom:10px">${t("st.reduced", { a: r.wIn, b: r.wOut })}</p>
      <h3>${t("st.keyPoints")}</h3><ul style="margin:6px 0 14px;padding-left:18px">${r.top.map(x => `<li style="margin:4px 0">${esc(x)}</li>`).join("")}</ul>
      <h3>${t("st.actions")}</h3>${r.acts.length ? `<ul style="margin:6px 0 0;padding-left:18px">${r.acts.map(x => `<li style="margin:4px 0">${esc(x)}</li>`).join("")}</ul>` : `<p class="small muted">${t("st.noActions")}</p>`}
      <div class="row" style="margin-top:12px"><button class="btn sm" data-st="copySum">${ic("copy")}${t("act.copy")}</button></div><p class="help" style="margin-top:10px">${t("st.sumMethod")}</p>`);
  }
}

/* ---------------- PLANNER (GHL) ---------------- */
/* Adapter: in production these call our backend, which proxies GHL with the server-held token. */
const ghl = {
  listPosts: () => D.posts,
  createPost: body => { const p = { _id: "p" + Date.now(), kind: "social", ...body }; D.posts.push(p); return p; },
  updatePost: (id, body) => Object.assign(D.posts.find(p => p._id === id), body)
};
function plFiltered() {
  const p = S.pl;
  return ghl.listPosts().filter(x => p.kinds.includes(x.kind) && (!p.status || x.status === p.status) &&
    (!p.channel || x.accountIds.some(a => D.accounts.find(c => c._id === a).platform === p.channel)));
}
V.planner = {
  html() {
    const p = S.pl, m = p.month;
    const title = fD(m, { month: "long", year: "numeric" });
    return head(t("nav.planner"), t("pl.desc"),
      `<button class="btn" data-aiideas="1">${ic("sparkles")}${t("ai.ideas")}</button><button class="btn primary" data-pl="new">${ic("plus")}${t("pl.newPost")}</button>`) +
      `<section class="card"><div class="row wrap" style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div class="row"><button class="btn sm icon" data-pl="prev" aria-label="${t("pl.prevMonth")}">${ic("left")}</button><h2 style="min-width:150px;text-align:center" aria-live="polite">${title}</h2><button class="btn sm icon" data-pl="next" aria-label="${t("pl.nextMonth")}">${ic("right")}</button><button class="btn sm" data-pl="today">${t("pl.today")}</button></div>
        <span class="spacer"></span>
        <div class="row wrap" role="group" aria-label="${t("pl.types")}">${["social", "press", "internal"].map(k => `<button class="chip" data-kind="${k}" aria-pressed="${p.kinds.includes(k)}"><i style="width:8px;height:8px;border-radius:2px;background:var(${KIND_COLOR[k]})"></i>${t("kind." + k)}</button>`).join("")}</div>
        <select class="select" data-plf="channel" aria-label="${t("pl.channel")}"><option value="">${t("pl.allChannels")}</option>${["instagram", "facebook", "linkedin", "google"].map(c => `<option value="${c}" ${p.channel === c ? "selected" : ""}>${t("src." + c)}</option>`).join("")}</select>
        <select class="select" data-plf="status" aria-label="${t("common.status")}"><option value="">${t("pl.allStatus")}</option>${["draft", "scheduled", "published", "failed"].map(s => `<option value="${s}" ${p.status === s ? "selected" : ""}>${t("pst." + s)}</option>`).join("")}</select>
        <div class="seg" role="group" aria-label="${t("pl.view")}"><button data-plv="month" aria-pressed="${p.view === "month"}">${t("pl.month")}</button><button data-plv="list" aria-pressed="${p.view === "list"}">${t("pl.list")}</button></div>
      </div>
      <div class="row wrap small" style="padding:10px 16px;gap:14px;color:var(--ink-2)">${["draft", "scheduled", "published", "failed"].map(statusDot).join("")}</div>
      ${p.view === "month" ? this.month() : this.list()}</section>`;
  },
  month() {
    const m = S.pl.month, L = plFiltered(), first = new Date(m.getFullYear(), m.getMonth(), 1), off = (first.getDay() + 6) % 7, start = new Date(first.getTime() - off * 864e5);
    const dows = Array.from({ length: 7 }, (_, i) => fD(new Date(2026, 10, 16 + i), { weekday: "short" }));
    let h = `<div class="scroll-x"><div class="cal" style="min-width:640px">${dows.map(d => `<div class="dow">${d}</div>`).join("")}`;
    const cells = Math.ceil((off + new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()) / 7) * 7;
    for (let i = 0; i < cells; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), key = d.toDateString();
      const ps = L.filter(x => new Date(x.scheduleDate).toDateString() === key).sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
      const isToday = key === D.TODAY.toDateString(), out = d.getMonth() !== m.getMonth();
      h += `<div class="day ${out ? "out" : ""} ${isToday ? "today" : ""}"><div class="d"><b>${d.getDate()}</b><button class="add" data-pladd="${d.toISOString()}" aria-label="${t("pl.addOn", { d: fD(d) })}">${ic("plus")}</button></div>
        ${ps.slice(0, 3).map(x => `<button class="post-chip ${x.status}" data-post="${x._id}" title="${esc(x.summary)} · ${t("pst." + x.status)}"><span class="bar" style="background:var(${KIND_COLOR[x.kind]})"></span><span class="st ${x.status}"><i></i></span><span class="t">${fTime(new Date(x.scheduleDate))} ${esc(x.summary)}</span></button>`).join("")}
        ${ps.length > 3 ? `<button class="btn sm ghost" data-plv="list" style="height:22px;font-size:11px">+${ps.length - 3} ${t("common.more")}</button>` : ""}</div>`;
    }
    return h + "</div></div>";
  },
  list() {
    const L = plFiltered().slice().sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
    return L.length ? `<div class="scroll-x"><table class="t"><thead><tr><th>${t("pl.when")}</th><th>${t("pl.content")}</th><th>${t("pl.channel")}</th><th>${t("common.status")}</th></tr></thead><tbody>
      ${L.map(x => `<tr class="click" data-post="${x._id}" tabindex="0"><td class="nowrap">${fDT(new Date(x.scheduleDate))}</td><td><span class="row"><i style="width:3px;height:18px;border-radius:2px;background:var(${KIND_COLOR[x.kind]})"></i>${esc(x.summary)}</span></td>
        <td>${x.kind === "social" ? x.accountIds.map(a => srcBadge(D.accounts.find(c => c._id === a).platform)).join(" ") : `<span class="pill plain">${t("kind." + x.kind)}</span>`}</td><td>${statusDot(x.status)}</td></tr>`).join("")}</tbody></table></div>`
      : emptyState("calendar", t("pl.none"), t("pl.none.b"));
  }
};
function composer({ id, date, text, media } = {}) {
  const post = id ? D.posts.find(p => p._id === id) : null;
  if (post && post.kind !== "social") {
    openDrawer({ title: esc(post.summary), body: `<div class="stack"><div class="row wrap"><span class="pill plain">${t("kind." + post.kind)}</span>${statusDot(post.status)}<span class="small muted">${fDT(new Date(post.scheduleDate))}</span></div><p class="ink2">${t("pl.nonSocial")}</p></div>`,
      foot: `<span class="spacer"></span><button class="btn" data-close="1">${t("act.close")}</button><a class="btn primary" href="#/studio?tpl=${post.kind === "press" ? "press" : "internal"}">${ic("pen")}${t("act.openStudio")}</a>` });
    return;
  }
  const editable = !post || ["draft", "in_review", "failed"].includes(post.status);
  const sel = new Set(post ? post.accountIds : ["acc_ig"]);
  const d0 = post ? new Date(post.scheduleDate) : date ? new Date(new Date(date).setHours(10, 0, 0, 0)) : new Date(+D.TODAY + 864e5);
  const pad = n => String(n).padStart(2, "0"), localVal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  let pv = [...sel][0], att = post ? post.media || null : media || null;
  const mediaField = () => att ? `<div class="cr-att">${crFrame(att, { uid: "cp" })}<div style="flex:1;min-width:0"><b class="small">${esc(att.headline)}</b><div class="small muted">${t("cr.kind.image")} · ${att.fmt}</div></div>${editable ? `<button class="btn sm ghost icon" id="cp-rmmedia" aria-label="${t("act.remove")}">${ic("x")}</button>` : ""}</div>`
    : `<div style="border:1px dashed var(--border-strong);border-radius:10px;padding:14px;text-align:center" class="small muted">${ic("image")} ${t("pl.mediaDrop")}</div>${editable ? `<div class="row"><a class="btn sm ghost" href="#/create">${ic("sparkles")}${t("pl.createWithAI")}</a></div>` : ""}`;
  const draw = () => {
    const txt = $("#cp-text").value, accs = D.accounts.filter(a => sel.has(a._id)), lim = accs.length ? Math.min(...accs.map(a => a.limit)) : 2200;
    const c = $("#cp-count"); c.textContent = t("pl.chars", { n: txt.length, m: lim }); c.classList.toggle("over", txt.length > lim);
    if (!sel.has(pv)) pv = [...sel][0];
    $("#cp-pvtabs").innerHTML = accs.map(a => `<button data-pv="${a._id}" aria-pressed="${a._id === pv}">${t("src." + a.platform)}</button>`).join("");
    const a = D.accounts.find(x => x._id === pv);
    $("#cp-preview").innerHTML = a ? `<div class="preview-card"><div class="ph"><span class="avatar" style="background:var(--accent-soft);color:var(--accent)">KK</span><div><b class="small">${esc(a.name)}</b><div class="small muted">${t("src." + a.platform)} · ${fDT(new Date($("#cp-date").value || d0))}</div></div></div>
      ${att ? `<div class="pv-media">${crFrame(att, { uid: "pv" })}</div>` : a.platform === "instagram" ? `<div class="img">${ic("image")}&nbsp;${t("pl.mediaPh")}</div>` : ""}<div class="cap">${esc(txt) || `<span class="muted">${t("pl.capPh")}</span>`}</div></div>` : `<p class="small muted">${t("pl.pickChannel")}</p>`;
    $$("#cp-pvtabs button").forEach(b => b.onclick = () => { pv = b.dataset.pv; draw(); });
    return { txt, lim };
  };
  openDrawer({
    title: post ? (editable ? t("pl.editPost") : t("pl.postDetails")) : t("pl.newPost"),
    body: `<div class="stack">
      ${post && post.status === "failed" ? `<div class="attn critical" style="border:1px solid var(--border);border-radius:10px"><span class="ic">${ic("alert")}</span><div><b>${t("pl.failedTitle")}</b><p class="small ink2">${t("pl.err." + post.error)}</p></div></div>` : ""}
      ${post && !editable ? `<div class="row">${statusDot(post.status)}<span class="small muted">${t("pl.lockedH")}</span></div>` : ""}
      <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">${t("pl.postTo")}</legend><div class="row wrap">${D.accounts.map(a => `<button class="chip" data-acc="${a._id}" aria-pressed="${sel.has(a._id)}" ${editable ? "" : "disabled"}><span class="src" style="width:20px;height:20px;font-size:9px">${SRC_CODE[a.platform]}</span>${esc(a.name)}</button>`).join("")}</div></fieldset>
      <div class="field"><div class="row"><label for="cp-text" class="label">${t("pl.caption")}</label><span class="spacer"></span><span id="cp-count" class="counter" aria-live="polite"></span></div>
        <textarea id="cp-text" class="input" rows="6" ${editable ? "" : "readonly"} placeholder="${t("pl.capPh")}">${esc(post ? post.summary : text || "")}</textarea>
        <div class="row"><a class="btn sm ghost" href="#/studio?tpl=caption">${ic("sparkles")}${t("pl.writeWithStudio")}</a></div></div>
      <div class="field"><span class="label">${t("pl.media")}</span><div id="cp-media" class="stack" style="gap:6px">${mediaField()}</div></div>
      <div class="field"><label for="cp-date">${t("pl.when")}</label><input id="cp-date" type="datetime-local" class="input" value="${localVal(d0)}" ${editable ? "" : "readonly"}><span class="help">${t("pl.tz")}</span></div>
      <div class="field"><span class="label">${t("pl.preview")}</span><div class="seg" id="cp-pvtabs" role="group" style="align-self:flex-start"></div><div id="cp-preview" style="margin-top:8px"></div></div></div>`,
    foot: editable ? `${post ? `<button class="btn ghost danger" id="cp-del">${t("act.delete")}</button>` : ""}<span class="spacer"></span><button class="btn" data-save="draft">${t("pl.saveDraft")}</button><button class="btn primary" data-save="scheduled">${ic("calendar")}${post && post.status === "failed" ? t("pl.retry") : t("pl.schedule")}</button>`
      : `<span class="spacer"></span><button class="btn" data-close="1">${t("act.close")}</button>`,
    mount() {
      $("#cp-text").addEventListener("input", draw); $("#cp-date").addEventListener("input", draw);
      const bindRm = () => { const rm = $("#cp-rmmedia"); if (rm) rm.onclick = () => { att = null; $("#cp-media").innerHTML = mediaField(); bindRm(); draw(); }; }; bindRm();
      $$("[data-acc]").forEach(b => b.onclick = () => { const k = b.dataset.acc; sel.has(k) ? sel.delete(k) : sel.add(k); b.setAttribute("aria-pressed", sel.has(k)); draw(); });
      draw();
      $$("[data-save]").forEach(b => b.onclick = () => {
        const st = b.dataset.save, { txt, lim } = draw(), dt = new Date($("#cp-date").value);
        if (!sel.size) return toast(t("pl.v.channel"));
        if (!txt.trim()) { $("#cp-text").focus(); return toast(t("pl.v.caption")); }
        if (txt.length > lim) return toast(t("pl.v.long", { m: lim }));
        if (st === "scheduled" && !(dt > D.TODAY)) { $("#cp-date").focus(); return toast(t("pl.v.future")); }
        const body = { accountIds: [...sel], summary: txt, status: st, scheduleDate: dt.toISOString(), type: "post", media: att };
        if (post) { delete post.error; ghl.updatePost(post._id, body); } else ghl.createPost(body);
        S.pl.month = new Date(dt.getFullYear(), dt.getMonth(), 1); S.pl.prefill = null; S.pl.prefillMedia = null;
        closeDrawer(); rerender(); toast(t("toast.postSaved", { s: t("pst." + st) }));
      });
      const del = $("#cp-del"); if (del) del.onclick = () => confirmBox(t("pl.delT"), t("pl.delB"), t("act.delete"), () => { D.posts.splice(D.posts.indexOf(post), 1); closeDrawer(); rerender(); toast(t("toast.postDeleted")); }, true);
    }
  });
}

/* ---------------- REPORTS ---------------- */
V.reports = {
  html() {
    const R = [["pulse", "file"], ["pr", "coins"], ["crisis", "alert"], ["bench", "bars"]];
    return head(t("nav.reports"), t("rep.desc")) + aiCard("ai-report", t("ai.r.t"), aiReport(), rangeMentions().length, `<button class="btn sm" data-aicopy="ai-report">${ic("copy")}${t("act.copy")}</button>`) + '<div style="height:16px"></div>' +
      `<div class="grid g2">${R.map(([k, i]) => `<section class="card"><div class="card-body stack" style="gap:10px"><div class="row"><span class="src" style="width:36px;height:36px">${ic(i)}</span><div><h2>${t("rep." + k)}</h2><p class="small muted">${t("rep." + k + ".d")}</p></div></div>
        <div class="row wrap"><select class="select" aria-label="${t("rep.format")}" data-rf="${k}"><option>PDF</option><option>PowerPoint</option><option>Excel</option></select><span class="small muted">${t("range." + S.range)}</span><span class="spacer"></span><button class="btn primary" data-rep="${k}">${t("rep.generate")}</button></div></div></section>`).join("")}</div>
      <section class="card" style="margin-top:16px"><div class="card-head"><h2>${t("rep.scheduled")}</h2></div><div class="card-body flush scroll-x" style="margin-top:8px">
        <table class="t"><thead><tr><th>${t("rep.name")}</th><th>${t("rep.when")}</th><th>${t("rep.format")}</th><th>${t("rep.to")}</th><th class="r">${t("rep.active")}</th></tr></thead><tbody>
        ${[["pulse", "rep.mon8", "PDF", "Comms team", true], ["pr", "rep.first", "PowerPoint", "Management", true], ["bench", "rep.quarter", "Excel", "Marketing", false]].map(([k, w, f, to, on]) => `<tr><td><b>${t("rep." + k)}</b></td><td>${t(w)}</td><td>${f}</td><td>${to}</td><td class="r"><label class="switch"><input type="checkbox" ${on ? "checked" : ""} aria-label="${t("rep.active")}: ${t("rep." + k)}" data-repsw="1"><span></span></label></td></tr>`).join("")}
        </tbody></table></div></section>`;
  }
};

/* ---------------- WORKSPACE (admins only) ----------------
   Settings were split up: project setup lives in Project settings, brand voice in Studio,
   media rates in Media value. Technical details (crawler frequency, API endpoints) are not shown
   in the app; they belong in the developer documentation. */
const isAdmin = () => (D.team.find(u => u.id === ME) || {}).role === "admin";
V.workspace = {
  html() {
    if (!isAdmin()) return emptyState("alert", t("ws.noAccess"), "");
    return head(t("nav.workspace"), t("ws.desc")) + `<section class="card"><div class="card-body flush scroll-x">${tableHTML([{ l: t("set.member") }, { l: t("set.role") }, { l: t("set.can") }],
      D.team.map(u => [`<span class="row"><span class="avatar">${u.initials}</span><b>${esc(u.name)}</b></span>`, `<select class="select" aria-label="${t("set.role")} ${esc(u.name)}">${["admin", "analyst", "writer"].map(r => `<option ${u.role === r ? "selected" : ""} value="${r}">${t("role." + r)}</option>`).join("")}</select>`, `<span class="small ink2">${t("role." + u.role + ".d")}</span>`]))}</div>
      <div class="card-foot"><button class="btn">${ic("plus")}${t("set.invite")}</button></div></section>`;
  }
};

/* ---------------- BRAND VOICE (opened from Studio) ---------------- */
function openBrandVoice() {
  const s = D.settings;
  const draw = () => `<div class="stack" style="gap:20px">
    <p class="small ink2">${t("bv.desc")}</p>
    <section><h3 style="margin-bottom:8px">${t("set.voiceTraits")}</h3><div class="row wrap">${s.voice.map(v => `<span class="pill plain">${t("voice." + v.split(" ")[0])}</span>`).join("")}</div></section>
    <section><h3 style="margin-bottom:8px">${t("set.keyMsgs")}</h3>
      ${s.keyMessages.length ? `<div class="stack" style="gap:6px">${s.keyMessages.map((k, i) => `<div class="row" style="padding:8px 10px;border:1px solid var(--border);border-radius:10px"><div style="flex:1;min-width:0"><b class="small">${esc(k.en)}</b><div class="small muted">${esc(k.id)}</div></div><button class="btn sm ghost icon" data-bvrm="keyMessages:${i}" aria-label="${t("act.remove")}">${ic("x")}</button></div>`).join("")}</div>` : `<p class="small muted">${t("bv.noMsgs")}</p>`}
      <div class="row wrap" style="margin-top:8px"><input class="input" id="bv-km-en" placeholder="English" style="flex:1;min-width:140px"><input class="input" id="bv-km-id" placeholder="Bahasa Indonesia" style="flex:1;min-width:140px"><button class="btn sm" data-bvadd="keyMessages">${ic("plus")}${t("act.add")}</button></div></section>
    <section><h3 style="margin-bottom:8px">${t("set.banned")}</h3><div class="tagbox">${s.banned.map((b, i) => `<span class="pill plain">${esc(b)}<button class="btn sm ghost icon" style="width:18px;height:18px" data-bvrm="banned:${i}" aria-label="${t("act.remove")} ${esc(b)}">${ic("x")}</button></span>`).join("")}</div>
      <div class="row" style="margin-top:8px"><input class="input" id="bv-ban" placeholder="${t("set.addBanned")}" style="flex:1"><button class="btn sm" data-bvadd="banned">${ic("plus")}${t("act.add")}</button></div></section>
    <section><h3 style="margin-bottom:8px">${t("set.glossary")}</h3>
      ${s.glossary.length ? `<table class="t"><tbody>${s.glossary.map((g, i) => `<tr><td>${esc(g.en)}</td><td class="muted">→</td><td>${esc(g.id)}</td><td class="r"><button class="btn sm ghost icon" data-bvrm="glossary:${i}" aria-label="${t("act.remove")}">${ic("x")}</button></td></tr>`).join("")}</tbody></table>` : `<p class="small muted">${t("bv.noGloss")}</p>`}
      <div class="row wrap" style="margin-top:8px"><input class="input" id="bv-gl-en" placeholder="English" style="flex:1;min-width:140px"><input class="input" id="bv-gl-id" placeholder="Bahasa Indonesia" style="flex:1;min-width:140px"><button class="btn sm" data-bvadd="glossary">${ic("plus")}${t("act.add")}</button></div></section>
  </div>`;
  openDrawer({ title: t("bv.title"), body: draw(), foot: `<span class="spacer"></span><button class="btn primary" data-close="1">${t("act.done")}</button>`,
    mount() {
      const redraw = () => { $(".drawer-body").innerHTML = draw(); if (S.route === "studio") { const c = $("#st-checks"); if (c) c.innerHTML = checksHTML(); } };
      const add = k => {
        const v = id => ($("#" + id) || {}).value?.trim();
        if (k === "keyMessages") { const en = v("bv-km-en"), idv = v("bv-km-id"); if (!en && !idv) return; s.keyMessages.push({ en: en || idv, id: idv || en }); }
        if (k === "banned") { const b = v("bv-ban"); if (!b || s.banned.includes(b)) return; s.banned.push(b); }
        if (k === "glossary") { const en = v("bv-gl-en"), idv = v("bv-gl-id"); if (!en || !idv) { toast(t("bv.needBoth")); return; } s.glossary.push({ en, id: idv }); }
        redraw(); toast(t("toast.saved"));
      };
      $("#drawer").onclick = e => { const a = e.target.closest("[data-bvadd]"), r = e.target.closest("[data-bvrm]");
        if (a) add(a.dataset.bvadd);
        if (r) { const [k, i] = r.dataset.bvrm.split(":"); s[k].splice(+i, 1); redraw(); toast(t("toast.saved")); } };
      $("#drawer").onkeydown = e => { if (e.key !== "Enter" || !e.target.id || !e.target.id.startsWith("bv-")) return; e.preventDefault();
        add(e.target.id.startsWith("bv-km") ? "keyMessages" : e.target.id === "bv-ban" ? "banned" : "glossary"); };
    } });
}

/* ---------------- AI ASSIST ----------------
   Prototype: AI text is generated from the project's own data with templates, so every number
   and citation is real for the dataset. Production: the same inputs go to an LLM, which writes
   the text and must cite the mentions it used. */
const ul = items => `<ul class="ai-list">${items.filter(Boolean).map(x => `<li>${x}</li>`).join("")}</ul>`;
const rangeMentions = () => D.mentions.filter(inRange);
function countBy(arr, f) { const o = {}; arr.forEach(x => { const k = f(x); o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); }
const isQuestion = m => m.text.includes("?");
/* AI answers cite each distinct text once (reposts and syndicated copies repeat the same text). */
const uniqText = L => L.filter((m, i, a) => a.findIndex(x => x.text === m.text) === i);
const mLink = m => `<a href="#/mentions?search=${encodeURIComponent(m.text.slice(0, 28))}" class="ai-cite">${esc(m.author.name)}</a>`;
const topicName = k => `<b>${t("topic." + k)}</b>`;
function bestTimes(L) {
  const h = {}, wd = {};
  L.forEach(m => { const v = inter(m) + 1; h[m.date.getHours()] = (h[m.date.getHours()] || 0) + v; wd[m.date.getDay()] = (wd[m.date.getDay()] || 0) + v; });
  const top = o => { const e = Object.entries(o).sort((a, b) => b[1] - a[1])[0]; return e ? +e[0] : null; };
  const hour = top(h), day = top(wd);
  return { hour: hour === null ? 18 : hour, day: day === null ? 6 : day };
}
const dayName = d => fD(new Date(2026, 10, 15 + d), { weekday: "long" });
function aiCard(id, title, body, n, actions = "") {
  return `<section class="card ai-card" id="${id}" aria-live="polite"><div class="card-head"><span class="ai-badge">${ic("sparkles")}AI</span><h2>${title}</h2><span class="spacer"></span>
    <button class="btn sm ghost icon" data-airegen="${id}" aria-label="${t("ai.regen")}" title="${t("ai.regen")}">${ic("refresh")}</button><button class="btn sm ghost icon" data-aicopy="${id}" aria-label="${t("act.copy")}" title="${t("act.copy")}">${ic("copy")}</button></div>
    <div class="card-body"><div class="ai-body">${body}</div>${actions ? `<div class="row wrap" style="margin-top:12px">${actions}</div>` : ""}
    <p class="ai-note">${t("ai.note", { n: fI(n) })}</p></div></section>`;
}
function aiBrief() {
  const Pd = period(), L = rangeMentions(), tops = countBy(L, m => m.topic), top = L.slice().sort((a, b) => impact(b) - impact(a))[0];
  const q = L.filter(isQuestion), neg = L.filter(m => m.sentiment === "neg"), up = Pd.c.tot >= Pd.p.tot;
  return { n: L.length, body: ul([
    t(up ? "ai.b.volUp" : "ai.b.volDown", { d: fP(Math.abs(Pd.c.tot / (Pd.p.tot || 1) - 1)), n: fI(Pd.c.tot), r: t("range." + S.range) }),
    tops.length ? t("ai.b.topic", { topic: topicName(tops[0][0]), s: fP(tops[0][1] / L.length) }) : "",
    t(neg.length ? "ai.b.sent" : "ai.b.sentClean", { p: fP(Pd.c.pos / (Pd.c.tot || 1)), n: fP(Pd.c.neg / (Pd.c.tot || 1)) }),
    top ? t("ai.b.top", { a: mLink(top), s: nf(impact(top), { maximumFractionDigits: 1 }) }) : "",
    q.length ? t("ai.b.questions", { n: q.length }) : neg.length ? t("ai.b.negRead", { n: neg.length }) : t("ai.b.amplify")
  ]) };
}
function aiMentionsSummary(L) {
  if (!L.length) return `<p class="muted">${t("mentions.none")}</p>`;
  const pos = L.filter(m => m.sentiment === "pos").length, neg = L.filter(m => m.sentiment === "neg").length;
  const tops = countBy(L, m => m.topic).slice(0, 3), srcs = countBy(L, m => m.source).slice(0, 2);
  const best = uniqText(L.slice().sort((a, b) => impact(b) - impact(a))).slice(0, 3), q = L.filter(isQuestion);
  return `<p>${t("ai.s.intro", { n: fI(L.length), p: fP(pos / L.length), g: fP(neg / L.length) })}</p>
    <h3 style="margin-top:12px">${t("ai.s.themes")}</h3>${ul(tops.map(([k, c]) => `${topicName(k)}: ${fI(c)} ${t("ai.s.mentions")}`))}
    <h3 style="margin-top:12px">${t("ai.s.sources")}</h3><p>${srcs.map(([k, c]) => `${t("src." + k)} (${fI(c)})`).join(", ")}</p>
    <h3 style="margin-top:12px">${t("ai.s.notable")}</h3>${ul(best.map(m => `${mLink(m)}: “${esc(m.text.slice(0, 90))}${m.text.length > 90 ? "…" : ""}” <span class="muted">· ${t("score.impact")} ${nf(impact(m), { maximumFractionDigits: 1 })}</span>`))}
    <h3 style="margin-top:12px">${t("ai.s.todo")}</h3>${ul([q.length ? t("ai.s.todoQ", { n: q.length }) : "", neg ? t("ai.s.todoNeg", { n: neg }) : "", t("ai.s.todoShare")])}`;
}
function aiAction(m) {
  if (m.sentiment === "neg") return { k: "respond", cta: "reply" };
  if (isQuestion(m)) return { k: "answer", cta: "reply" };
  if (m.sentiment === "pos" && m.author.type !== "media") return { k: "thank", cta: "reply" };
  if (m.source === "news" || m.source === "blogs") return { k: m.sentiment === "pos" ? "share" : "none", cta: m.sentiment === "pos" ? "post" : "" };
  return { k: "none", cta: "" };
}
function aiInsights(tab) {
  const Pd = period(), L = rangeMentions(), c = Pd.c, p = Pd.p;
  if (tab === "engagement") {
    const bySrc = {}; L.forEach(m => (bySrc[m.source] = (bySrc[m.source] || 0) + inter(m))); const s = Object.entries(bySrc).sort((a, b) => b[1] - a[1])[0];
    const top = L.slice().sort((a, b) => inter(b) - inter(a))[0], bt = bestTimes(L);
    return ul([t("ai.i.inter", { d: deltaWord(c.inter, p.inter) }), s ? t("ai.i.src", { s: `<b>${t("src." + s[0])}</b>`, p: fP(s[1] / (c.inter || 1)) }) : "",
      top ? t("ai.i.topPost", { a: mLink(top), n: fI(inter(top)) }) : "", t("ai.i.time", { d: dayName(bt.day), h: String(bt.hour).padStart(2, "0") + ":00" })]);
  }
  if (tab === "sentiment") {
    const weak = D.aspects.slice().sort((a, b) => b.neg - a.neg)[0], strong = D.aspects.slice().sort((a, b) => b.pos - a.pos)[0];
    return ul([t("ai.i.net", { v: (c.net >= 0 ? "+" : "") + nf(c.net * 100, { maximumFractionDigits: 0 }), d: (() => { const dp = Math.round((c.net - p.net) * 100); return Math.abs(dp) < 2 ? t("ai.flat") : t(dp > 0 ? "ai.up" : "ai.down", { p: Math.abs(dp) + " " + t("common.pts") }); })() }),
      t("ai.i.strong", { a: `<b>${t("asp." + strong.key)}</b>`, p: fP(strong.pos) }), weak.neg > 0.05 ? t("ai.i.weak", { a: `<b>${t("asp." + weak.key)}</b>`, p: fP(weak.neg) }) : t("ai.i.noWeak")]);
  }
  if (tab === "topics") {
    const tp = D.topics.slice().sort((a, b) => b.trend - a.trend)[0], big = D.topics[0];
    return ul([big ? t("ai.i.bigTopic", { t: topicName(big.key), n: fI(big.count) }) : "", tp ? t("ai.i.rising", { t: topicName(tp.key), p: fP(tp.trend) }) : "", t("ai.i.topicTip")]);
  }
  if (tab === "emotions") { const e = D.emotions.slice().sort((a, b) => b.v - a.v); const tot = sum(e, "v") || 1;
    return ul([e[0] ? t("ai.i.emo", { e: `<b>${t("emo." + e[0].key)}</b>`, p: fP(e[0].v / tot) }) : "", t(D.simulated ? "ins.emotionRead.g2" : "ins.emotionRead.2")]); }
  const loc = countBy(L, m => m.location)[0], voice = D.authors.slice().sort((a, b) => influence(b) - influence(a))[0], src = countBy(L, m => m.source)[0];
  return ul([src ? t("ai.i.aud1", { s: `<b>${t("src." + src[0])}</b>`, p: fP(src[1] / (L.length || 1)) }) : "", loc ? t("ai.i.aud2", { l: `<b>${esc(loc[0])}</b>` }) : "", voice ? t("ai.i.aud3", { a: `<b>${esc(voice.name)}</b>`, s: nf(influence(voice), { maximumFractionDigits: 1 }) }) : ""]);
}
function deltaWord(cur, prev) { if (!prev) return t("ai.flat"); const d = (cur - prev) / Math.abs(prev); return Math.abs(d) < 0.03 ? t("ai.flat") : t(d > 0 ? "ai.up" : "ai.down", { p: fP(Math.abs(d)) }); }
function aiBench(rows, all) {
  if (rows.length < 2) return ul([t("ai.bn.none")]);
  const own = rows[0], lead = rows.slice().sort((a, b) => b.v - a.v)[0], negW = rows.slice().sort((a, b) => b.st.neg - a.st.neg)[0];
  return ul([lead.b.own ? t("ai.bn.lead", { s: fP(own.v / all) }) : t("ai.bn.behind", { c: `<b>${esc(lead.b.name)}</b>`, g: nf((lead.v - own.v) / all * 100, { maximumFractionDigits: 0 }) }),
    t("ai.bn.sent", { o: fP(own.st.pos), c: `<b>${esc(negW.b.name)}</b>`, n: fP(negW.st.neg) }), t("ai.bn.tip")]);
}
function aiAlert(a) { return t("ai.al." + a.kind, { topic: a.topic ? t("topic." + a.topic) : "", author: a.author || "" }); }
function aiPostIdeas() {
  const L = rangeMentions(), bt = bestTimes(L), tops = countBy(L, m => m.topic).map(x => x[0]);
  const ugc = L.filter(m => m.sentiment === "pos" && m.author.type !== "media").sort((a, b) => impact(b) - impact(a))[0];
  const kw = D.keywords.slice().sort((a, b) => b.d - a.d)[0];
  const nextDate = add => { const d = new Date(D.TODAY); d.setDate(d.getDate() + add); while (d.getDay() !== bt.day && add < 14) { d.setDate(d.getDate() + 1); add++; } d.setHours(bt.hour, 0, 0, 0); return d; };
  const brand = D.project.name, tag = "#" + brand.replace(/\s+/g, "");
  const ideas = [];
  if (tops[0]) ideas.push({ k: "topic", title: t("ai.p.topicT", { t: t("topic." + tops[0]) }), caption: t("ai.p.topicC", { t: t("topic." + tops[0]).toLowerCase(), b: brand, tag }), date: nextDate(1) });
  if (ugc) ideas.push({ k: "ugc", title: t("ai.p.ugcT", { a: ugc.author.name }), caption: t("ai.p.ugcC", { a: ugc.author.handle, tag }), date: nextDate(3), src: ugc });
  if (kw) ideas.push({ k: "kw", title: t("ai.p.kwT", { w: kw.w }), caption: t("ai.p.kwC", { w: kw.w.split(" / ")[0], b: brand, tag }), date: nextDate(5) });
  return { ideas, bt };
}
function aiReport() {
  const Pd = period(), L = rangeMentions(), tops = countBy(L, m => m.topic).slice(0, 2), news = L.filter(m => m.source === "news").length;
  return `<p>${t("ai.r.p1", { b: esc(D.project.name), r: t("range." + S.range), n: fI(Pd.c.tot), d: deltaWord(Pd.c.tot, Pd.p.tot), pr: fP(Pd.c.pos / (Pd.c.tot || 1)), ng: fP(Pd.c.neg / (Pd.c.tot || 1)) })}</p>
    <p style="margin-top:8px">${t("ai.r.p2", { t1: tops[0] ? topicName(tops[0][0]) : "–", t2: tops[1] ? topicName(tops[1][0]) : "–", nw: fP(news / (L.length || 1)), i: fN(Pd.c.inter), s: Pd.c.presence })}</p>
    <p style="margin-top:8px">${t("ai.r.p3")}</p>`;
}
/* ---- Ask AI: answers questions about the active project's data, with citations ---- */
const ASK = { msgs: [] };
function askAnswer(q) {
  const s = q.toLowerCase(), L = rangeMentions();
  const has = (...w) => w.some(x => s.includes(x));
  if (has("negat", "keluhan", "complain", "kritik", "buruk")) { const n = uniqText(L.filter(m => m.sentiment === "neg").sort((a, b) => impact(b) - impact(a)));
    return n.length ? t("ai.a.neg", { n: n.length }) + ul(n.slice(0, 3).map(m => `${mLink(m)}: “${esc(m.text.slice(0, 80))}”`)) : t("ai.a.negNone"); }
  if (has("best", "terbaik", "perform", "interak", "engag", "viral", "top post")) { const b = uniqText(L.slice().sort((a, b) => inter(b) - inter(a))).slice(0, 3);
    return t("ai.a.best") + ul(b.map(m => `${mLink(m)} · ${fI(inter(m))} ${t("kpi.inter").toLowerCase()} · “${esc(m.text.slice(0, 60))}…”`)); }
  if (has("when", "kapan", "jam", "time", "waktu")) { const bt = bestTimes(L); return t("ai.a.time", { d: dayName(bt.day), h: String(bt.hour).padStart(2, "0") + ":00" }); }
  if (has("compet", "kompetitor", "banding", "compare", "share of voice", "sov")) { const all = D.brands.map(b => sum(D.brandDaily[b.key].slice(-S.range))), tot = sum(all) || 1;
    return t("ai.a.bench") + ul(D.brands.map((b, i) => `${b.own ? "<b>" + esc(b.name) + "</b>" : esc(b.name)}: ${fP(all[i] / tot)}`)); }
  if (has("summar", "ringkas", "rangkum", "overview", "minggu ini", "this week", "what are people", "apa yang")) return aiBrief().body;
  const sm = smartTerms(q), hits = sm.terms.length ? L.filter(m => sm.terms.some(tm => (m.text + " " + (m.translation || "")).toLowerCase().includes(tm))) : [];
  if (hits.length) return t("ai.a.found", { n: hits.length, c: sm.concepts.map(c => t("concept." + c)).join(", ") }) + ul(uniqText(hits).slice(0, 3).map(m => `${mLink(m)}: “${esc(m.text.slice(0, 80))}”`)) +
    `<a class="btn sm" href="#/mentions?search=" data-asksmart="${esc(q)}">${t("ai.a.openAll")}</a>`;
  return t("ai.a.unknown");
}
function openAsk(prefill) {
  const sugg = ["ai.q1", "ai.q2", "ai.q3", "ai.q4", "ai.q5"];
  const draw = () => {
    $("#ask-log").innerHTML = ASK.msgs.length ? ASK.msgs.map(m => m.me ? `<div class="msg me">${esc(m.text)}</div>` : `<div class="msg ai"><span class="ai-badge">${ic("sparkles")}AI</span><div>${m.html}</div></div>`).join("")
      : `<div class="empty" style="padding:24px 8px">${ic("sparkles")}<b>${t("ai.askEmpty", { b: esc(D.project.name) })}</b><p>${t("ai.askEmptyB")}</p></div>`;
    $("#ask-log").scrollTop = 1e6;
  };
  openDrawer({ title: `${t("ai.ask")} · ${esc(D.project.name)}`,
    body: `<div class="ask-wrap"><div id="ask-log" class="ask-log"></div><div class="row wrap" style="gap:6px">${sugg.map(k => `<button class="chip" data-askq="${esc(t(k))}">${t(k)}</button>`).join("")}</div></div>`,
    foot: `<label class="sr-only" for="ask-in">${t("ai.ask")}</label><input id="ask-in" class="input" style="flex:1" placeholder="${t("ai.askPh")}" value="${esc(prefill || "")}" autocomplete="off"><button class="btn primary" id="ask-go">${ic("send")}${t("ai.send")}</button>`,
    mount() {
      draw();
      const send = q => { q = (q || $("#ask-in").value).trim(); if (!q) return; ASK.msgs.push({ me: 1, text: q }); $("#ask-in").value = ""; draw();
        $("#ask-log").insertAdjacentHTML("beforeend", `<div class="msg ai" id="ask-typing"><span class="ai-badge">${ic("sparkles")}AI</span><div><div class="skeleton" style="width:180px"></div></div></div>`);
        setTimeout(() => { ASK.msgs.push({ html: askAnswer(q) + `<p class="ai-note">${t("ai.note", { n: fI(rangeMentions().length) })}</p>` }); draw(); }, 600); };
      $("#ask-go").onclick = () => send();
      $("#ask-in").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); send(); } });
      $("#drawer").onclick = e => { const b = e.target.closest("[data-askq]"); if (b) send(b.dataset.askq); const sm = e.target.closest("[data-asksmart]");
        if (sm) { e.preventDefault(); closeDrawer(); resetMFilters(); S.m.smart = sm.dataset.asksmart; location.hash = "#/mentions"; if (S.route === "mentions") rerender(); } };
      setTimeout(() => $("#ask-in").focus(), 80);
    } });
}
function openIdeas() {
  const { ideas, bt } = aiPostIdeas();
  openDrawer({ title: t("ai.ideas"), body: `<div class="stack"><p class="small ink2">${t("ai.p.intro", { d: dayName(bt.day), h: String(bt.hour).padStart(2, "0") + ":00" })}</p>
    ${ideas.map((x, i) => `<section class="card ai-card"><div class="card-body stack" style="gap:8px"><div class="row"><span class="ai-badge">${ic("sparkles")}AI</span><b style="flex:1">${esc(x.title)}</b></div>
      <div class="quote" style="font-size:14px;white-space:pre-wrap">${esc(x.caption)}</div>
      <div class="row wrap"><span class="small muted">${ic("calendar")} ${fDT(x.date)}</span><span class="spacer"></span><button class="btn sm primary" data-aiadd="${i}">${ic("plus")}${t("ai.p.add")}</button></div></div></section>`).join("")}
    <p class="ai-note">${t("ai.note", { n: fI(rangeMentions().length) })}</p></div>`,
    mount() { $("#drawer").onclick = e => { const b = e.target.closest("[data-aiadd]"); if (!b) return; const x = ideas[+b.dataset.aiadd];
      ghl.createPost({ accountIds: [D.accounts[0]._id], summary: x.caption, status: "draft", scheduleDate: x.date.toISOString(), type: "post" });
      b.disabled = true; b.innerHTML = `${ic("check")}${t("ai.p.added")}`; S.pl.month = new Date(x.date.getFullYear(), x.date.getMonth(), 1); if (S.route === "planner") $("#content").innerHTML = V.planner.html(); toast(t("ai.p.addedT")); }; } });
}
function aiInsightsCard() { return aiCard("ai-ins", t("ai.ins.t." + S.ins.tab), aiInsights(S.ins.tab), rangeMentions().length, `<button class="btn sm" data-aiask="1">${ic("sparkles")}${t("ai.askMore")}</button>`); }

/* ---------------- PROJECTS ---------------- */
/* A project = one brand with its own keywords, sources and dashboard. Prototype keeps user
   projects in this browser and simulates their data; production stores them on the server
   and starts real collection jobs. */
const PROJ = {
  user: store.get("projects", []),
  cache: {},
  hidden: store.get("hiddenPresets", []),
  all() { return [...window.PROJECT_PRESETS.filter(p => !this.hidden.includes(p.id)), ...this.user]; },
  get(id) { return this.all().find(p => p.id === id); },
  data(id) { return this.cache[id] || (this.cache[id] = window.buildDataset(this.get(id))); },
  save() { store.set("projects", this.user); },
  /* Edits to built-in projects are stored as overrides; user projects are saved whole. */
  saveEdit(p) { if (window.PROJECT_PRESETS.includes(p)) { const o = store.get("presetEdits", {}); o[p.id] = { name: p.name, domain: p.domain, keywords: p.keywords, excluded: p.excluded, competitors: p.competitors, langs: p.langs, sources: p.sources }; store.set("presetEdits", o); } else this.save(); }
};
(() => { const o = store.get("presetEdits", {}); window.PROJECT_PRESETS.forEach(p => o[p.id] && Object.assign(p, o[p.id])); })();
const ALL_SOURCES = ["news", "tiktok", "x", "youtube", "blogs", "bluesky"];
const brandMark = (p, cls = "") => p.id === "kkb" ? `<span class="brand-mark logo ${cls}" aria-hidden="true"><img src="assets/kkb-icon-192.png" alt=""></span>` : `<span class="brand-mark ${cls}" aria-hidden="true">${esc(initials(p.name))}</span>`;
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
function activateProject(id) {
  if (!PROJ.get(id)) id = PROJ.all()[0].id;
  D = PROJ.data(id); store.set("activeProject", id);
  loadVisited(); resetMFilters();
  Object.assign(S.st, { text: "", brief: "", ctx: null, gen: null, draftId: null });
  Object.assign(S.pl, { month: new Date(2026, 10, 1), prefill: null });
}
function projectStats(p) {
  const d = PROJ.data(p.id), days = d.days.slice(-30), pos = sum(days, "pos"), neu = sum(days, "neu"), neg = sum(days, "neg"), tot = pos + neu + neg;
  return { m30: tot, neg: tot ? neg / tot : 0, presence: presence({ tot, reach: sum(days, "reach"), inter: sum(days, "reactions") + sum(days, "comments") + sum(days, "shares") }) };
}
V.projects = {
  html() {
    return head(t("proj.title"), t("proj.desc"), `<a class="btn primary" href="#/new-project">${ic("plus")}${t("proj.new")}</a>`) +
      `<div class="grid g3">${PROJ.all().map(p => { const st = projectStats(p), active = D.project.id === p.id;
        return `<section class="card"><div class="card-body stack" style="gap:12px">
          <div class="row">${brandMark(p)}<div style="min-width:0;flex:1"><b>${esc(p.name)}</b><div class="small muted">${esc(p.domain || t("proj.noDomain"))}</div></div>
            ${active ? `<span class="pill"><i class="dot" style="background:var(--good)"></i>${t("proj.active")}</span>` : ""}</div>
          <div class="tagbox">${p.keywords.slice(0, 5).map(k => `<span class="pill plain">${esc(k)}</span>`).join("")}${p.keywords.length > 5 ? `<span class="small muted">+${p.keywords.length - 5}</span>` : ""}</div>
          <div class="grid g3" style="gap:8px"><div><div class="small muted">${t("proj.mentions30")}</div><b class="num">${fI(st.m30)}</b></div>
            <div><div class="small muted">${t("kpi.presence")}</div><b class="num">${st.presence}/100</b></div><div><div class="small muted">${t("s.neg")}</div><b class="num">${fP(st.neg)}</b></div></div>
          <div class="row"><span class="small muted">${p.id === "kkb" ? t("proj.src.b24") : t("proj.src.sim")}</span><span class="spacer"></span>
            <a class="btn sm ghost" href="#/project-settings?id=${p.id}">${t("ps.short")}</a><button class="btn sm ghost danger" data-projdel="${p.id}" ${PROJ.all().length < 2 ? `disabled title="${t("proj.lastOne")}"` : ""}>${t("act.delete")}</button>
            <button class="btn sm ${active ? "" : "primary"}" data-projopen="${p.id}">${t("proj.open")}</button></div>
        </div></section>`; }).join("")}
        <a class="card proj-new" href="#/new-project">${ic("plus")}<b>${t("proj.new")}</b><span class="small muted">${t("proj.newB")}</span></a></div>`;
  }
};

/* NP holds the project form; it is shared by "New project" (mode "new") and "Project settings" (mode "edit"). */
const NP = {
  reset() { Object.assign(this, { mode: "new", editId: null, name: "", domain: "", keywords: [], excluded: [], competitors: [], langs: ["id", "en"], sources: [...ALL_SOURCES], err: "" }); },
  load(p) { Object.assign(this, { mode: "edit", editId: p.id, name: p.name, domain: p.domain || "", keywords: [...p.keywords], excluded: [...p.excluded], competitors: [...p.competitors], langs: [...p.langs], sources: [...p.sources], err: "" }); }
};
NP.reset();
function chipField(key, label, help, ph, max) {
  const full = max && NP[key].length >= max;
  return `<div class="field"><label for="np-${key}">${label}</label><div class="chipfield ${NP.err === key ? "invalid" : ""}">${NP[key].map((v, i) => `<span class="pill plain">${esc(v)}<button type="button" class="btn sm ghost icon" style="width:18px;height:18px" data-chiprm="${key}:${i}" aria-label="${t("act.remove")} ${esc(v)}">${ic("x")}</button></span>`).join("")}
    <input id="np-${key}" data-chipin="${key}" placeholder="${full ? t("np.max", { n: max }) : ph}" ${full ? "disabled" : ""} autocomplete="off"></div>${help ? `<span class="help">${help}</span>` : ""}</div>`;
}
function npSuggestions() {
  const n = NP.name.trim(); if (!n) return [];
  const ns = n.replace(/\s+/g, ""), out = [n, ns.toLowerCase(), "#" + ns];
  if (NP.domain.trim()) out.push(NP.domain.trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""));
  return [...new Set(out)].filter(x => x.length > 1 && !NP.keywords.some(k => k.toLowerCase() === x.toLowerCase()));
}
function renderNpSug() { const el = $("#np-sug"); if (!el) return; const s = npSuggestions();
  el.innerHTML = s.length ? `<div class="row wrap"><span class="small muted">${t("np.suggest")}</span>${s.map(x => `<button type="button" class="chip" data-npsug="${esc(x)}">+ ${esc(x)}</button>`).join("")}</div>` : ""; }
function addChips(key, raw) {
  const max = key === "competitors" ? 3 : 50;
  raw.split(/[,\n]/).map(x => x.trim()).filter(Boolean).forEach(v => { if (NP[key].length < max && !NP[key].some(k => k.toLowerCase() === v.toLowerCase())) NP[key].push(v); });
  if (NP.err === key) NP.err = "";
}
function npFormHTML() {
  const edit = NP.mode === "edit";
  return `<div class="grid g-main"><section class="card"><div class="card-body stack" style="gap:18px">
        <div class="grid g2" style="gap:12px"><div class="field"><label for="np-name">${t("np.name")} *</label><input id="np-name" class="input ${NP.err === "name" ? "invalid" : ""}" value="${esc(NP.name)}" placeholder="${t("np.namePh")}" autocomplete="off"></div>
          <div class="field"><label for="np-domain">${t("np.domain")}</label><input id="np-domain" class="input" value="${esc(NP.domain)}" placeholder="${t("np.domainPh")}" autocomplete="off"></div></div>
        <div class="stack" style="gap:8px">${chipField("keywords", t("np.keywords") + " *", t("np.keywordsH"), t("np.keywordsPh"))}<div id="np-sug"></div></div>
        ${chipField("excluded", t("np.excluded"), t("np.excludedH"), t("np.chipPh"))}
        ${chipField("competitors", t("np.competitors"), t("np.competitorsH"), t("np.chipPh"), 3)}
        <div class="grid g2" style="gap:12px">
          <fieldset class="fgroup"><legend>${t("np.langs")}</legend><div class="row wrap">${[["id", "Bahasa Indonesia"], ["en", "English"]].map(([k, l]) => `<label class="fcheck"><input type="checkbox" data-nplang="${k}" ${NP.langs.includes(k) ? "checked" : ""}><span>${l}</span></label>`).join("")}</div></fieldset>
          <fieldset class="fgroup"><legend>${t("np.sources")}</legend><div class="fgrid" style="grid-template-columns:1fr 1fr">${ALL_SOURCES.map(k => `<label class="fcheck"><input type="checkbox" data-npsrc="${k}" ${NP.sources.includes(k) ? "checked" : ""}>${srcBadge(k).replace('class="src"', 'class="src xs"')}<span>${t("src." + k)}</span></label>`).join("")}</div></fieldset>
        </div>
        ${NP.err ? `<p class="small" style="color:var(--down-text)" role="alert">${t("np.v." + NP.err)}</p>` : ""}
      </div><div class="card-foot"><span class="spacer"></span><a class="btn" href="${edit ? "#/home" : "#/projects"}">${t("act.cancel")}</a>${edit ? `<button class="btn primary" data-npsave="1">${ic("check")}${t("ps.save")}</button>` : `<button class="btn primary" data-npcreate="1">${ic("sparkles")}${t("np.create")}</button>`}</div></section>
      <aside class="stack">${edit ? `<section class="card"><div class="card-head"><h2>${t("ps.sideT")}</h2></div><div class="card-body small ink2 stack" style="gap:10px"><p>${t("ps.side1")}</p><p>${t("ps.side2")}</p></div></section>
        <section class="card danger-zone"><div class="card-body stack" style="gap:10px"><b>${t("proj.dangerT")}</b><p class="small ink2">${t("proj.dangerB", { n: esc(NP.name) })}</p>
        <button class="btn danger" data-projdel="${NP.editId}" ${PROJ.all().length < 2 ? `disabled title="${t("proj.lastOne")}"` : ""} style="align-self:flex-start">${t("proj.deleteBtn")}</button></div></section>`
      : `<section class="card"><div class="card-head"><h2>${t("np.howTitle")}</h2></div><div class="card-body small ink2 stack" style="gap:10px">
        <p><b style="color:var(--ink)">1.</b> ${t("np.how1")}</p><p><b style="color:var(--ink)">2.</b> ${t("np.how2")}</p><p><b style="color:var(--ink)">3.</b> ${t("np.how3")}</p></div></section>`}</aside></div>`;
}
const npMount = () => {
    renderNpSug();
    $("#np-name").addEventListener("input", e => { NP.name = e.target.value; if (NP.err === "name") { NP.err = ""; e.target.classList.remove("invalid"); } renderNpSug(); });
    $("#np-domain").addEventListener("input", e => { NP.domain = e.target.value; renderNpSug(); });
};
V["new-project"] = { html() { if (NP.mode === "edit") NP.reset(); return head(t("np.title"), t("np.desc")) + npFormHTML(); }, mount: npMount };
V["project-settings"] = {
  html() { if (NP.mode !== "edit") NP.load(PROJ.get(S.q.id) || D.project); return head(t("ps.title", { n: esc(NP.name) }), t("ps.desc")) + npFormHTML(); },
  mount: npMount
};
function npRefocus(key) { rerender(); const i = $("#np-" + key); if (i && !i.disabled) i.focus(); }
function npValidate() {
  document.querySelectorAll("[data-chipin]").forEach(i => { if (i.value.trim()) addChips(i.dataset.chipin, i.value); });
  NP.err = !NP.name.trim() ? "name" : !NP.keywords.length ? "keywords" : !NP.langs.length ? "langs" : !NP.sources.length ? "sources" : "";
  if (NP.err) { rerender(); const f = document.querySelector(NP.err === "name" ? "#np-name" : NP.err === "keywords" ? "#np-keywords" : "[data-npcreate], [data-npsave]"); f && f.focus(); return false; }
  return true;
}
function npSave() {
  if (!npValidate()) return;
  const p = PROJ.get(NP.editId), changed = p.keywords.join("|") !== NP.keywords.join("|") || p.sources.join() !== NP.sources.join() || p.langs.join() !== NP.langs.join() || p.competitors.join("|") !== NP.competitors.join("|");
  Object.assign(p, { name: NP.name.trim(), domain: NP.domain.trim(), keywords: [...NP.keywords], excluded: [...NP.excluded], competitors: [...NP.competitors], langs: [...NP.langs], sources: [...NP.sources] });
  PROJ.saveEdit(p);
  if (changed) delete PROJ.cache[p.id];
  if (D.project.id === p.id) { if (changed) activateProject(p.id); else D.project = p; }
  NP.load(p); rerender(); toast(changed ? t("toast.psSavedRe") : t("toast.saved"));
}
function npCreate() {
  if (!npValidate()) return;
  const p = { id: "p" + Date.now().toString(36), name: NP.name.trim(), domain: NP.domain.trim(), keywords: [...NP.keywords], excluded: [...NP.excluded], competitors: [...NP.competitors],
    langs: [...NP.langs], sources: [...NP.sources], created: new Date().toISOString() };
  PROJ.user.push(p); PROJ.save(); NP.reset();
  location.hash = "#/processing?id=" + p.id;
}
V.processing = {
  html() {
    const p = PROJ.get(S.q.id);
    if (!p) return emptyState("alert", t("pr.missing"), "");
    const steps = ["s1", "s2", "s3", "s4", "s5"];
    return head(t("pr.title", { n: esc(p.name) }), t("pr.desc")) +
      `<section class="card" style="max-width:680px"><div class="card-body stack" style="gap:16px">
        <div class="tagbox">${p.keywords.map(k => `<span class="pill plain">${esc(k)}</span>`).join("")}</div>
        <ol class="psteps">${steps.map((k, i) => `<li class="pstep" data-step="${i}"><span class="pdot"></span><span>${t("pr." + k, { src: p.sources.map(s => t("src." + s)).join(", ") })}</span></li>`).join("")}</ol>
        <div class="row"><b class="num" id="pr-count" style="font-size:24px">0</b><span class="muted">${t("pr.found")}</span></div>
        <div class="bar" style="height:6px;background:var(--surface-3);border-radius:99px;overflow:hidden"><i id="pr-bar" style="display:block;height:100%;width:0;background:var(--accent);transition:width .4s"></i></div>
        <div id="pr-done"></div>
        <p class="help">${t("pr.note")}</p></div></section>`;
  },
  mount() {
    const p = PROJ.get(S.q.id); if (!p) return;
    const data = PROJ.data(p.id), total = data.mentions.filter(m => m.date > new Date(+data.TODAY - 30 * 864e5)).length, steps = $$(".pstep");
    let i = 0;
    const tick = () => {
      if (S.route !== "processing" || S.q.id !== p.id) return;
      steps.forEach((s, k) => s.className = "pstep " + (k < i ? "done" : k === i ? "active" : ""));
      $("#pr-count").textContent = fI(Math.round(total * Math.min(1, i / 4)));
      $("#pr-bar").style.width = (i / 5) * 100 + "%";
      if (i < 5) { i++; setTimeout(tick, 850); return; }
      $("#pr-done").innerHTML = `<div class="attn calm" style="border:1px solid var(--border);border-radius:10px"><span class="ic">${ic("check")}</span><div style="flex:1"><b>${t("pr.done")}</b><p class="small ink2">${t("pr.doneB", { n: fI(total) })}</p></div><button class="btn primary" data-projopen="${p.id}">${t("proj.open")}</button></div>`;
      toast(t("toast.projReady", { n: esc(p.name) }));
    };
    tick();
  }
};
function deleteProject(id) {
  const p = PROJ.get(id); if (!p) return;
  if (PROJ.all().length < 2) { toast(t("proj.lastOne")); return; }
  confirmBox(t("proj.delT", { n: esc(p.name) }), t("proj.delB"), t("proj.deleteBtn"), () => {
    if (window.PROJECT_PRESETS.some(x => x.id === id)) { PROJ.hidden.push(id); store.set("hiddenPresets", PROJ.hidden); }
    else { PROJ.user = PROJ.user.filter(x => x.id !== id); PROJ.save(); }
    delete PROJ.cache[id]; try { localStorage.removeItem("bi.visited." + ME + "." + id); } catch {}
    const wasActive = D.project.id === id;
    if (wasActive) activateProject(PROJ.all()[0].id);
    if (S.route === "project-settings" || wasActive) location.hash = "#/projects";
    rerender(); toast(t("toast.projDeleted", { n: esc(p.name) }));
  }, true);
}
function openProject(id) {
  const same = D.project.id === id;
  if (!same) activateProject(id);
  if (S.route === "home") rerender(); else location.hash = "#/home";
  if (!same) toast(t("toast.switched", { n: esc(D.project.name) }));
}

/* ================================================================ AI CONTENT (images) */
/* Prototype: visuals are drawn as SVG scenes from the brief, so the flow can be clicked through
   without an image model. Production sends the same brief + brand kit to an image model
   and keeps these brand checks on the result. */
const CR_FMT = ["4:5", "1:1", "9:16", "16:9"];
const CR_STYLES = ["photo", "editorial", "illustration", "graphic"];
S.cr = { fmt: "4:5", style: "photo", lang: null, brief: "", headline: "", logo: true, text: true, library: true, ctx: null, results: [], sel: 0, busy: false, seed: 7, lib: [] };
const CR_PAL = [
  { sky: ["#f3c98f", "#f6e7cc"], sun: "#f7b45c", sea: ["#4a9a93", "#285f5b"], land: "#2b512b", sand: "#e9dcc0", far: "#6f8f6a" },
  { sky: ["#bcdbe0", "#f2ecdb"], sun: "#fff3d1", sea: ["#62adab", "#2f7a7d"], land: "#3d6b3a", sand: "#efe5cf", far: "#8fb08a" },
  { sky: ["#2e3d5c", "#e08f68"], sun: "#f7c67c", sea: ["#2f5568", "#1a3140"], land: "#15281a", sand: "#b99c7a", far: "#3d4c4a" },
  { sky: ["#acc29b", "#f2ecdb"], sun: "#f2ecdb", sea: ["#78aaa5", "#3b6e6a"], land: "#2b512b", sand: "#e6dcc4", far: "#7f9c74" }
];
const CR_HL = {
  en: {
    fashion: ["Fashion Week, by the sea", "Labdanation Fashion Week recap", "Style meets the coast", "Front row on Serangan"],
    outlet: ["Sira Village Grand Outlet", "Shop the coast", "Your weekend at Sira Village", "Retail, island style"],
    turtle: ["Home of the turtles", "Protecting Serangan's coast", "Every hatchling counts", "Kura Kura means turtle"],
    campus: ["Learn and grow on Serangan", "Bali's new economic zone", "Built for what's next", "Where business meets the coast"],
    coast: ["Where the coast comes alive", "Slow mornings on Serangan", "See you at Kura Kura Bali", "A new coastal destination"]
  },
  id: {
    fashion: ["Fashion week di tepi laut", "Rangkuman Labdanation Fashion Week", "Gaya bertemu pesisir", "Barisan depan di Serangan"],
    outlet: ["Sira Village Grand Outlet", "Belanja di tepi pantai", "Akhir pekan di Sira Village", "Belanja ala pulau"],
    turtle: ["Rumah para penyu", "Menjaga pesisir Serangan", "Setiap tukik berarti", "Kura Kura artinya penyu"],
    campus: ["Belajar dan tumbuh di Serangan", "Kawasan ekonomi baru Bali", "Dibangun untuk masa depan", "Bisnis bertemu pesisir"],
    coast: ["Pesisir yang hidup", "Pagi santai di Serangan", "Sampai jumpa di Kura Kura Bali", "Destinasi pesisir baru"]
  }
};
const crLang = () => S.cr.lang || S.lang;
const crSubject = b => { b = (b || "").toLowerCase();
  if (/fashion|fesyen|runway|labdanation|model/.test(b)) return "fashion";
  if (/outlet|shop|belanja|retail|award|penghargaan|store|toko/.test(b)) return "outlet";
  if (/turtle|penyu|tukik|conserv|konservasi|mangrove|clean|pantai bersih/.test(b)) return "turtle";
  if (/school|sekolah|invest|kek|sez|business|bisnis|campus|kampus/.test(b)) return "campus";
  return "coast"; };
const crRatio = f => { const [w, h] = f.split(":").map(Number); return h / w; };
function crRand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

/* One SVG scene. Coordinates are in a 1000-wide box; height follows the format. */
function crArt(r, subjectOverride, uid) {
  const W = 1000, H = Math.round(W * crRatio(r.fmt)), R = crRand(r.seed), id = "cr" + (uid || r.id);
  const subject = subjectOverride || r.subject, st = r.style;
  let p = CR_PAL[r.variant % 4];
  if (st === "editorial") p = { sky: ["#2b512b", "#3f6b3c"], sun: "#f2ecdb", sea: ["#acc29b", "#7f9c74"], land: "#16301a", sand: "#cfcabe", far: "#5b7d55" };
  const flat = st === "illustration" || st === "editorial";
  const g2 = (k, a) => flat ? a[0] : `url(#${id}-${k})`;
  const hz = H * (0.5 + R() * 0.08);
  const defs = `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>
    <linearGradient id="${id}-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sea[0]}"/><stop offset="1" stop-color="${p.sea[1]}"/></linearGradient>
    <radialGradient id="${id}-glow"><stop offset="0" stop-color="${p.sun}" stop-opacity=".55"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>
    <filter id="${id}-grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0"/></filter></defs>`;
  if (st === "graphic") {
    const bg = ["#2b512b", "#f2ecdb", "#acc29b", "#cfcabe"][r.variant % 4], fg = r.variant % 4 === 0 ? "#3d6b3a" : "#2b512b";
    let cells = "";
    for (let i = 0; i < 7; i++) { const cx = 120 + R() * 760, cy = H * (0.1 + R() * 0.55), s = 60 + R() * 160; cells += `<path d="M${cx} ${cy - s}l${s * .8} ${s * .45}v${s * .9}l-${s * .8} ${s * .45}l-${s * .8}-${s * .45}v-${s * .9}z" fill="${fg}" opacity="${0.08 + R() * 0.14}"/>`; }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}<rect width="${W}" height="${H}" fill="${bg}"/>${cells}
      <circle cx="${W * (0.62 + R() * 0.2)}" cy="${H * 0.3}" r="${W * 0.26}" fill="${fg}" opacity=".18"/></svg>`;
  }
  const sunX = W * (0.2 + R() * 0.6), sunY = hz - H * (0.08 + R() * 0.14);
  let s = `<rect width="${W}" height="${H}" fill="${g2("sky", p.sky)}"/>`;
  if (!flat) s += `<circle cx="${sunX}" cy="${sunY}" r="${W * 0.32}" fill="url(#${id}-glow)"/>`;
  s += `<circle cx="${sunX}" cy="${sunY}" r="${W * 0.07}" fill="${p.sun}"/>`;
  for (let i = 0; i < 3; i++) { const y = H * (0.12 + R() * 0.2), x = R() * W; s += `<ellipse cx="${x}" cy="${y}" rx="${80 + R() * 90}" ry="${14 + R() * 10}" fill="#fff" opacity="${flat ? 0.5 : 0.35}"/>`; }
  s += `<path d="M0 ${hz} Q ${W * 0.2} ${hz - 40 - R() * 30} ${W * 0.38} ${hz - 6} T ${W * 0.7} ${hz - 4} T ${W} ${hz - 22} V ${hz} Z" fill="${p.far}"/>`;
  s += `<rect y="${hz}" width="${W}" height="${H - hz}" fill="${g2("sea", p.sea)}"/>`;
  for (let i = 0; i < 6; i++) { const y = hz + (H - hz) * (0.08 + i * 0.1), x = R() * W * 0.7; s += `<path d="M${x} ${y} q 30 -8 60 0 t 60 0" stroke="#fff" stroke-width="3" fill="none" opacity="${0.25 - i * 0.02}"/>`; }
  const ground = H * (0.78 + R() * 0.06);
  const palm = (x, y, k) => { let leaves = ""; for (let i = 0; i < 6; i++) { const a = -150 + i * 40 + R() * 10, rad = a * Math.PI / 180, lx = x + Math.cos(rad) * 130 * k, ly = y - 260 * k + Math.sin(rad) * 70 * k; leaves += `<path d="M${x} ${y - 260 * k} Q ${(x + lx) / 2} ${ly - 50 * k} ${lx} ${ly + 30 * k}" stroke="${p.land}" stroke-width="${16 * k}" fill="none" stroke-linecap="round"/>`; }
    return `<path d="M${x} ${y} Q ${x + 30 * k} ${y - 140 * k} ${x} ${y - 260 * k}" stroke="${p.land}" stroke-width="${14 * k}" fill="none" stroke-linecap="round"/>${leaves}`; };
  s += `<path d="M0 ${ground} Q ${W * 0.5} ${ground - 40} ${W} ${ground + 10} V ${H} H 0 Z" fill="${p.sand}"/>`;
  if (subject === "turtle") {
    const cx = W * (0.35 + R() * 0.3), cy = ground + (H - ground) * 0.45, k = 1.1;
    s += `<ellipse cx="${cx}" cy="${cy + 26}" rx="${150 * k}" ry="${30 * k}" fill="#000" opacity=".12"/>
      <ellipse cx="${cx - 150 * k}" cy="${cy}" rx="${42 * k}" ry="${30 * k}" fill="${p.land}"/>
      <ellipse cx="${cx - 70 * k}" cy="${cy + 30 * k}" rx="${46 * k}" ry="${16 * k}" fill="${p.land}" transform="rotate(-20 ${cx - 70 * k} ${cy + 30 * k})"/>
      <ellipse cx="${cx + 80 * k}" cy="${cy + 30 * k}" rx="${46 * k}" ry="${16 * k}" fill="${p.land}" transform="rotate(20 ${cx + 80 * k} ${cy + 30 * k})"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${120 * k}" ry="${70 * k}" fill="${p.land}"/>
      <path d="M${cx - 60 * k} ${cy - 40 * k} l40 30 l40 -30 M${cx - 20 * k} ${cy - 10 * k} v50 M${cx + 20 * k} ${cy - 10 * k} v50 M${cx - 90 * k} ${cy + 10 * k} h70 M${cx + 20 * k} ${cy + 10 * k} h70" stroke="${p.sand}" stroke-width="9" fill="none" opacity=".9"/>`;
    s += palm(W * 0.9, ground + 10, 0.9);
  } else if (subject === "outlet") {
    const bx = W * 0.12, bw = W * 0.76, bh = H * 0.2, by = ground - bh + 20;
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="8" fill="#f6f1e4"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh * 0.16}" fill="${p.land}"/>`;
    for (let i = 0; i < 6; i++) { const ax = bx + 20 + i * (bw - 40) / 6, aw = (bw - 40) / 6 - 16; s += `<path d="M${ax} ${by + bh} V ${by + bh * 0.45} a ${aw / 2} ${aw / 2} 0 0 1 ${aw} 0 V ${by + bh} Z" fill="${p.sea[1]}" opacity=".75"/>`; }
    s += palm(W * 0.08, ground + 30, 1) + palm(W * 0.94, ground + 24, 0.9);
    for (let i = 0; i < 5; i++) { const x = W * (0.2 + R() * 0.6), y = ground + 40 + R() * 60; s += `<circle cx="${x}" cy="${y - 52}" r="12" fill="${p.land}"/><path d="M${x - 16} ${y} q 16 -60 32 0 z" fill="${p.land}"/>`; }
  } else if (subject === "fashion") {
    s += `<path d="M${W * 0.42} ${ground - 10} L ${W * 0.58} ${ground - 10} L ${W * 0.82} ${H} L ${W * 0.18} ${H} Z" fill="#f6f1e4"/>`;
    for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2); s += `<circle cx="${x}" cy="${H * 0.16}" r="10" fill="${p.sun}"/><path d="M${x} ${H * 0.16} L ${x - 60} ${ground} L ${x + 60} ${ground} Z" fill="${p.sun}" opacity=".12"/>`; }
    const fx = W * 0.5, fy = ground + 40;
    s += `<g transform="translate(${fx} ${fy}) scale(1.7) translate(${-fx} ${-fy})"><circle cx="${fx}" cy="${fy - 210}" r="24" fill="${p.land}"/><path d="M${fx - 18} ${fy - 182} h36 l46 170 h-128 z" fill="${p.land}"/><path d="M${fx - 14} ${fy - 12} l-6 40 M${fx + 14} ${fy - 12} l6 40" stroke="${p.land}" stroke-width="10"/></g>`;
    for (let i = 0; i < 9; i++) { const x = W * (0.04 + R() * 0.92), side = x < W / 2; if (Math.abs(x - W / 2) < W * 0.2) continue; s += `<circle cx="${x}" cy="${H - 70 - R() * 40}" r="16" fill="#000" opacity=".35"/>`; }
  } else if (subject === "campus") {
    const bx = W * 0.2, bw = W * 0.6, bh = H * 0.3, by = ground - bh + 16;
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#e9eef0"/>`;
    for (let r2 = 0; r2 < 4; r2++) for (let c = 0; c < 8; c++) s += `<rect x="${bx + 14 + c * (bw - 28) / 8}" y="${by + 14 + r2 * (bh - 28) / 4}" width="${(bw - 28) / 8 - 8}" height="${(bh - 28) / 4 - 8}" fill="${p.sea[0]}" opacity="${0.45 + R() * 0.4}"/>`;
    s += `<rect x="${bx - 20}" y="${by - 18}" width="${bw + 40}" height="18" fill="${p.land}"/>` + palm(W * 0.1, ground + 30, 0.9) + palm(W * 0.9, ground + 30, 1);
  } else {
    s += palm(W * (0.12 + R() * 0.1), ground + 20, 1.1) + palm(W * (0.78 + R() * 0.1), ground + 30, 0.9);
    s += `<path d="M${W * 0.45} ${ground + 60} l 90 -6 l -10 16 l -70 4 z" fill="${p.land}" opacity=".8"/>`;
  }
  if (!flat) s += `<rect width="${W}" height="${H}" filter="url(#${id}-grain)" opacity=".18"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${s}</svg>`;
}
/* Frame = scene + brand overlay (headline + logo) as HTML, so text uses the brand font. */
function crFrame(r, { big = false, uid = "" } = {}) {
  const light = r.style !== "graphic" || r.variant % 4 === 0;
  return `<div class="cr-frame ${big ? "big" : ""}" style="aspect-ratio:${r.fmt.replace(":", "/")}" role="img" aria-label="${esc(r.headline || t("cr.visual"))}">
    ${crArt(r, null, r.id + uid)}${r.text && r.headline ? `<div class="cr-ov ${light ? "light" : "dark"}">${light ? '<i class="cr-scrim"></i>' : ""}<b class="cr-hl">${esc(r.headline)}</b></div>` : ""}${r.logo ? `<img class="cr-logo ${light ? "white" : ""}" src="assets/kkb-logo.png" alt="">` : ""}</div>`;
}
function crGenerate(fromSel) {
  const c = S.cr, L = crLang(), brief = c.brief.trim() || t("cr.defBrief"), subject = crSubject(brief), hs = CR_HL[L][subject];
  const base = fromSel ? c.results[c.sel] : null, n = 4;
  c.seed += 13;
  c.results = Array.from({ length: n }, (_, i) => ({
    id: "c" + c.seed + "_" + i, fmt: c.fmt, style: c.style, subject, logo: c.logo, text: c.text, library: c.library,
    variant: base ? base.variant : (i + (c.seed % 4)) % 4, seed: c.seed * 31 + i * 7,
    headline: c.headline.trim() || (base ? base.headline : hs[i % 4]), brief, lang: L
  }));
  c.sel = 0;
}
function crChecks(r) {
  const out = [], low = r.headline.toLowerCase(), ban = D.settings.banned.filter(b => low.includes(b.toLowerCase()));
  out.push(r.logo ? { lv: "ok", t: t("cr.chk.logo"), d: t("cr.chk.logo.ok") } : { lv: "warn", t: t("cr.chk.logo"), d: t("cr.chk.logo.off") });
  out.push({ lv: ban.length ? "bad" : "ok", t: t("chk.claims"), d: ban.length ? t("chk.claims.bad", { w: ban.map(b => `“${b}”`).join(", ") }) : t("chk.claims.ok") });
  out.push(r.text && r.headline.length > 34 ? { lv: "warn", t: t("cr.chk.text"), d: t("cr.chk.text.long", { n: r.headline.length }) } : { lv: "ok", t: t("cr.chk.text"), d: t("cr.chk.text.ok") });
  out.push(r.style !== "graphic" && r.variant % 4 === 2 ? { lv: "warn", t: t("cr.chk.colour"), d: t("cr.chk.colour.dusk") } : { lv: "ok", t: t("cr.chk.colour"), d: t("cr.chk.colour.ok") });
  out.push({ lv: "ok", t: t("cr.chk.fit"), d: t("cr.fit." + r.fmt.replace(":", "x")) });
  out.push(r.library ? { lv: "ok", t: t("cr.chk.source"), d: t("cr.chk.source.lib") } : { lv: "warn", t: t("cr.chk.source"), d: t("cr.chk.source.gen") });
  if (r.style === "photo") out.push({ lv: "ok", t: t("cr.chk.ai"), d: t("cr.chk.ai.d") });
  const score = Math.max(0, 100 - out.filter(c => c.lv === "bad").length * 25 - out.filter(c => c.lv === "warn").length * 10);
  return { out, score };
}
function crChecksHTML() {
  const r = S.cr.results[S.cr.sel];
  if (!r) return `<p class="small muted">${t("cr.chk.empty")}</p>`;
  const { out, score } = crChecks(r), col = score >= 85 ? "--good" : score >= 60 ? "--serious" : "--critical", circ = 2 * Math.PI * 22;
  return `<div class="score" style="margin-bottom:6px"><svg class="ring" viewBox="0 0 56 56" role="img" aria-label="${t("chk.score")}: ${score}/100"><circle cx="28" cy="28" r="22" fill="none" stroke="var(--surface-3)" stroke-width="6"/>
    <circle cx="28" cy="28" r="22" fill="none" stroke="var(${col})" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(circ * score) / 100} ${circ}" transform="rotate(-90 28 28)"/>
    <text x="28" y="33" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)">${score}</text></svg>
    <div><b>${score >= 85 ? t("chk.ready") : score >= 60 ? t("chk.almost") : t("chk.needsWork")}</b><p class="small muted">${t("cr.chk.scoreH")}</p></div></div>` +
    out.map(c => `<div class="check ${c.lv}"><span class="ic">${ic(c.lv === "ok" ? "check" : c.lv === "warn" ? "alertc" : "alert")}</span><div><b>${c.t}</b><p>${esc(c.d)}</p></div></div>`).join("");
}
const crToggle = (k, l) => `<label class="cr-tg"><input type="checkbox" data-crt="${k}" ${S.cr[k] ? "checked" : ""}> ${l}</label>`;
V.create = {
  html() {
    const c = S.cr, L = crLang(), r = c.results[c.sel], busy = c.busy, n = 4;
    const grid = busy ? `<div class="cr-grid" aria-busy="true">${Array.from({ length: n }, () => `<div class="cr-frame skel" style="aspect-ratio:${c.fmt.replace(":", "/")}"></div>`).join("")}</div><p class="small muted" style="margin-top:10px">${ic("sparkles")} ${t("cr.generating")}</p>`
      : c.results.length ? `<div class="cr-grid">${c.results.map((x, i) => `<button class="cr-item" data-cr="sel:${i}" aria-pressed="${i === c.sel}" aria-label="${t("cr.option", { n: i + 1 })}">${crFrame(x)}</button>`).join("")}</div>`
      : emptyState("image", t("cr.none"), t("cr.none.b"));
    const detail = !busy && r ? `<section class="card"><div class="card-head"><h2>${t("cr.selected", { n: c.sel + 1 })}</h2><span class="pill plain">${r.fmt} · ${t("cr.style." + r.style)}</span></div>
      <div class="card-body"><div class="cr-detail"><div class="cr-player">${crFrame(r, { big: true, uid: "p" })}</div><div class="stack" style="gap:12px">
        <div class="field"><label for="cr-hl">${t("cr.headline")}</label><input id="cr-hl" class="input" value="${esc(r.headline)}" maxlength="60"><span class="help">${t("cr.headline.h")}</span></div>
        <div class="row wrap" style="gap:6px">
          <button class="btn primary" data-cr="planner">${ic("calendar")}${t("cr.toPlanner")}</button>
          <a class="btn" href="#/studio?tpl=caption&brief=${encodeURIComponent(r.brief)}">${ic("pen")}${t("cr.writeCaption")}</a>
          <button class="btn" data-cr="more">${ic("refresh")}${t("cr.more")}</button>
          <button class="btn" data-cr="save">${ic("check")}${t("cr.save")}</button>
          <button class="btn ghost" data-cr="download">${ic("download")}PNG</button></div>
      </div></div></div></section>` : "";
    return head(t("nav.create"), t("create.desc")) + `<div class="studio"><div class="stack">
      ${c.ctx ? `<section class="card"><div class="card-body row" style="align-items:flex-start">${ic("link")}<div style="flex:1;min-width:0"><b class="small">${t("cr.context")}</b><p class="small ink2" style="margin-top:2px">${esc(c.ctx)}</p></div><button class="btn sm ghost" data-cr="clearctx">${t("act.remove")}</button></div></section>` : ""}
      <section class="card"><div class="card-body stack" style="gap:14px">
        <div class="row wrap" style="gap:14px;align-items:flex-end">
          <div class="field"><span class="label">${t("cr.format")}</span><div class="seg" role="group" aria-label="${t("cr.format")}">${CR_FMT.map(f => `<button data-cr="fmt:${f}" aria-pressed="${c.fmt === f}" title="${esc(t("cr.fit." + f.replace(":", "x")))}">${f}</button>`).join("")}</div></div>
          <div class="field"><span class="label">${t("st.outLang")}</span><div class="seg" role="group" aria-label="${t("st.outLang")}">${["en", "id"].map(k => `<button data-cr="lang:${k}" aria-pressed="${L === k}">${k === "en" ? "English" : "Indonesia"}</button>`).join("")}</div></div>
        </div>
        <div class="field"><span class="label">${t("cr.style")}</span><div class="row wrap" style="gap:6px">${CR_STYLES.map(k => `<button class="chip" data-cr="style:${k}" aria-pressed="${c.style === k}">${t("cr.style." + k)}</button>`).join("")}</div></div>
        <div class="row" style="align-items:flex-end;gap:8px"><div class="field" style="flex:1"><label for="cr-brief">${t("cr.brief")}</label>
          <input id="cr-brief" class="input" value="${esc(c.brief)}" placeholder="${esc(t("cr.defBrief"))}"></div>
          <button class="btn primary" data-cr="gen" ${busy ? "disabled" : ""}>${ic("sparkles")}${c.results.length ? t("cr.regen") : t("cr.gen")}</button></div>
        <div class="row wrap" style="gap:16px">${crToggle("logo", t("cr.opt.logo"))}${crToggle("text", t("cr.opt.text"))}${crToggle("library", t("cr.opt.library"))}</div>
      </div></section>
      <section class="card"><div class="card-head"><h2>${t("cr.results")}</h2>${c.results.length && !busy ? `<span class="pill plain">${c.results.length}</span>` : ""}<span class="spacer"></span><span class="small muted">${t("cr.demoNote")}</span></div><div class="card-body" style="margin-top:8px">${grid}</div></section>
      ${detail}
    </div>
    <aside class="stack" style="position:sticky;top:76px">
      <section class="card"><div class="card-head"><h2>${t("cr.checks")}</h2>${infoBtn(t("cr.checks.i"))}</div><div class="card-body" id="cr-checks">${busy ? "" : crChecksHTML()}</div></section>
      <section class="card"><div class="card-head"><h2>${t("cr.kit")}</h2></div><div class="card-body stack" style="gap:10px">
        <div class="row"><span class="cr-kitlogo"><img src="assets/kkb-logo.png" alt="Kura Kura Bali logo"></span><div class="small"><b>${t("cr.kit.logo")}</b><div class="muted">${t("cr.kit.logo.d")}</div></div></div>
        <div><div class="small" style="margin-bottom:6px"><b>${t("cr.kit.colours")}</b></div><div class="row" style="gap:6px">${["#2b512b", "#acc29b", "#cfcabe", "#f2ecdb", "#111111"].map(h => `<span class="cr-sw" style="background:${h}" title="${h}"></span>`).join("")}</div></div>
        <div class="small"><b>${t("cr.kit.font")}</b><div class="muted">Plus Jakarta Sans</div></div>
        <div class="small"><b>${t("cr.kit.photos")}</b><div class="muted">${t("cr.kit.photos.d")}</div></div></div></section>
      <section class="card"><div class="card-head"><h2>${t("cr.recent")}</h2>${c.lib.length ? `<span class="pill plain">${c.lib.length}</span>` : ""}</div><div class="card-body">
        ${c.lib.length ? `<div class="cr-lib">${c.lib.map((x, i) => `<button class="cr-item" data-cr="lib:${i}" aria-label="${esc(x.headline)}">${crFrame(Object.assign({}, x, { fmt: "1:1" }), { uid: "l" })}</button>`).join("")}</div>` : `<p class="small muted">${t("cr.recent.none")}</p>`}</div></section>
    </aside></div>`;
  },
  mount() {
    const b = $("#cr-brief"); if (b) b.addEventListener("input", e => { S.cr.brief = e.target.value; });
    const h = $("#cr-hl"); if (h) h.addEventListener("input", e => {
      const r = S.cr.results[S.cr.sel]; r.headline = e.target.value;
      $$(".cr-item[aria-pressed=true] .cr-hl, .cr-player .cr-hl").forEach(x => (x.textContent = r.headline)); $("#cr-checks").innerHTML = crChecksHTML(); });
    $$("[data-crt]").forEach(x => x.onchange = () => { S.cr[x.dataset.crt] = x.checked; S.cr.results.forEach(r => { if (x.dataset.crt in r) r[x.dataset.crt] = x.checked; }); rerender(); });
  }
};
function crAction(a) {
  const c = S.cr, [k, v] = a.split(/:(.*)/s), r = c.results[c.sel];
  if (k === "fmt" || k === "style") { c[k] = v; return rerender(); }
  if (k === "lang") { c.lang = v; return rerender(); }
  if (k === "sel") { c.sel = +v; return rerender(); }
  if (k === "clearctx") { c.ctx = null; return rerender(); }
  if (k === "gen" || k === "more") {
    if (k === "gen") c.headline = "";
    c.busy = true; rerender();
    setTimeout(() => { crGenerate(k === "more"); c.busy = false; rerender(); toast(t("cr.toast.ready")); }, 1300);
    return;
  }
  if (!r) return;
  if (k === "save") { if (!c.lib.find(x => x.id === r.id)) c.lib.unshift(Object.assign({}, r)); c.lib = c.lib.slice(0, 9); rerender(); return toast(t("cr.toast.saved")); }
  if (k === "lib") { const x = c.lib[+v]; c.results = [Object.assign({}, x)]; c.sel = 0; c.fmt = x.fmt; return rerender(); }
  if (k === "download") return toast(t("toast.demoDownload"));
  if (k === "planner") { if (!c.lib.find(x => x.id === r.id)) c.lib.unshift(Object.assign({}, r)); S.pl.prefill = S.pl.prefill || ""; S.pl.prefillMedia = Object.assign({}, r); location.hash = "#/planner?compose=1"; }
}

/* ================================================================ SHELL */
const NAV = [
  [null, [["home", "home"]]],
  ["analytics", [["mentions", "inbox"], ["insights", "chart"], ["benchmark", "bars"], ["value", "coins"], ["reports", "file"]]],
  ["content", [["studio", "pen"], ["create", "image"], ["planner", "calendar"]]]
];
function navCounts() {
  return { mentions: [D.mentions.filter(m => !isVisited(m) && m.date > new Date(+D.TODAY - 7 * 864e5)).length], alerts: [D.alerts.filter(a => a.state === "open").length, true] };
}
function renderShell() {
  const c = navCounts(), link = ([k, i]) => `<a href="#/${k}" ${S.route === k ? 'aria-current="page"' : ""}>${ic(i)}<span>${t("nav." + k)}</span>${c[k] && c[k][0] ? `<span class="count ${c[k][1] ? "hot" : ""}" aria-label="${c[k][0]}">${c[k][0]}</span>` : ""}</a>`;
  const P0 = D.project;
  $("#side").innerHTML = `<div class="brand-wrap"><button class="brand" data-act="projmenu" aria-haspopup="menu" aria-expanded="false" aria-label="${t("proj.switch")}: ${esc(P0.name)}">${brandMark(P0)}<div><b>${esc(P0.name)}</b><span>${esc(P0.domain || t("proj.noDomain"))}</span></div>${ic("down")}</button>
    <div class="proj-menu" id="proj-menu" role="menu" hidden><div class="small muted" style="padding:6px 10px">${t("proj.switch")}</div>${PROJ.all().map(p => `<button role="menuitem" data-projopen="${p.id}">${brandMark(p, "sm")}<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</span>${p.id === P0.id ? ic("check") : ""}</button>`).join("")}
      <div class="divider" style="margin:6px 0"></div><a role="menuitem" href="#/project-settings">${ic("settings")}${t("nav.project-settings")}</a><a role="menuitem" href="#/projects">${ic("bars")}${t("nav.projects")}</a><a role="menuitem" href="#/new-project">${ic("plus")}${t("proj.new")}</a></div></div>
    <nav class="nav" aria-label="${t("nav.main")}">${NAV.map(([g, items]) => (g ? `<div class="nav-group">${t("navg." + g)}</div>` : "") + items.map(link).join("")).join("")}</nav>
    <div class="side-foot"><nav class="nav" style="padding:0" aria-label="${t("nav.settings")}">${isAdmin() ? link(["workspace", "settings"]) : ""}</nav><div class="me"><span class="avatar">HE</span><div class="small"><b>Hendra</b><div class="muted">${t("role.admin")}</div></div></div></div>`;
  const dark = isDark();
  $("#topbar").innerHTML = `<button class="btn ghost icon menu-btn" data-act="menu" aria-label="${t("nav.open")}">${ic("menu")}</button>
    <button class="btn search-btn" data-act="palette" aria-label="${t("pal.open")}">${ic("search")}<span class="lbl">${t("pal.open")}</span><kbd>⌘K</kbd></button>
    <span class="grow"></span><a class="btn ghost icon bell" href="#/alerts" ${S.route === "alerts" ? 'aria-current="page"' : ""} aria-label="${t("nav.alerts")}${c.alerts[0] ? ": " + c.alerts[0] : ""}" title="${t("nav.alerts")}">${ic("bell")}${c.alerts[0] ? `<span class="badge">${c.alerts[0]}</span>` : ""}</a><button class="btn ask-btn" data-aiask="1">${ic("sparkles")}<span class="hide-sm">${t("ai.ask")}</span></button><span class="demo-flag hide-sm" title="${D.simulated ? t("demo.sim.i") : t("demo.i")}">${D.simulated ? t("demo.sim") : t("demo")}</span>
    <div class="seg range-seg" role="group" aria-label="${t("range.label")}">${[7, 30, 90].map(r => `<button data-range="${r}" aria-pressed="${S.range === r}">${t("range.s" + r)}</button>`).join("")}</div>
    <div class="seg" role="group" aria-label="${t("lang.label")}"><button data-lang="en" aria-pressed="${S.lang === "en"}" lang="en">EN</button><button data-lang="id" aria-pressed="${S.lang === "id"}" lang="id">ID</button></div>
    <button class="btn ghost icon" data-act="theme" aria-label="${dark ? t("theme.light") : t("theme.dark")}" title="${dark ? t("theme.light") : t("theme.dark")}">${ic(dark ? "sun" : "moon")}</button>`;
}
function isDark() { return S.theme ? S.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
function applyTheme() { if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; }
function rerender() {
  document.documentElement.lang = S.lang; applyTheme(); renderShell();
  const v = V[S.route]; $("#content").innerHTML = v.html(); v.mount && v.mount();
  document.title = `${t("nav." + S.route)} · ${D.project.name} · Brand Intel`;
}
function applyQuery() {
  const q = S.q;
  if (S.route === "mentions" && Object.keys(q).length) {
    resetMFilters(); S.m.topic = q.topic || ""; S.m.sent = q.sentiment ? [q.sentiment] : []; S.m.search = q.search || ""; S.m.visit = q.visit || "all"; S.m.imp = q.imp || "all"; S.m.sel = null;
  }
  if (S.route === "studio") {
    if (q.tpl) { S.st.tpl = q.tpl; S.st.draftId = null; S.st.gen = null; }
    if (q.mention) { const m = D.mentions.find(x => x.id === q.mention); if (m) { S.st.ctx = { kind: "mention", text: m.text, author: m.author.name, topic: m.topic }; const tl = (I[m.lang]["topic." + m.topic] || m.topic).toLowerCase(); S.st.brief = m.lang === "id" ? `posting ${m.author.name} tentang ${tl}` : `${m.author.name}'s post about ${tl}`; S.st.text = ""; S.st.lang = m.lang; } }
    if (q.alert) { const a = D.alerts.find(x => x.id === q.alert); if (a) { S.st.ctx = { kind: "alert", text: alertTitle(a) + ". " + alertBody(a), topic: a.topic }; S.st.brief = t("st.briefFromAlert." + (a.topic && I.en["st.briefFromAlert." + a.topic] ? a.topic : "general")); S.st.text = ""; } }
  }
  if (S.route === "planner" && q.post) { const p = D.posts.find(x => x._id === q.post); if (p) { const d = new Date(p.scheduleDate); S.pl.month = new Date(d.getFullYear(), d.getMonth(), 1); setTimeout(() => composer({ id: p._id }), 50); } }
  if (S.route === "planner" && q.compose) setTimeout(() => composer({ text: S.pl.prefill || "", media: S.pl.prefillMedia || null }), 50);
  if (S.route === "studio" && q.brief) { S.st.brief = q.brief; S.st.text = ""; }
  if (S.route === "create") {
    const c = S.cr;
    if (q.brief) { c.brief = q.brief; c.ctx = null; c.results = []; c.headline = ""; }
    if (q.alert) { const a = D.alerts.find(x => x.id === q.alert); if (a) { c.ctx = alertTitle(a) + ". " + alertBody(a); c.brief = t("st.briefFromAlert." + (a.topic && I.en["st.briefFromAlert." + a.topic] ? a.topic : "general")); c.results = []; c.headline = ""; } }
    if (q.mention) { const m = D.mentions.find(x => x.id === q.mention); if (m) { c.ctx = `“${m.text}” · ${m.author.name}`; c.brief = (I[S.lang]["topic." + m.topic] || m.topic); c.results = []; c.headline = ""; } }
  }
  if (S.route === "new-project" && NP.mode === "edit") NP.reset();
  if (S.route === "project-settings") { const p = PROJ.get(q.id || D.project.id); if (p) NP.load(p); }
}
function route() {
  const h = location.hash.replace(/^#\/?/, "") || "home", [p, qs] = h.split("?");
  S.route = V[p] ? p : "home"; S.q = Object.fromEntries(new URLSearchParams(qs || ""));
  applyQuery(); rerender(); closeSide(); window.scrollTo(0, 0);
  const h1 = $("#content h1"); if (h1 && document.activeElement && document.activeElement.closest && document.activeElement.closest("#side")) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
}

/* ---------------- Drawer / confirm / toast / palette ---------------- */
let lastFocus = null;
function openDrawer({ title, body, foot, mount }) {
  lastFocus = document.activeElement;
  $("#drawer").innerHTML = `<div class="drawer-head"><h2 id="dr-t">${title}</h2><button class="btn ghost icon" data-close="1" aria-label="${t("act.close")}">${ic("x")}</button></div><div class="drawer-body">${body}</div>${foot ? `<div class="drawer-foot">${foot}</div>` : ""}`;
  $("#drawer").classList.add("on"); $("#scrim").classList.add("on"); $("#drawer").setAttribute("aria-hidden", "false");
  mount && mount();
  setTimeout(() => { const f = $("#drawer .drawer-body input:not([readonly]), #drawer .drawer-body textarea:not([readonly]), #drawer button"); f && f.focus(); }, 60);
}
function closeDrawer() {
  $("#drawer").classList.remove("on"); $("#scrim").classList.remove("on"); $("#drawer").setAttribute("aria-hidden", "true");
  if (S.route === "planner" && (S.q.post || S.q.compose)) history.replaceState(null, "", "#/planner");
  lastFocus && lastFocus.focus && document.contains(lastFocus) && lastFocus.focus();
}
function confirmBox(title, body, okLabel, onOk, danger) {
  const box = document.createElement("div");
  box.className = "palette on"; box.setAttribute("role", "alertdialog"); box.setAttribute("aria-modal", "true"); box.style.padding = "18px"; box.style.zIndex = 95;
  box.innerHTML = `<h2 style="font-size:16px">${title}</h2><p class="ink2" style="margin:8px 0 16px">${body}</p><div class="row"><span class="spacer"></span><button class="btn" data-no="1">${t("act.cancel")}</button><button class="btn ${danger ? "danger" : "primary"}" data-yes="1">${okLabel}</button></div>`;
  document.body.appendChild(box); $("#scrim").classList.add("on"); box.querySelector("[data-no]").focus();
  const done = ok => { box.remove(); if (!$("#drawer").classList.contains("on")) $("#scrim").classList.remove("on"); if (ok) onOk(); };
  box.querySelector("[data-no]").onclick = () => done(false); box.querySelector("[data-yes]").onclick = () => done(true);
  box.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); done(false); } });
}
function toast(msg, action) {
  const el = document.createElement("div"); el.className = "toast"; el.innerHTML = `<span>${msg}</span>`;
  if (action) { const b = document.createElement("button"); b.textContent = action.label; b.onclick = () => { action.fn(); el.remove(); }; el.appendChild(b); }
  $("#toasts").appendChild(el); setTimeout(() => el.remove(), action ? 6000 : 3500);
}
function closeSide() { $("#side").classList.remove("on"); if (!$("#drawer").classList.contains("on")) $("#scrim").classList.remove("on"); }

const pal = { items: [], i: 0 };
function palItems(q) {
  const nav = ["home", "mentions", "insights", "benchmark", "value", "alerts", "studio", "create", "planner", "reports", "projects", "project-settings", "new-project"].concat(isAdmin() ? ["workspace"] : []).map(k => ({ l: t("nav." + k), k: t("pal.goTo"), run: () => (location.hash = "#/" + k) }))
    .concat(PROJ.all().filter(p => p.id !== D.project.id).map(p => ({ l: t("proj.switchTo", { n: p.name }), k: t("pal.action"), run: () => openProject(p.id) })));
  const acts = [
    { l: t("ai.ask"), k: t("pal.action"), run: () => openAsk() },
    { l: t("pl.newPost"), k: t("pal.action"), run: () => { location.hash = "#/planner"; setTimeout(() => composer(), 80); } },
    { l: t("act.newDraft"), k: t("pal.action"), run: () => (location.hash = "#/studio?tpl=statement") },
    { l: t("act.createVisual"), k: t("pal.action"), run: () => (location.hash = "#/create") },
    { l: t("pal.negMentions"), k: t("pal.action"), run: () => (location.hash = "#/mentions?sentiment=neg&status=all") },
    { l: S.lang === "en" ? "Ganti ke Bahasa Indonesia" : "Switch to English", k: t("pal.action"), run: () => setLang(S.lang === "en" ? "id" : "en") },
    { l: isDark() ? t("theme.light") : t("theme.dark"), k: t("pal.action"), run: toggleTheme },
    ...[7, 30, 90].map(r => ({ l: t("range.label") + ": " + t("range." + r), k: t("pal.action"), run: () => { S.range = r; store.set("range", r); rerender(); } }))
  ];
  const ms = q ? D.mentions.filter(m => m.text.toLowerCase().includes(q)).slice(0, 4).map(m => ({ l: m.text.slice(0, 70) + (m.text.length > 70 ? "…" : ""), k: t("nav.mentions"), run: () => { location.hash = "#/mentions?status=all&search=" + encodeURIComponent(q); } })) : [];
  return [...nav, ...acts].filter(x => !q || x.l.toLowerCase().includes(q)).concat(ms);
}
function openPalette() {
  lastFocus = document.activeElement;
  $("#palette").innerHTML = `<label class="sr-only" for="pal-q">${t("pal.open")}</label><input id="pal-q" placeholder="${t("pal.ph")}" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-list"><ul id="pal-list" role="listbox"></ul>`;
  $("#palette").classList.add("on"); $("#scrim").classList.add("on");
  const q = $("#pal-q"), draw = () => { pal.items = palItems(q.value.trim().toLowerCase()); pal.i = Math.min(pal.i, Math.max(0, pal.items.length - 1));
    $("#pal-list").innerHTML = pal.items.length ? pal.items.map((x, i) => `<li role="option" aria-selected="${i === pal.i}" data-pi="${i}">${esc(x.l)}<span class="k">${esc(x.k)}</span></li>`).join("") : `<li class="muted">${t("pal.none")}</li>`; };
  q.addEventListener("input", () => { pal.i = 0; draw(); });
  q.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { pal.i = Math.min(pal.items.length - 1, pal.i + 1); draw(); e.preventDefault(); }
    if (e.key === "ArrowUp") { pal.i = Math.max(0, pal.i - 1); draw(); e.preventDefault(); }
    if (e.key === "Enter" && pal.items[pal.i]) { const r = pal.items[pal.i].run; closePalette(); r(); }
  });
  $("#pal-list").addEventListener("click", e => { const li = e.target.closest("[data-pi]"); if (li) { const r = pal.items[+li.dataset.pi].run; closePalette(); r(); } });
  pal.i = 0; draw(); q.focus();
}
function closePalette() { $("#palette").classList.remove("on"); if (!$("#drawer").classList.contains("on")) $("#scrim").classList.remove("on"); }
function setLang(l) { S.lang = l; store.set("lang", l); rerender(); toast(l === "id" ? "Bahasa: Indonesia" : "Language: English"); }
function toggleTheme() { S.theme = isDark() ? "light" : "dark"; store.set("theme", S.theme); rerender(); }

/* ---------------- Event delegation ---------------- */
document.addEventListener("click", e => {
  const el = e.target.closest("button, a, [data-mid], [data-post], tr[data-href], tr[data-draft], input[type=checkbox]");
  if (!el) { if (e.target.id === "scrim") { closeDrawer(); closePalette(); closeSide(); } return; }
  const d = el.dataset;
  if (d.close) return closeDrawer();
  if (!el.closest(".brand-wrap")) { const pm = $("#proj-menu"); if (pm && !pm.hidden) { pm.hidden = true; $(".brand").setAttribute("aria-expanded", "false"); } }
  if (d.projopen) { $("#proj-menu") && ($("#proj-menu").hidden = true); openProject(d.projopen); return; }
  if (d.projdel) { deleteProject(d.projdel); return; }
  if (d.chiprm) { const [k, i] = d.chiprm.split(":"); NP[k].splice(+i, 1); npRefocus(k); return; }
  if (d.npsug) { addChips("keywords", d.npsug); npRefocus("keywords"); return; }
  if (d.npcreate) { npCreate(); return; }
  if (d.npsave) { npSave(); return; }
  if (d.aiask) { openAsk(); return; }
  if (d.aisum) { const L = mFiltered(); openDrawer({ title: t("ai.summarize"), body: `<div class="ai-body">${aiMentionsSummary(L)}</div><p class="ai-note">${t("ai.note", { n: fI(L.length) })}</p>`,
      foot: `<button class="btn" data-aicopy="drawer">${ic("copy")}${t("act.copy")}</button><span class="spacer"></span><button class="btn" data-close="1">${t("act.close")}</button>` }); return; }
  if (d.aiideas) { openIdeas(); return; }
  if (d.aicopy) { const box = d.aicopy === "drawer" ? $("#drawer .ai-body") : $("#" + d.aicopy + " .ai-body"); const txt = box ? box.innerText : "";
    try { navigator.clipboard.writeText(txt).then(() => toast(t("toast.copied")), () => toast(t("toast.copyFail"))); } catch { toast(t("toast.copyFail")); } return; }
  if (d.airegen) { const card = $("#" + d.airegen + " .ai-body"); if (card) { const html = card.innerHTML; card.innerHTML = `<div aria-busy="true">${[90, 75, 85].map(w => `<div class="skeleton" style="width:${w}%"></div>`).join("")}</div>`;
      setTimeout(() => { card.innerHTML = html; toast(t("ai.regenDone")); }, 700); } return; }
  if (d.act) {
    const a = d.act;
    if (a === "projmenu") { const pm = $("#proj-menu"); pm.hidden = !pm.hidden; el.setAttribute("aria-expanded", String(!pm.hidden)); if (!pm.hidden) pm.querySelector("button, a").focus(); }
    if (a === "menu") { $("#side").classList.add("on"); $("#scrim").classList.add("on"); $("#side a").focus(); }
    if (a === "palette") openPalette();
    if (a === "theme") toggleTheme();
    if (a === "export") toast(t("toast.exported", { n: mFiltered().length }));
    if (a === "markAllVisited") { const L = mFiltered(); markVisited(L.map(x => x.id)); renderMList(); renderShell(); toast(t("toast.markedVisited", { n: L.length })); }
    if (a === "newRule") ruleDrawer();
    if (a.startsWith("dismiss:")) { const al = D.alerts.find(x => x.id === a.split(":")[1]); al.state = "resolved"; rerender(); toast(t("toast.resolved"), { label: t("act.undo"), fn: () => { al.state = "open"; rerender(); } }); }
    return;
  }
  if (d.range) { S.range = +d.range; store.set("range", S.range); rerender(); return; }
  if (d.lang) { if (d.lang !== S.lang) setLang(d.lang); return; }
  if (d.tbl) { const on = d.tbl && el.getAttribute("aria-pressed") !== "true"; el.setAttribute("aria-pressed", on); el.textContent = on ? t("common.chart") : t("common.table"); $("#" + d.tbl).hidden = on; $("#" + d.tbl + "-table").hidden = !on; return; }
  /* mentions */
  if (d.mreset) { resetMFilters(); history.replaceState(null, "", "#/mentions"); refreshFilters(); renderMList(); $("#m-q").value = ""; return; }
  if (d.mclear === "topic") { S.m.topic = ""; history.replaceState(null, "", "#/mentions"); refreshFilters(); renderMList(); return; }
  if (d.mimp) { S.m.imp = d.mimp; refreshFilters(); renderMList(); return; }
  if (d.mvisit) { S.m.visit = d.mvisit; refreshFilters(); renderMList(); return; }
  if (d.msmart) { S.m.smart = $("#mf-smart").value; refreshFilters(); renderMList(); return; }
  if (d.msmartclear) { S.m.smart = ""; refreshFilters(); renderMList(); return; }
  if (d.mfopen) { const f = $("#m-filters"); f.classList.toggle("open"); el.setAttribute("aria-expanded", f.classList.contains("open")); return; }
  if (d.more) { S.m.limit += 40; renderMList(); return; }
  if (d.mid) { openMention(d.mid); return; }
  if (d.closeNav) { closeDrawer(); return; }
  /* insights / alerts / settings tabs */
  if (d.instab) { S.ins.tab = d.instab; rerender(); return; }
  if (d.altab) { S.alerts.tab = d.altab; rerender(); return; }
  if (d.bv) { openBrandVoice(); return; }
  if (d.rateedit) { S.val.editing = +d.rateedit; rerender(); setTimeout(() => { const i = $("#rate-in"); i && (i.focus(), i.select()); }, 0); return; }
  if (d.ratecancel) { S.val.editing = null; rerender(); return; }
  if (d.ratesave) { const o = D.outlets[+d.ratesave], v = +$("#rate-in").value; if (!(v > 0)) { toast(t("value.rateInvalid")); return; } Object.assign(o, { rate: v, verified: true }); S.val.editing = null; rerender(); toast(t("toast.rateSaved")); return; }
  if (d.rateauto) { D.outlets[+d.rateauto].verified = false; S.val.editing = null; rerender(); toast(t("toast.rateAuto")); return; }
  if (el.matches("tr[data-href]")) { location.hash = d.href; return; }
  if (d.rule) { const r = D.alertRules.find(x => x.id === d.rule); r.on = el.checked; toast(r.on ? t("toast.ruleOn") : t("toast.ruleOff")); return; }
  if (d.repsw) { toast(el.checked ? t("toast.scheduleOn") : t("toast.scheduleOff")); return; }
  /* media value */
  if (d.vm) { S.val.method = d.vm; rerender(); return; }
  if (d.vsort) { S.val.sort = d.vsort; rerender(); return; }
  /* studio */
  if (d.tone) { S.st.tone = d.tone; $$("[data-tone]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tone === d.tone)); return; }
  if (d.olang) { S.st.lang = d.olang; rerender(); return; }
  if (d.st) { studioAction(d.st); return; }
  if (d.cr) { crAction(d.cr); return; }
  if (d.deldraft) { const i = D.drafts.findIndex(x => x.id === d.deldraft), dr = D.drafts.splice(i, 1)[0]; if (S.st.draftId === dr.id) S.st.draftId = null; rerender();
    toast(t("toast.draftDeleted"), { label: t("act.undo"), fn: () => { D.drafts.splice(i, 0, dr); rerender(); } }); return; }
  if (el.closest("tr[data-draft]")) { const dr = D.drafts.find(x => x.id === el.closest("tr[data-draft]").dataset.draft);
    Object.assign(S.st, { draftId: dr.id, tpl: dr.tpl, lang: dr.lang, text: dr.text, brief: dr.title, gen: null, ctx: null }); rerender(); window.scrollTo(0, 0); return; }
  if (d.sgacc || d.sgrej) {
    const i = +(d.sgacc || d.sgrej), g = $("#st-side")._sug[i], card = el.closest(".sugg");
    if (d.sgacc) setEditor(txtFix($("#st-text").value.replace(g.a, g.b)));
    card.classList.add("done"); card.querySelectorAll("button").forEach(b => (b.disabled = true));
    return;
  }
  /* planner */
  if (d.pl) {
    const p = S.pl;
    if (d.pl === "prev") p.month = new Date(p.month.getFullYear(), p.month.getMonth() - 1, 1);
    if (d.pl === "next") p.month = new Date(p.month.getFullYear(), p.month.getMonth() + 1, 1);
    if (d.pl === "today") p.month = new Date(D.TODAY.getFullYear(), D.TODAY.getMonth(), 1);
    if (d.pl === "new") return composer();
    rerender(); return;
  }
  if (d.kind) { const a = S.pl.kinds, k = d.kind; a.includes(k) ? a.splice(a.indexOf(k), 1) : a.push(k); rerender(); return; }
  if (d.plv) { S.pl.view = d.plv; rerender(); return; }
  if (d.pladd) { composer({ date: d.pladd }); return; }
  if (d.post) { composer({ id: d.post }); return; }
  /* reports */
  if (d.rep) { const f = $(`[data-rf="${d.rep}"]`).value; el.disabled = true; el.textContent = t("rep.generating"); setTimeout(() => { el.disabled = false; el.textContent = t("rep.generate"); toast(t("toast.reportReady", { r: t("rep." + d.rep), f }), { label: t("act.download"), fn: () => toast(t("toast.demoDownload")) }); }, 1200); return; }
  /* settings lists */
  if (d.rm) { const [k, i] = d.rm.split(":"); const v = D.settings[k].splice(+i, 1)[0]; PROJ.save(); rerender(); toast(t("toast.removed", { v: esc(v) }), { label: t("act.undo"), fn: () => { D.settings[k].splice(+i, 0, v); rerender(); } }); return; }
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.id === "m-sort") { S.m.sort = el.value; renderMList(); }
  if (el.dataset.nplang) { NP.langs = el.checked ? [...NP.langs, el.dataset.nplang] : NP.langs.filter(x => x !== el.dataset.nplang); if (NP.err === "langs") { NP.err = ""; rerender(); } }
  if (el.dataset.npsrc) { NP.sources = el.checked ? [...NP.sources, el.dataset.npsrc] : NP.sources.filter(x => x !== el.dataset.npsrc); if (NP.err === "sources") { NP.err = ""; rerender(); } }
  if (el.dataset.fgroup) {
    const g = el.dataset.fgroup, v = el.value, m = S.m;
    if (g === "srcAll") m.sources = el.checked ? ALL_SRC() : [];
    if (g === "src") m.sources = el.checked ? [...new Set([...m.sources, v])] : m.sources.filter(x => x !== v);
    const key = { sent: "sent", emo: "emo", geo: "geo" }[g];
    if (key) m[key] = el.checked ? [...m[key], v] : m[key].filter(x => x !== v);
    refreshFilters(); renderMList();
  }
  if (el.dataset.plf) { S.pl[el.dataset.plf] = el.value; rerender(); }
  if (el.id === "st-tpl") { S.st.tpl = el.value; S.st.gen = null; rerender(); }
});
document.addEventListener("paste", e => {
  const k = e.target.dataset && e.target.dataset.chipin; if (!k) return;
  const txt = (e.clipboardData || window.clipboardData).getData("text"); if (!/[,\n]/.test(txt)) return;
  e.preventDefault(); addChips(k, e.target.value + "," + txt); npRefocus(k);
});
document.addEventListener("input", e => {
  if (e.target.id === "m-q") { S.m.search = e.target.value; clearTimeout(e.target._t); e.target._t = setTimeout(renderMList, 120); }
});
document.addEventListener("keydown", e => {
  const typing = e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#palette").classList.contains("on") ? closePalette() : openPalette(); return; }
  if (e.key === "Escape") { if ($("#palette").classList.contains("on")) closePalette(); else if ($("#drawer").classList.contains("on")) closeDrawer(); else closeSide(); return; }
  if (e.target.dataset && e.target.dataset.chipin) {
    const k = e.target.dataset.chipin;
    if ((e.key === "Enter" || e.key === ",") && e.target.value.trim()) { e.preventDefault(); addChips(k, e.target.value); npRefocus(k); return; }
    if (e.key === "Enter") { e.preventDefault(); return; }
    if (e.key === "Backspace" && !e.target.value && NP[k].length) { NP[k].pop(); npRefocus(k); return; }
  }
  if (e.target.id === "rate-in") { if (e.key === "Enter") { e.preventDefault(); const b = $("[data-ratesave]"); b && b.click(); return; } if (e.key === "Escape") { e.preventDefault(); S.val.editing = null; rerender(); return; } }
  if (e.key === "Escape" && $("#proj-menu") && !$("#proj-menu").hidden) { $("#proj-menu").hidden = true; $(".brand").focus(); return; }
  if (e.key === "Enter" && e.target.matches("tr[data-href], tr[data-draft], tr[data-post], .m-item")) { e.target.click(); return; }
  if (e.key === "Enter" && e.target.dataset.addto) {
    const v = e.target.value.trim(), k = e.target.dataset.addto; if (!v) return;
    if (D.settings[k].includes(v)) { toast(t("toast.exists")); return; }
    D.settings[k].push(v); PROJ.save(); rerender(); toast(t("toast.added", { v: esc(v) })); setTimeout(() => { const i = $(`[data-addto="${k}"]`); i && i.focus(); }, 0); return;
  }
  if (typing || S.route !== "mentions" || $("#drawer").classList.contains("on") || e.metaKey || e.ctrlKey || e.altKey) return;
  const items = $$(".m-item"), i = items.indexOf(document.activeElement), k = e.key.toLowerCase();
  if (k === "j" || e.key === "ArrowDown") { const n = items[Math.min(items.length - 1, i + 1)]; if (n) { n.focus(); n.scrollIntoView({ block: "nearest" }); e.preventDefault(); } }
  if (k === "k" || e.key === "ArrowUp") { const n = items[Math.max(0, i - 1)]; if (n) { n.focus(); n.scrollIntoView({ block: "nearest" }); e.preventDefault(); } }
  if (k === "r" && i >= 0) location.hash = "#/studio?tpl=reply&mention=" + items[i].dataset.mid;
});
/* tooltip for [data-tip] */
document.addEventListener("mouseover", e => { const el = e.target.closest("[data-tip]"); if (el) C.showTip(e, `<div>${el.dataset.tip}</div>`); });
document.addEventListener("mousemove", e => { const el = e.target.closest("[data-tip]"); if (el) C.showTip(e, `<div>${el.dataset.tip}</div>`); });
document.addEventListener("mouseout", e => { if (e.target.closest("[data-tip]")) C.hideTip(); });
document.addEventListener("focusin", e => { const el = e.target.closest("[data-tip]"); if (el) { const r = el.getBoundingClientRect(); C.showTip({ clientX: r.right, clientY: r.bottom }, `<div>${el.dataset.tip}</div>`); } });
document.addEventListener("focusout", e => { if (e.target.closest("[data-tip]")) C.hideTip(); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (!S.theme) rerender(); });
activateProject(store.get("activeProject", "kkb"));
addEventListener("hashchange", route);
route();
})();
