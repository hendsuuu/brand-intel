/* Demo data for the prototype. Shapes mirror what the real backend will return.
   Topics, outlets, creators and volumes are modelled on the Brand24 trial snapshot of
   Kura Kura Bali (19 Oct – 18 Nov 2026): ~164 mentions / 30 days, mostly news, ~0% negative.
   Individual numbers are approximations. Daily totals are summed from the mentions,
   so every chart and KPI is consistent. Social Planner objects follow the GHL API shape. */
function buildKKB(project) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];

  const TODAY = new Date(2026, 10, 18, 9, 0, 0);
  const dayMs = 864e5;
  const dateAt = back => new Date(TODAY.getTime() - back * dayMs);

  /* ---- Authors & outlets seen in the snapshot (audience = followers, or monthly visits for sites) ---- */
  const authors = [
    { key: "bloomberg", name: "Bloomberg Technoz", handle: "bloombergtechnoz.com", followers: 3700000, type: "media" },
    { key: "jakpost", name: "The Jakarta Post", handle: "thejakartapost.com", followers: 445000, type: "media" },
    { key: "voi", name: "VOI", handle: "voi.id", followers: 2300000, type: "media" },
    { key: "antara", name: "Antara Bali", handle: "bali.antaranews.com", followers: 125000, type: "media" },
    { key: "viva", name: "Viva Wisata", handle: "wisata.viva.co.id", followers: 206000, type: "media" },
    { key: "times", name: "Times Indonesia", handle: "times.co.id", followers: 159000, type: "media" },
    { key: "tribune", name: "Bali Tribune", handle: "balitribune.co.id", followers: 37000, type: "media" },
    { key: "atnews", name: "ATNews", handle: "atnews.id", followers: 75000, type: "media" },
    { key: "wahana", name: "Wahana News", handle: "wahananews.co", followers: 1800000, type: "media" },
    { key: "balipost", name: "Bali Post", handle: "balipost.com", followers: 150000, type: "media" },
    { key: "kuliner", name: "Kuliner 1 Menit Fanbase", handle: "youtube.com", followers: 19000, type: "creator" },
    { key: "falala", name: "Falala Chocolate fan", handle: "youtube.com", followers: 19600, type: "creator" },
    { key: "karen", name: "karenwu96", handle: "@karenwu96", followers: 1830, type: "creator" },
    { key: "jjima", name: "byjjima", handle: "@byjjima", followers: 60, type: "person" },
    { key: "pesona", name: "pesona.bali", handle: "@pesona.bali", followers: 55, type: "person" },
    { key: "chesora", name: "chesora", handle: "@chesora", followers: 54, type: "person" },
    { key: "wich", name: "wich.bali", handle: "@wich.bali", followers: 38, type: "person" },
    { key: "jegeg", name: "nak.jegeg893", handle: "@nak.jegeg893", followers: 14, type: "person" },
    { key: "siravillage", name: "siravillage", handle: "@siravillage", followers: 76, type: "person" },
    { key: "antaraposter", name: "antara-poster", handle: "bsky.app", followers: 205, type: "person" },
    { key: "xuser1", name: "Made Wirawan", handle: "@madewira", followers: 2200, type: "person" },
    { key: "xuser2", name: "Tom Hughes", handle: "@tomhughes", followers: 3100, type: "person" }
  ];
  const A = Object.fromEntries(authors.map(a => [a.key, a]));

  /* ---- Mention templates: [text, lang, sentiment, topic, emotion, source, author, translation into the other language (id↔en)] ---- */
  const T = [
    ["Sira Village Grand Outlet Bali raih Best Retail Development di PropertyGuru Indonesia Property Awards 2026, hasil kemitraan Mitsubishi Estate dan PT Bali Turtle Island Development (BTID).", "id", "pos", "siraVillage", "trust", "news", "bloomberg",
      "Sira Village Grand Outlet Bali wins Best Retail Development at the PropertyGuru Indonesia Property Awards 2026, a partnership between Mitsubishi Estate and PT Bali Turtle Island Development (BTID)."],
    ["Singapore investors eye the Kura Kura Bali Special Economic Zone as ACS Bali and a SingCham chapter set up in the area.", "en", "pos", "kek", "anticipation", "news", "jakpost",
      "Investor Singapura melirik KEK Kura Kura Bali seiring hadirnya ACS Bali dan cabang SingCham di kawasan tersebut."],
    ["KEK Kura Kura Bali kembangkan 83 spesies tanaman untuk mendukung pariwisata hijau di Serangan.", "id", "pos", "sustainability", "trust", "news", "wahana",
      "KEK Kura Kura Bali grows 83 plant species to support green tourism in Serangan."],
    ["Pangdam IX/Udayana kunjungi KEK Kura Kura Bali, bahas sinergi keamanan dan kenyamanan investasi di kawasan.", "id", "neu", "kek", "anticipation", "news", "balipost",
      "The Udayana military commander visits KEK Kura Kura Bali to discuss security and investment comfort in the zone."],
    ["Labdanation Fashion Week Season III digelar di Sira Village, Kura Kura Bali, didukung fasilitas pemerintah.", "id", "neu", "fashion", "anticipation", "news", "voi",
      "Labdanation Fashion Week Season III is held at Sira Village, Kura Kura Bali, with government support."],
    ["Sustainable fashion show at Sira Village puts eco-friendly textiles in the spotlight.", "en", "pos", "fashion", "joy", "news", "tribune",
      "Peragaan busana berkelanjutan di Sira Village menyorot tekstil ramah lingkungan."],
    ["KEK Kura Kura Bali fokus pada investasi, keamanan, dan pengembangan kawasan ekonomi khusus di Denpasar.", "id", "neu", "kek", "anticipation", "news", "antara",
      "KEK Kura Kura Bali focuses on investment, security and developing the special economic zone in Denpasar."],
    ["Wisata belanja baru di Bali: Sira Village hadirkan lebih dari 100 merek fesyen dan kuliner dengan pemandangan pantai.", "id", "pos", "siraVillage", "joy", "news", "viva",
      "A new shopping destination in Bali: Sira Village brings more than 100 fashion and food brands with a beach view."],
    ["What the Kura Kura Bali Special Economic Zone means for investors in 2026.", "en", "neu", "kek", "anticipation", "news", "times",
      "Arti KEK Kura Kura Bali bagi investor pada 2026."],
    ["Kura Kura Bali buka program literasi untuk siswa sekitar Serangan.", "id", "pos", "community", "trust", "news", "atnews",
      "Kura Kura Bali opens a literacy programme for students around Serangan."],
    ["Bukan sekadar tempat belanja, Sira Village di KEK Kura Kura Bali memadukan nuansa modern dan tradisi lokal. #SiraVillage #AksaraBali", "id", "pos", "siraVillage", "joy", "tiktok", "jjima",
      "Not just a place to shop: Sira Village in KEK Kura Kura Bali blends a modern feel with local tradition."],
    ["First time ke Sira Village Grand Outlet Bali, diskonnya sampai 80%! Wajib mampir.", "id", "pos", "siraVillage", "joy", "tiktok", "karen",
      "First time at Sira Village Grand Outlet Bali, discounts up to 80%! A must-visit."],
    ["Satu buku sederhana bisa jadi pintu awal anak-anak mengenal hal baru. Senang lihat keceriaan para siswa di Kura Kura Bali.", "id", "pos", "community", "joy", "tiktok", "chesora",
      "One simple book can open a door for children to learn something new. Lovely to see the students so happy at Kura Kura Bali."],
    ["Sunset di pinggir pantai Kura Kura Bali, cocok buat sore santai.", "id", "pos", "tourism", "joy", "tiktok", "pesona",
      "Sunset by the beach at Kura Kura Bali, perfect for a relaxed afternoon."],
    ["Ada yang tahu parkir di Sira Village bayar atau gratis?", "id", "neu", "siraVillage", "anticipation", "tiktok", "wich",
      "Does anyone know if parking at Sira Village is free or paid?"],
    ["Outfit check di Labdanation Fashion Week, Sira Village. Venue-nya keren!", "id", "pos", "fashion", "joy", "tiktok", "jegeg",
      "Outfit check at Labdanation Fashion Week, Sira Village. The venue is great!"],
    ["Opening week at Sira Village Grand Outlet. Come say hi!", "en", "pos", "siraVillage", "joy", "tiktok", "siravillage",
      "Minggu pembukaan Sira Village Grand Outlet. Yuk, mampir!"],
    ["5 tahun jadi pelanggan setia Falala Chocolate, sekarang ada gerainya di Sira Village.", "id", "pos", "siraVillage", "joy", "youtube", "falala",
      "Five years as a loyal Falala Chocolate customer, and now there's a store at Sira Village."],
    ["Akhirnya dapat sepatu Asics original di Sira Village, Serangan. Harganya miring!", "id", "pos", "siraVillage", "joy", "youtube", "kuliner",
      "Finally got original Asics shoes at Sira Village, Serangan. Great prices!"],
    ["Kura Kura Bali SEZ draws new education and retail tenants (Antara).", "en", "neu", "kek", "anticipation", "bluesky", "antaraposter",
      "KEK Kura Kura Bali menarik penyewa baru di bidang pendidikan dan ritel (Antara)."],
    ["Jalan ke Serangan padat waktu fashion week. Semoga ada shuttle untuk acara berikutnya.", "id", "neg", "access", "anger", "x", "xuser1",
      "The road to Serangan was congested during fashion week. Hope there's a shuttle for the next event."],
    ["Outlet prices at Sira Village still feel high for some brands, even with the discount.", "en", "neg", "siraVillage", "anger", "x", "xuser2",
      "Harga outlet di Sira Village masih terasa mahal untuk beberapa merek, meski sudah diskon."],
    ["Walked the coastal path at Kura Kura Bali this morning. Quiet and well kept.", "en", "pos", "tourism", "joy", "x", "xuser2",
      "Pagi ini jalan di jalur pesisir Kura Kura Bali. Tenang dan terawat."],
    ["Seputar KEK: kawasan Kura Kura Bali tambah fasilitas publik di Serangan.", "id", "neu", "kek", "anticipation", "blogs", "antara",
      "About the SEZ: Kura Kura Bali adds public facilities in Serangan."]
  ];

  /* ---- Daily volume with real-looking spikes ---- */
  const spikes = { 26: { add: 11, topic: "kek" }, 20: { add: 12, topic: "fashion" }, 19: { add: 5, topic: "fashion" }, 4: { add: 3, topic: "siraVillage" }, 2: { add: 6, topic: "siraVillage" } };
  const locs = ["Denpasar", "Denpasar", "Badung", "Jakarta", "Jakarta", "Singapore", "Tokyo"];
  const mentions = [];
  const days = [];
  for (let back = 179; back >= 0; back--) {
    const sp = spikes[back];
    const n = Math.max(0, Math.round(1.6 + ((179 - back) / 179) * 2.2 + rnd() * 2.2 + (sp ? sp.add : 0)));
    const d = { date: dateAt(back), pos: 0, neu: 0, neg: 0, reach: 0, reactions: 0, comments: 0, shares: 0, views: 0 };
    for (let k = 0; k < n; k++) {
      /* Pick the source by its real share first (news ~65%, TikTok ~17%…), then a matching template. */
      const sr = rnd(), src0 = sr < 0.66 ? "news" : sr < 0.83 ? "tiktok" : sr < 0.88 ? "x" : sr < 0.92 ? "youtube" : sr < 0.97 ? "blogs" : "bluesky";
      const r = rnd(), sent = r < 0.62 ? "pos" : r < 0.996 ? "neu" : "neg";
      const bySrc = T.filter(x => x[5] === src0);
      let pool = bySrc.filter(x => x[2] === sent);
      if (!pool.length) pool = bySrc;
      if (sp && rnd() < 0.65) { const tp = pool.filter(x => x[3] === sp.topic); if (tp.length) pool = tp; }
      const tpl = pick(pool), a = A[tpl[6]], src = tpl[5];
      let views = null, reach, reactions, comments, shares;
      if (src === "tiktok") { views = ri(300, 4200); reach = views; reactions = Math.round(views * (0.02 + rnd() * 0.06)); comments = Math.round(views * (0.001 + rnd() * 0.004)); shares = Math.round(views * (0.004 + rnd() * 0.02)); }
      else if (src === "youtube") { views = ri(800, 29000); reach = views; reactions = Math.round(views * (0.01 + rnd() * 0.02)); comments = Math.round(views * (0.001 + rnd() * 0.002)); shares = Math.round(views * (0.001 + rnd() * 0.003)); }
      else if (src === "news" || src === "blogs") { reach = Math.round(a.followers * (0.0006 + rnd() * 0.0025)) + ri(80, 400); reactions = ri(0, 4); comments = ri(0, 1); shares = ri(0, 9); }
      else { reach = Math.round(a.followers * (0.1 + rnd() * 0.4)) + ri(20, 200); reactions = ri(0, 18); comments = ri(0, 3); shares = ri(0, 4); }
      const at = new Date(d.date.getTime() - rnd() * (back === 0 ? 0.35 : 0.95) * dayMs);
      mentions.push({ text: tpl[0], lang: tpl[1], sentiment: sent === tpl[2] ? sent : tpl[2], topic: tpl[3], emotion: tpl[4], source: src, author: a,
        translation: tpl[7] || null, reach, reactions, comments, shares, views, sentConf: 0.8 + rnd() * 0.18, date: at,
        location: tpl[1] === "en" && rnd() < 0.5 ? pick(["Singapore", "Jakarta", "Sydney"]) : pick(locs) });
      const m = mentions[mentions.length - 1];
      d[m.sentiment]++; d.reach += reach; d.reactions += reactions; d.comments += comments; d.shares += shares; d.views += views || 0;
    }
    days.push(d);
  }
  mentions.sort((a, b) => b.date - a.date);
  mentions.forEach((m, i) => (m.id = "m" + (i + 1)));

  /* ---- Competitors (demo volumes, same scale as Kura Kura Bali) ---- */
  /* Competitor names come from the project settings (up to 3). */
  const brands = [{ key: "kkb", name: project.name, own: true },
    ...project.competitors.slice(0, 3).map((c, i) => ({ key: ["nusadua", "sanur", "nuanu"][i], name: c }))];
  const brandDaily = { kkb: days.map(d => d.pos + d.neu + d.neg) };
  const scale = { nusadua: 1.5, sanur: 0.9, nuanu: 0.7 };
  for (const b of brands.slice(1)) brandDaily[b.key] = days.map((d, i) => Math.max(0, Math.round((2 + rnd() * 4) * scale[b.key] * (1 + i / 400))));
  const brandStats = {
    kkb: { pos: 0.47, neg: 0.01, reach: 1.0 },
    nusadua: { pos: 0.52, neg: 0.05, reach: 1.3 },
    sanur: { pos: 0.44, neg: 0.03, reach: 0.8 },
    nuanu: { pos: 0.55, neg: 0.08, reach: 0.9 }
  };

  /* ---- Aggregates for analysis views (30-day snapshot) ---- */
  const last30 = mentions.filter(m => m.date > dateAt(30));
  const topicKeys = ["kek", "siraVillage", "fashion", "sustainability", "community", "tourism", "access"];
  const trend = { kek: 0.12, siraVillage: 0.64, fashion: 0.35, sustainability: 0.05, community: 0.1, tourism: -0.04, access: 0 };
  const topics = topicKeys.map(k => { const ms = last30.filter(m => m.topic === k), c = ms.length || 1;
    return { key: k, count: ms.length, pos: ms.filter(m => m.sentiment === "pos").length / c, neg: ms.filter(m => m.sentiment === "neg").length / c, reach: ms.reduce((s, m) => s + m.reach, 0), trend: trend[k] }; })
    .filter(x => x.count).sort((a, b) => b.count - a.count);
  const aspects = [
    { key: "shopping", pos: 0.72, neg: 0.04 },
    { key: "events", pos: 0.66, neg: 0.02 },
    { key: "environment", pos: 0.61, neg: 0.0 },
    { key: "investment", pos: 0.44, neg: 0.0 },
    { key: "localImpact", pos: 0.58, neg: 0.03 },
    { key: "price", pos: 0.38, neg: 0.12 },
    { key: "roadAccess", pos: 0.1, neg: 0.35 }
  ];
  const emoCount = k => last30.filter(m => m.emotion === k).length;
  const emotions = ["joy", "trust", "anticipation", "surprise", "anger", "fear", "sadness"].map(k => ({ key: k, v: emoCount(k) })).filter(e => e.v);
  const srcKeys = ["news", "tiktok", "x", "youtube", "blogs", "bluesky"];
  const sources = srcKeys.map(k => ({ key: k, v: last30.filter(m => m.source === k).length })).filter(s => s.v).sort((a, b) => b.v - a.v);
  const geo = ["Denpasar", "Badung", "Jakarta", "Singapore", "Tokyo", "Sydney"].map(k => ({ key: k, v: last30.filter(m => m.location === k).length }))
    .filter(g => g.v).sort((a, b) => b.v - a.v);
  const hashtags = [
    { tag: "#KuraKuraBali", v: 26, d: 0.18 }, { tag: "#SiraVillage", v: 14, d: 0.75 }, { tag: "#KEK", v: 9, d: 0.12 },
    { tag: "#AksaraBali", v: 5, d: 0.25 }, { tag: "#BudayaBali", v: 4, d: 0 }
  ];
  const keywords = [
    { w: "KEK / SEZ", v: 64, d: 0.14 }, { w: "Sira Village", v: 50, d: 0.71 }, { w: "investasi / investment", v: 31, d: 0.09 },
    { w: "fashion week", v: 22, d: 0.4 }, { w: "outlet / diskon", v: 18, d: 0.55 }, { w: "BTID", v: 12, d: 0.2 },
    { w: "Singapore / Singapura", v: 11, d: 0.3 }, { w: "Serangan", v: 9, d: -0.05 }
  ];

  /* ---- Media value (30-day articles; rates are demo values in IDR) ---- */
  const outlets = [
    { name: "Bloomberg Technoz", tier: 1, articles: 4, tone: "pos", prominence: "headline", reach: 3.7e6, rate: 25e6, verified: true },
    { name: "The Jakarta Post", tier: 1, articles: 2, tone: "pos", prominence: "body", reach: 4.45e5, rate: 35e6, verified: true },
    { name: "VOI", tier: 1, articles: 6, tone: "neu", prominence: "body", reach: 2.3e6, rate: 12e6 },
    { name: "Antara Bali", tier: 2, articles: 5, tone: "neu", prominence: "body", reach: 1.25e5, rate: 10e6, verified: true },
    { name: "Viva Wisata", tier: 2, articles: 3, tone: "pos", prominence: "headline", reach: 2.06e5, rate: 15e6 },
    { name: "Times Indonesia", tier: 2, articles: 4, tone: "neu", prominence: "body", reach: 1.59e5, rate: 8e6 },
    { name: "Bali Tribune", tier: 2, articles: 6, tone: "pos", prominence: "body", reach: 3.7e4, rate: 6e6 },
    { name: "ATNews", tier: 3, articles: 5, tone: "pos", prominence: "body", reach: 7.5e4, rate: 4e6 },
    { name: "Blogs & local sites", tier: 3, articles: 8, tone: "neu", prominence: "body", reach: 3e4, rate: 1.5e6 }
  ];

  /* ---- Alerts ---- */
  const alerts = [
    { id: "a1", sev: "warning", kind: "volumeUp", topic: "siraVillage", factor: 2.6, count: 9, reach: 38000, at: new Date(TODAY.getTime() - 1.8 * dayMs), state: "open" },
    { id: "a2", sev: "warning", kind: "influencer", author: "Kuliner 1 Menit Fanbase", reach: 29000, at: new Date(TODAY.getTime() - 3.2 * dayMs), state: "open" },
    { id: "a3", sev: "warning", kind: "volumeUp", topic: "fashion", factor: 3.4, count: 17, reach: 41000, at: new Date(TODAY.getTime() - 20 * dayMs), state: "resolved" },
    { id: "a4", sev: "warning", kind: "volumeUp", topic: "kek", factor: 3.1, count: 15, reach: 52000, at: new Date(TODAY.getTime() - 26 * dayMs), state: "resolved" }
  ];
  const alertRules = [
    { id: "r1", name: "negSpike", on: true, cond: "negSpike", channels: ["slack", "email"] },
    { id: "r2", name: "sensitive", on: true, cond: "sensitive", channels: ["slack", "whatsapp"] },
    { id: "r3", name: "influencer", on: true, cond: "influencer", channels: ["email"] },
    { id: "r4", name: "dailyDigest", on: false, cond: "digest", channels: ["email"] }
  ];

  /* ---- Team ---- */
  const team = [
    { id: "u1", name: "Ayu Lestari", initials: "AL", role: "admin" },
    { id: "u2", name: "Dimas Pratama", initials: "DP", role: "analyst" },
    { id: "u3", name: "Kadek Sari", initials: "KS", role: "writer" },
    { id: "u4", name: "Hendra", initials: "HE", role: "admin" }
  ];
  /* Saved Studio drafts (no approval step: drafts are saved, copied or sent to Planner). */
  const drafts = [
    { id: "d1", title: "Sira Village Grand Outlet wins Best Retail Development", tpl: "press", lang: "en", saved: new Date(TODAY.getTime() - 1.5 * 36e5),
      text: "FOR IMMEDIATE RELEASE\n\nSira Village Grand Outlet Bali named Best Retail Development at the PropertyGuru Indonesia Property Awards 2026\n\nDenpasar, 18 November 2026: Sira Village Grand Outlet Bali, located in the Kura Kura Bali Special Economic Zone, has been named Best Retail Development at the PropertyGuru Indonesia Property Awards 2026.\n\nDeveloped through a partnership between Mitsubishi Estate Group and PT Bali Turtle Island Development (BTID), Sira Village brings more than 100 fashion and food brands to Serangan, alongside programmes for the Serangan community.\n\n\"This recognition belongs to our tenants and to the Serangan community,\" said [Name, Title].\n\nMedia contact: press@kurakurabali.com" },
    { id: "d2", title: "Labdanation Fashion Week recap", tpl: "caption", lang: "en", saved: new Date(TODAY.getTime() - 20 * 36e5),
      text: "Three days, 40 designers, one runway by the sea. Thank you to everyone who joined Labdanation Fashion Week Season III at Sira Village. 🌊 #KuraKuraBali #SiraVillage" },
    { id: "d3", title: "Panduan pengunjung akhir pekan acara", tpl: "internal", lang: "id", saved: new Date(TODAY.getTime() - 3 * dayMs),
      text: "Halo tim,\n\nMohon baca panduan pengunjung dan parkir terbaru untuk akhir pekan acara di Sira Village.\n\nTerima kasih,\nTim Komunikasi" }
  ];

  /* ---- Social Planner (GHL shape) ---- */
  const accounts = [
    { _id: "acc_ig", platform: "instagram", name: "@kurakurabali", limit: 2200 },
    { _id: "acc_fb", platform: "facebook", name: "Kura Kura Bali", limit: 5000 },
    { _id: "acc_li", platform: "linkedin", name: "Kura Kura Bali", limit: 3000 },
    { _id: "acc_gbp", platform: "google", name: "Sira Village · Business Profile", limit: 1500 }
  ];
  const iso = (d, h, m = 0) => new Date(2026, 10, d, h, m).toISOString();
  const posts = [
    { _id: "p1", status: "published", accountIds: ["acc_ig"], summary: "Golden hour at Sira Village. 🌅 #KuraKuraBali #SiraVillage", scheduleDate: iso(3, 18), kind: "social" },
    { _id: "p2", status: "published", accountIds: ["acc_fb", "acc_li"], summary: "Labdanation Fashion Week Season III comes to Sira Village. Here's the schedule.", scheduleDate: iso(5, 10), kind: "social" },
    { _id: "p3", status: "published", accountIds: ["acc_li"], summary: "Why Singaporean schools and businesses are choosing the Kura Kura Bali SEZ.", scheduleDate: iso(10, 9), kind: "social" },
    { _id: "p4", status: "failed", accountIds: ["acc_gbp"], summary: "Sira Village weekend opening hours.", scheduleDate: iso(15, 8), kind: "social", error: "tokenExpired" },
    { _id: "p5", status: "scheduled", accountIds: ["acc_fb", "acc_ig"], summary: "Sira Village is Best Retail Development 2026! Thank you to our tenants and visitors.", scheduleDate: iso(19, 11), kind: "social" },
    { _id: "p6", status: "draft", accountIds: ["acc_ig"], summary: "Three days, 40 designers, one runway by the sea. 🌊", scheduleDate: iso(20, 17), kind: "social" },
    { _id: "p7", status: "scheduled", accountIds: ["acc_li"], summary: "A short explainer: what a Special Economic Zone means for Bali's next decade.", scheduleDate: iso(21, 9), kind: "social" },
    { _id: "p8", status: "draft", accountIds: ["acc_ig"], summary: "83 plant species and counting: a walk through our green corridors.", scheduleDate: iso(24, 17), kind: "social" },
    { _id: "p9", status: "scheduled", accountIds: ["acc_fb", "acc_ig", "acc_gbp"], summary: "Year-end sale at Sira Village Grand Outlet starts 1 December.", scheduleDate: iso(27, 10), kind: "social" },
    { _id: "e1", status: "scheduled", accountIds: [], summary: "Press release: Sira Village award", scheduleDate: iso(19, 9), kind: "press" },
    { _id: "e2", status: "scheduled", accountIds: [], summary: "Internal: Q4 town hall reminder", scheduleDate: iso(18, 8), kind: "internal" },
    { _id: "e3", status: "draft", accountIds: [], summary: "Press release: KEK investor update Q4", scheduleDate: iso(30, 9), kind: "press" }
  ];

  /* ---- Brand settings ---- */
  const settings = {
    keywords: project.keywords,
    excluded: project.excluded,
    keyMessages: [
      { en: "the Kura Kura Bali Special Economic Zone", id: "Kawasan Ekonomi Khusus Kura Kura Bali" },
      { en: "sustainable development", id: "pembangunan berkelanjutan" },
      { en: "the Serangan community", id: "masyarakat Serangan" }
    ],
    banned: ["best in the world", "guaranteed", "100% eco", "terbaik di dunia", "dijamin", "pasti untung"],
    voice: ["warm", "confident", "factual", "respectful of local culture"],
    glossary: [
      { en: "Special Economic Zone", id: "Kawasan Ekonomi Khusus (KEK)" },
      { en: "coastal walk", id: "jalur pesisir" },
      { en: "mangrove restoration", id: "restorasi mangrove" },
      { en: "residents", id: "warga" },
      { en: "fishermen", id: "nelayan" },
      { en: "outlet", id: "outlet" }
    ]
  };

  const events = [{ back: 26, key: "ev.singapore" }, { back: 20, key: "ev.fashion" }, { back: 2, key: "ev.award" }];
  return { project, TODAY, days, brands, brandDaily, brandStats, mentions, authors, team, topics, aspects, emotions, sources, geo,
    hashtags, keywords, outlets, alerts, alertRules, drafts, accounts, posts, settings, events };
}


