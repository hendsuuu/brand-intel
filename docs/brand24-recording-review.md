# Review screen recording Brand24 (akun trial, proyek Kura Kura Bali)

Sumber: screen recording akun trial Brand24 (±2 menit), ditinjau 2026-11-18.
Catatan: yang kita ambil adalah **fungsi dan kebutuhan**, bukan tampilan/kode Brand24. Desain tetap milik kita.

## A. Inventaris fitur yang terlihat

| Halaman Brand24 | Isi yang terlihat |
|---|---|
| **Navigasi** | Pemilih proyek (+ jumlah mention baru), cari Ctrl+K, tambah proyek. Menu: Mentions, AI Insights, Analysis, AI Brand Assistant, AI Topic Analysis, Comparison, Demographics, Influencers & Sources. Reports: Email reports, PDF Creator, Excel report, Infographic |
| **Mentions** | Cari mention/penulis/domain; grafik mentions + reach ("klik grafik untuk filter tanggal"); urut relevansi; kartu mention: sumber, visits, *influence score x/10*, tanggal, sentimen bisa diubah; aksi: Visit, Tags, Delete, **Add to PDF report**, More actions, checkbox. Panel kanan: rentang tanggal, **Summarize with AI**, **Generate Report**, filter Sources dengan jumlah (News 112, TikTok 28, X 8, Videos 6, Blogs 6, Web 3), tombol **Connect** akun Facebook/Instagram sendiri, filter Sentiment, **Channel type: Owned / Earned** |
| **AI Insights** | Laporan otomatis mingguan (Senin 09.00) dengan **judul naratif**, poin insight bernomor + **sitasi [1][2]** ke mention, grafik mentions & reach, bagian Trends, grafik sentimen positif/negatif, "Report actions" |
| **Analysis** | Mention paling populer; dari profil publik teratas; **grid metrik dengan % perubahan**: total mentions, total reach, positif, negatif, **Presence Score**, **AVE**, social/non-social reach, social/non-social mentions, **UGC**, reactions, comments, shares, total interactions; **Presence Score 17/100 + "lebih tinggi dari 51% brand"** + tren; sentimen (exclude neutral); trending hashtags; **trending links**; most active sites; **Hot Hours** (heatmap hari × jam, zona waktu, metrik mentions/reach/interactions); emotions share; emoji populer; context of discussion (word cloud + sentimen) |
| **AI Brand Assistant** | Tombol melayang "Ask AI Brand Assistant" di semua halaman (tanya-jawab atas data proyek) |
| **AI Topic Analysis** | Topik + **deskripsi AI**, mentions, reach, share of voice, sentiment share, More stats, Delete topic (topik lain dikunci di trial) |
| **Comparison** | **Compare projects / Compare periods**; Days/Weeks/Months; tabel overview; grafik mentions, reach, sentimen positif/negatif (% atau jumlah); sentiment breakdown; **categories share** (per jenis sumber); Export PPTX / CSV |
| **Demographics** | Usia × gender, gender, sebaran negara, tingkat pendidikan, minat. Catatan Brand24 sendiri: data dari web, bukan media sosial, cakupan terbatas. Export PPTX |
| **Influencers & Sources** | Tab Influencers (profil, sumber, mentions, reach, followers, SoV, **influence score /10**, hapus); Influencers Analysis (SoV per tokoh, influencer positif/negatif); Sources (domain, mentions, reach, **visits**, influence score) |
| **Reports** | Email reports, PDF Creator, Excel, Infographic |

## B. Temuan penting dari data asli Kura Kura Bali

Data contoh di prototype kita **tidak mencerminkan kenyataan**:
- 30 hari terakhir hanya **±164 mention**, didominasi **berita (112)**, lalu TikTok (28) dan X (8).
- **Negatif 0%**, positif 47% (14 hari).
- Topik nyata: **KEK / investasi Kura Kura Bali** (85 mention, SoV 87,7%), **Labdanation Fashion Week** di Sira Village, **Sustainable Fashion Show**, penghargaan **Sira Village Grand Outlet** (PropertyGuru Awards), investasi Singapura dan sekolah ACS, PT Bali Turtle Island Development (BTID), Mitsubishi Estate.
- Influencer: akun TikTok kecil lokal dan kanal YouTube kuliner. Sumber berita: bloombergtechnoz, wisata.viva, voi.id, times.co.id, balitribune, antaranews, thejakartapost.

