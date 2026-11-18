# Brand24 feature catalog + gap analysis (for our Brand Intelligence dashboard)

Sumber: halaman publik brand24.com (home, /features/, /pricing/), dibaca 2026-11-18.
Bukan dari dalam aplikasi berlogin, dan tidak ada kode/aset Brand24 yang disalin.
Yang dicatat di sini hanya NAMA dan FUNGSI fitur; implementasinya kita desain sendiri.

## A. Fitur Brand24 (yang harus kita punya, P1 = MVP)

| # | Fitur | Fungsi | Prioritas |
|---|---|---|---|
| 1 | Mention feed + Advanced filtering | Daftar mention, filter sumber/sentimen/bahasa/tanggal/lokasi/tag | P1 |
| 2 | Sentiment analysis | Positif/netral/negatif per mention + tren | P1 |
| 3 | Reach & Influence score | Estimasi jangkauan sumber/penulis, ranking pengaruh | P1 |
| 4 | Sources breakdown | Pembagian per platform/media | P1 |
| 5 | Language detection | Deteksi bahasa otomatis (ID/EN dulu) | P1 |
| 6 | Context of discussion | Word cloud + tema utama | P1 |
| 7 | Storm alerts / Anomaly detection | Notifikasi lonjakan/penurunan volume atau reach | P1 |
| 8 | Personalized notifications | Alert berdasar filter (Slack, email) | P1 |
| 9 | Tags & filters | Label manual dan otomatis | P1 |
| 10 | Share of voice / Voice share | Porsi percakapan vs kompetitor | P2 |
| 11 | Project comparison | Bandingkan brand/proyek berdampingan | P2 |
| 12 | Emotion analysis (+emoji) | Marah/senang/takut, dll. | P2 |
| 13 | Topic analysis (AI) | Topik + sentimen, reach, SoV per topik | P2 |
| 14 | AVE | Nilai ekonomi pemberitaan (rate card bisa diatur) | P2 |
| 15 | Reputation score / Presence score | Skor tunggal gabungan sentimen + dampak | P2 |
| 16 | Hashtag tracking | Volume, reach, influencer per hashtag | P2 |
| 17 | Geolocation | Filter dan peta per wilayah | P2 |
| 18 | Intent detection | Tandai mention dengan niat beli | P3 |
| 19 | UGC finder | Konten buatan pengguna | P3 |
| 20 | AI Insights | Laporan otomatis + rekomendasi | P2 |
| 21 | Brand Assistant (chatbot) | Tanya-jawab di atas data proyek | P2 |
| 22 | Reports: email, Excel, PowerPoint, infographic, PDF | Laporan terjadwal dan ekspor | P2 |
| 23 | Slack integration | Mention ke channel | P1 |
| 24 | API (+MCP) | Akses data terprogram | P3 |
| 25 | AI Visibility | Brand muncul/tidak di jawaban AI (ChatGPT, dll.) | P3 |
| 26 | Crisis management, Influencer marketing views | Tampilan tematik di atas fitur di atas | P3 |

Sumber data yang diklaim Brand24: X, Facebook, Instagram, LinkedIn, TikTok, Reddit,
Telegram, YouTube, Spotify, berita, blog, forum, review, TripAdvisor, App Store.

## B. Fitur yang TIDAK ada di Brand24 tapi kita butuhkan (kebutuhan Communication Dept.)

Ini yang kamu minta sebagai "fitur lainnya yang kurang".

| # | Fitur tambahan | Alasan |
|---|---|---|
| B1 | Content Studio: draft email, pengumuman, siaran pers dengan brand voice | Poin 2 dari brief; Brand24 hanya memantau |
| B2 | Review otomatis konten (nada, klaim berisiko, istilah terlarang) + alur approval | Konsistensi komunikasi |
| B3 | Terjemahan ID⇄EN dengan glossary perusahaan + proofreading | Poin brief |
| B4 | Ringkasan dokumen/rapat + poin aksi | Poin brief |
| B5 | Kalender konten dengan saran topik dari tren dashboard | Poin brief (content planning) |
| B6 | Media database/jurnalis: siapa menulis apa, nada ke kita, riwayat kontak | PR practice; Brand24 hanya influencer |
| B7 | Respon cepat krisis: draft pernyataan dari mention negatif + approval | Menyambung monitoring ke aksi |
| B8 | Sentimen bahasa Indonesia (slang, campur bahasa) sepenuhnya oleh model AI, tanpa koreksi manual | Akurasi lokal |
| B9 | Valuasi selain AVE: sentiment index, SoV tertimbang, prominence | AVE sering dikritik di PR |
| B10 | Pesan kunci (key message) tracking: seberapa sering narasi kita muncul di media | Konsistensi pesan |
| B11 | Aspect-based sentiment (harga, layanan, produk) | Lebih dalam dari positif/negatif |
| B12 | Role & audit log (Admin/Analis/Penulis/Approver) | Tata kelola |

## C. Catatan hukum / teknis
- Brand24 sendiri mengambil data dari kontrak/penyedia data; kita tidak akan "scrape semua".
  Sumber: API resmi + penyedia data berlisensi + crawler berita (patuhi robots.txt). Adapter per sumber.
- Pembatasan: tidak membaca dashboard berlogin Brand24 tanpa akun milik sendiri; tidak menyalin kode/aset/teks mereka.
- Harga acuan Brand24: $199–$599/bln (Individual–Business), Enterprise ≥ $1,499; API +$149.