/* ================= Generic project builder =================
   New projects get data simulated from their keywords (clearly labelled in the UI).
   Real collection replaces this with the backend's /projects/:id/mentions. */
function hashStr(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h) % 2147483646 + 1; }
function buildGeneric(project) {
  let seed = hashStr(project.id + project.keywords.join("|"));
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const TODAY = new Date(2026, 10, 18, 9, 0, 0), dayMs = 864e5, dateAt = back => new Date(TODAY.getTime() - back * dayMs);
  const brand = project.name, slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const authors = [
    { key: "kompas", name: "Kompas.com", handle: "kompas.com", followers: 4.2e6, type: "media" },
    { key: "detik", name: "Detik.com", handle: "detik.com", followers: 5e6, type: "media" },
    { key: "cnbc", name: "CNBC Indonesia", handle: "cnbcindonesia.com", followers: 2.1e6, type: "media" },
    { key: "kumparan", name: "Kumparan", handle: "kumparan.com", followers: 1.6e6, type: "media" },
    { key: "bisnis", name: "Bisnis.com", handle: "bisnis.com", followers: 9e5, type: "media" },
    { key: "localnews", name: "Berita Lokal", handle: "beritalokal.id", followers: 6e4, type: "media" },
    { key: "c1", name: "kulinerjakarta", handle: "@kulinerjakarta", followers: 48000, type: "creator" },
    { key: "c2", name: "review.santai", handle: "@review.santai", followers: 7200, type: "creator" },
    { key: "c3", name: "vlog harian", handle: "youtube.com", followers: 21000, type: "creator" },
    { key: "p1", name: "ardi.p", handle: "@ardi.p", followers: 320, type: "person" },
    { key: "p2", name: "sinta_w", handle: "@sinta_w", followers: 140, type: "person" },
    { key: "p3", name: "Lukas M", handle: "@lukasm", followers: 880, type: "person" }
  ];
  const A = Object.fromEntries(authors.map(a => [a.key, a]));
  /* [text with {kw}, lang, sentiment, topic, emotion, source, author, translation] */
  const T = [
    ["{kw} keren banget, pelayanannya ramah dan cepat.", "id", "pos", "g_experience", "joy", "tiktok", "c2", "{kw} is great, friendly and fast service."],
    ["Just tried {kw} and I'm really impressed with the quality.", "en", "pos", "g_experience", "joy", "x", "p3",
      "Baru coba {kw} dan kualitasnya bikin terkesan."],
    ["{kw} raih penghargaan dan terus berkembang tahun ini.", "id", "pos", "g_coverage", "trust", "news", "kompas", "{kw} wins an award and keeps growing this year."],
    ["{kw} umumkan rencana ekspansi ke kota baru.", "id", "neu", "g_coverage", "anticipation", "news", "cnbc", "{kw} announces plans to expand to a new city."],
    ["What does the latest {kw} announcement mean for the market?", "en", "neu", "g_coverage", "anticipation", "news", "bisnis",
      "Apa arti pengumuman terbaru {kw} bagi pasar?"],
    ["Kinerja {kw} kuartal ini dibahas analis.", "id", "neu", "g_coverage", "anticipation", "news", "detik", "Analysts discuss {kw}'s performance this quarter."],
    ["Ada yang pernah coba {kw}? Worth it nggak?", "id", "neu", "g_questions", "anticipation", "x", "p1", "Has anyone tried {kw}? Is it worth it?"],
    ["Promo {kw} minggu ini lumayan banget!", "id", "pos", "g_price", "joy", "tiktok", "c1", "This week's {kw} promo is really good!"],
    ["Harga {kw} naik lagi, agak kecewa.", "id", "neg", "g_price", "anger", "x", "p2", "{kw} prices went up again, a bit disappointed."],
    ["Customer service {kw} lambat merespons.", "id", "neg", "g_experience", "anger", "x", "p1", "{kw} customer service is slow to respond."],
    ["Event {kw} akhir pekan ini ramai dan seru.", "id", "pos", "g_events", "joy", "youtube", "c3", "This weekend's {kw} event was busy and fun."],
    ["{kw} hadir di pameran bulan depan.", "id", "neu", "g_events", "anticipation", "blogs", "localnews", "{kw} will be at next month's exhibition."],
    ["Behind the scenes at {kw}: how the team works.", "en", "pos", "g_coverage", "trust", "news", "kumparan",
      "Di balik layar {kw}: cara tim bekerja."],
    ["Mampir ke {kw} hari ini, suasananya nyaman.", "id", "pos", "g_experience", "joy", "tiktok", "c1", "Stopped by {kw} today, it felt comfortable."]
  ].filter(x => project.langs.includes(x[1]));
  const kws = project.keywords.filter(k => !k.startsWith("#"));
  const kwFor = () => (rnd() < 0.55 ? (kws[0] || brand) : pick(kws.length ? kws : [brand]));
  const srcs = project.sources;
  const pop = 1 + (hashStr(project.id) % 5);                 /* 1..5: how much the brand is talked about */
  const spikes = { [ri(15, 25)]: { add: 6 + pop * 2, topic: "g_coverage" }, [ri(2, 6)]: { add: 4 + pop, topic: "g_experience" } };
  const mentions = [], days = [], locs = ["Jakarta", "Jakarta", "Surabaya", "Bandung", "Bali", "Medan", "Singapore"];
  for (let back = 179; back >= 0; back--) {
    const sp = spikes[back];
    const n = Math.max(0, Math.round(pop * 0.9 + ((179 - back) / 179) * pop + rnd() * 2 + (sp ? sp.add : 0)));
    const d = { date: dateAt(back), pos: 0, neu: 0, neg: 0, reach: 0, reactions: 0, comments: 0, shares: 0, views: 0 };
    for (let k = 0; k < n; k++) {
      const r = rnd(), sent = r < 0.5 ? "pos" : r < 0.9 ? "neu" : "neg";
      let pool = T.filter(x => srcs.includes(x[5]) && x[2] === sent);
      if (!pool.length) pool = T.filter(x => srcs.includes(x[5]));
      if (!pool.length) continue;
      if (sp && rnd() < 0.6) { const tp = pool.filter(x => x[3] === sp.topic); if (tp.length) pool = tp; }
      const tpl = pick(pool), a = A[tpl[6]], src = tpl[5], kw = kwFor();
      let views = null, reach, reactions, comments, shares;
      if (src === "tiktok" || src === "youtube") { views = ri(300, 9000); reach = views; reactions = Math.round(views * (0.02 + rnd() * 0.06)); comments = Math.round(views * (0.001 + rnd() * 0.005)); shares = Math.round(views * (0.003 + rnd() * 0.02)); }
      else if (src === "news" || src === "blogs") { reach = Math.round(a.followers * (0.0004 + rnd() * 0.002)) + ri(80, 400); reactions = ri(0, 6); comments = ri(0, 2); shares = ri(0, 12); }
      else { reach = Math.round(a.followers * (0.1 + rnd() * 0.5)) + ri(20, 200); reactions = ri(0, 25); comments = ri(0, 5); shares = ri(0, 6); }
      const m = { text: tpl[0].replaceAll("{kw}", kw), lang: tpl[1], sentiment: tpl[2], topic: tpl[3], emotion: tpl[4], source: src, author: a,
        translation: tpl[7] ? tpl[7].replaceAll("{kw}", kw) : null, reach, reactions, comments, shares, views, sentConf: 0.8 + rnd() * 0.18,
        date: new Date(d.date.getTime() - rnd() * (back === 0 ? 0.35 : 0.95) * dayMs), location: pick(locs) };
      mentions.push(m); d[m.sentiment]++; d.reach += reach; d.reactions += reactions; d.comments += comments; d.shares += shares; d.views += views || 0;
    }
    days.push(d);
  }
  mentions.sort((a, b) => b.date - a.date); mentions.forEach((m, i) => (m.id = project.id + "-m" + (i + 1)));
  const brands = [{ key: "own", name: brand, own: true }, ...project.competitors.slice(0, 3).map((c, i) => ({ key: "c" + i, name: c }))];
  const brandDaily = { own: days.map(d => d.pos + d.neu + d.neg) }, brandStats = { own: { pos: 0.5, neg: 0.1, reach: 1 } };
  brands.slice(1).forEach(b => { const f = 0.5 + rnd(); brandDaily[b.key] = days.map((d, i) => Math.max(0, Math.round((pop * 0.8 + rnd() * pop * 1.5) * f * (1 + i / 400)))); brandStats[b.key] = { pos: 0.35 + rnd() * 0.25, neg: 0.04 + rnd() * 0.12, reach: 0.6 + rnd() * 0.8 }; });
  const last30 = mentions.filter(m => m.date > dateAt(30));
  const topicKeys = ["g_coverage", "g_experience", "g_price", "g_events", "g_questions"];
  const topics = topicKeys.map(k => { const ms = last30.filter(m => m.topic === k), c = ms.length || 1;
    return { key: k, count: ms.length, pos: ms.filter(m => m.sentiment === "pos").length / c, neg: ms.filter(m => m.sentiment === "neg").length / c, reach: ms.reduce((s, m) => s + m.reach, 0), trend: rnd() * 0.6 - 0.15 }; })
    .filter(x => x.count).sort((a, b) => b.count - a.count);
  const aspects = [{ key: "quality", pos: 0.7, neg: 0.08 }, { key: "service", pos: 0.52, neg: 0.22 }, { key: "price", pos: 0.34, neg: 0.31 }, { key: "availability", pos: 0.48, neg: 0.12 }, { key: "events", pos: 0.66, neg: 0.04 }];
  const emotions = ["joy", "trust", "anticipation", "surprise", "anger", "fear", "sadness"].map(k => ({ key: k, v: last30.filter(m => m.emotion === k).length })).filter(e => e.v);
  const sources = [...new Set(last30.map(m => m.source))].map(k => ({ key: k, v: last30.filter(m => m.source === k).length })).sort((a, b) => b.v - a.v);
  const geo = [...new Set(last30.map(m => m.location))].map(k => ({ key: k, v: last30.filter(m => m.location === k).length })).sort((a, b) => b.v - a.v);
  const hashtags = project.keywords.slice(0, 5).map(k => ({ tag: "#" + k.replace(/^#/, "").replace(/\s+/g, ""), v: ri(3, 30), d: rnd() * 0.6 - 0.1 }));
  const keywords = project.keywords.map(k => ({ w: k, v: last30.filter(m => m.text.toLowerCase().includes(k.replace(/^#/, "").toLowerCase())).length, d: rnd() * 0.5 - 0.1 }));
  const news = last30.filter(m => m.source === "news");
  const outlets = authors.filter(a => a.type === "media").map((a, i) => ({ name: a.name, tier: a.followers > 1e6 ? 1 : a.followers > 2e5 ? 2 : 3, articles: Math.max(1, news.filter(m => m.author === a).length),
    tone: pick(["pos", "neu", "neu"]), prominence: i % 2 ? "body" : "headline", reach: a.followers, rate: a.followers > 1e6 ? 25e6 : a.followers > 2e5 ? 10e6 : 3e6 }));
  const alerts = [{ id: "a1", sev: "warning", kind: "volumeUp", topic: "g_experience", factor: 1.8 + rnd(), count: ri(6, 15), reach: ri(8000, 40000), at: dateAt(1.2), state: "open" }];
  const alertRules = [
    { id: "r1", name: "negSpike", on: true, cond: "negSpike", channels: ["slack", "email"] },
    { id: "r2", name: "sensitive", on: true, cond: "sensitive", channels: ["slack"] },
    { id: "r3", name: "influencer", on: true, cond: "influencer", channels: ["email"] },
    { id: "r4", name: "dailyDigest", on: false, cond: "digest", channels: ["email"] }
  ];
  const team = [{ id: "u1", name: "Ayu Lestari", initials: "AL", role: "admin" }, { id: "u4", name: "Hendra", initials: "HE", role: "admin" }];
  const accounts = [{ _id: "acc_ig", platform: "instagram", name: "@" + slug, limit: 2200 }, { _id: "acc_fb", platform: "facebook", name: brand, limit: 5000 }];
  const settings = { keywords: project.keywords, excluded: project.excluded, keyMessages: [], banned: ["best in the world", "guaranteed", "100%", "terbaik di dunia", "dijamin", "pasti untung"],
    voice: ["warm", "confident", "factual"], glossary: [] };
  const events = Object.keys(spikes).map(Number).sort((a, b) => b - a).map((b, i) => ({ back: b, key: i ? "ev.g.campaign" : "ev.g.spike" }));
  return { project, TODAY, days, brands, brandDaily, brandStats, mentions, authors, team, topics, aspects, emotions, sources, geo, hashtags, keywords, outlets,
    alerts, alertRules, drafts: [], accounts, posts: [], settings, events, simulated: true };
}

/* ================= Projects ================= */
window.PROJECT_PRESETS = [{
  id: "kkb", name: "Kura Kura Bali", domain: "kurakurabali.com",
  keywords: ["Kura Kura Bali", "kurakurabali", "#KuraKuraBali", "KEK Kura Kura Bali", "Sira Village", "Pulau Serangan"],
  excluded: ["kura-kura (turtle) recipes", "Kura Kura Coffee"], competitors: ["The Nusa Dua", "KEK Sanur", "Nuanu Creative City"],
  langs: ["id", "en"], sources: ["news", "tiktok", "x", "youtube", "blogs", "bluesky"], created: new Date(2026, 9, 19).toISOString()
}];
window.buildDataset = project => (project.id === "kkb" ? buildKKB(project) : buildGeneric(project));