**Status (18 Nov):** data contoh prototype sudah diganti ke topik, media, kreator, dan skala volume nyata ini.

**Artinya:** kebutuhan utama Kura Kura Bali saat ini adalah **PR dan narasi investasi** (liputan, nilai media, pesan kunci KEK, tenant/event), bukan penanganan krisis. Prototype kita terlalu berat ke krisis (macet, nelayan). Fitur krisis tetap perlu, tetapi Home dan data contoh sebaiknya diarahkan ke liputan dan narasi.

## C. Gap: ada di Brand24, belum ada di prototype kita

| Prioritas | Fitur | Usulan di prototype kita |
|---|---|---|
| P1 | **AI Insights** (laporan naratif mingguan + sitasi ke mention) | Halaman baru "AI Insights" di Listen; tiap poin bisa diklik ke mention-nya |
| P1 | **AI Assistant** (tanya-jawab atas data) | Panel "Ask" di semua halaman; jawaban dengan sitasi dan tombol "buat draf dari ini" (sambung ke Studio) |
| P1 | **Owned vs Earned** + hubungkan akun sendiri | Filter channel type; akun sosial sendiri diambil lewat GHL (sudah terhubung) |
| P1 | **Interaksi** (reactions, comments, shares) dan **UGC** di KPI | ✅ Sudah: tab Engagement + skor dampak/pengaruh/kehadiran (18 Nov) |
| P1 | **Mention: "Add to report"**, hapus/blacklist sumber atau penulis | Aksi di panel detail mention; keranjang laporan |
| P1 | **Klik grafik untuk filter tanggal** | Klik kolom di grafik volume membuka Mentions untuk tanggal itu |
| P2 | **Hot Hours** (heatmap hari × jam) | Di Insights, dan dipakai Planner untuk saran "waktu terbaik posting" |
| P2 | **Presence / Reputation score + persentil** | KPI baru dengan penjelasan cara hitung |
| P2 | **Compare periods** (bukan hanya kompetitor) | Toggle "Kompetitor / Periode" di Benchmark |
| P2 | **Influence score /10** + **visits** untuk sumber | Kolom di Sources & audience |
| P2 | **Trending links**, mention terpopuler, top public profiles | Kartu di Insights |
| P2 | **Simpan filter** + chip filter aktif | Di Mentions dan Insights |
| P2 | **Topik: deskripsi AI**, hapus/gabung topik | Di tab Topics |
| P3 | **Demographics** (usia, gender, minat, negara) | Tab di Insights dengan label "perkiraan, cakupan terbatas" |
| P3 | Export **PPTX/CSV per halaman**, Infographic | Tombol export di header halaman |
| P3 | Emoji populer | Opsional |

## D. Yang sudah kita punya dan tidak ada di Brand24 (tetap dipertahankan)

- Mentions dengan **panel filter seperti Brand24** plus status *dilihat* otomatis per pengguna, skor dampak/pengaruh di setiap item, dan pencarian konteks pintar EN/ID.
- **Studio**: draf dengan gaya bahasa brand, pemeriksaan otomatis, terjemahan EN⇄ID dengan glosarium, koreksi, ringkasan dokumen.
- **Approvals** sebelum publikasi.
- **Planner terhubung GHL**: kalender sosial + pers + internal.
- **Sentimen per aspek**, **nilai media tertimbang** (bukan hanya AVE), sambungan langsung peringatan → draf pernyataan.
- UI **English ⇄ Bahasa Indonesia**.

## E. Catatan desain (yang tidak kita tiru)

- Grafik Brand24 "Mentions + Reach" memakai **dua sumbu Y**. Ini menyesatkan; kita tetap pakai dua grafik terpisah atau indeks.
- **Word cloud dan gauge/donut** sulit dibaca dan dibandingkan. Kita pakai daftar kata kunci dengan tren dan batang.
- Banyak angka Brand24 tanpa konteks. Kita pertahankan definisi (ikon i) dan perbandingan dengan periode sebelumnya.
