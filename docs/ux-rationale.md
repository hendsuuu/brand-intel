# Kura Kura Bali Brand Intel: alasan desain UI/UX

Prototype: `brand-intel/prototype/` (buka lewat server lokal, lihat bagian "Menjalankan").
Bahasa UI: **English sebagai default**, bisa diganti ke **Bahasa Indonesia** (tombol EN/ID di kanan atas; pilihan tersimpan per browser).

## 0. Identitas visual (18 Nov)

- **Diambil dari kurakurabali.com:** logo (ikon cangkang kura-kura "K" + wordmark, disimpan di `prototype/assets/`), warna utama hijau tua **#2b512b**, sage #acc29b, pasir #cfcabe, krem #f2ecdb, latar #f9f9f9, teks #111, dan tombol berbentuk pil.
- **Font: Plus Jakarta Sans** untuk semua teks (permintaan: tidak sama dengan website, bersih dan mudah dibaca). Website memakai Cormorant Garamond (serif) + Instrument Sans; dashboard sengaja memakai satu sans yang mirip Instrument Sans tetapi dirancang untuk layar, punya angka tabular, dan berasal dari Jakarta.
- **Hierarki lewat warna dan ketebalan, bukan teks:** judul halaman tebal (800) tanpa deskripsi (deskripsi pindah ke ikon ⓘ; hanya Home yang menampilkan ringkasan karena berisi angka), label KPI kecil kapital abu-abu, angka KPI besar tebal, perubahan sebagai highlight hijau/oranye, kartu AI diberi latar hijau sangat muda, menu aktif hijau tebal.
- **Warna grafik** bernuansa Bali dan lolos uji buta warna di mode terang dan gelap: biru #2f78b0 (positif), terakota #d0643a (negatif), pasir #b8b1a1 (netral), teal #1d9a8c, ungu #9a5fb5.
- Mode gelap memakai hijau sangat tua dengan aksen sage.

## 1. Siapa penggunanya dan apa pekerjaannya

| Peran | Pekerjaan utama | Halaman utama |
|---|---|---|
| Comms manager | Tahu apa yang perlu ditangani hari ini, melapor ke manajemen | Home, Insights, Reports |
| Analis | Memilah mention, membaca tren, mengatur peringatan | Mentions, Insights, Alerts |
| Penulis | Menulis pernyataan, siaran pers, caption; menerjemahkan; meringkas | Studio |
| Admin sosial | Menjadwalkan posting ke GHL | Planner |

## 2. Struktur informasi (dari kebutuhan brief)

Navigasi (diperbarui 18 Nov): **Beranda**, lalu dua kelompok dengan nama yang jelas:
- **Analitik**: Mention, Insight, Kompetitor (dulu "Benchmark"), Nilai media, Laporan.
- **Konten**: Studio, Perencana.
- **Peringatan** pindah ke ikon lonceng 🔔 dengan angka di topbar (selalu terlihat di setiap halaman). Di bawah sidebar hanya **Workspace** (khusus admin).

Sebelumnya: Listen / Create / Publish (istilah teknis, tiga kelompok untuk sembilan menu).

- **Home**: satu layar "apa yang perlu saya lakukan sekarang" (peringatan, mention negatif/penting yang belum Anda buka, posting GHL gagal) + 4 KPI + jadwal 7 hari.
- **Listen**: Mentions (daftar + panel filter seperti Brand24), Insights (interaksi, sentimen, topik, emosi, audiens), Benchmark (kompetitor/SoV), Media value (AVE + nilai tertimbang), Alerts.
- **Create**: Studio — satu editor untuk menulis; terjemah, koreksi, dan ringkas adalah tombol yang bekerja pada teks yang sama; draf tersimpan di bawahnya.
- **Publish**: Planner (GHL Social Planner + kalender pers/internal), Reports.
- **Tidak ada menu Settings** (dihapus 18 Nov, terlalu teknis untuk user). Isinya dipindah ke tempat pemakaiannya:
  - **Pengaturan proyek** (dari menu ganti proyek atau tombol "Pengaturan" di kartu proyek): nama, situs, kata kunci, pengecualian, kompetitor, bahasa, sumber (cukup dicentang), dan hapus proyek. Form-nya sama dengan "Proyek baru". Menyimpan perubahan kata kunci/sumber/kompetitor memicu pengumpulan ulang.
  - **Gaya bahasa brand** (tombol di Studio): karakter suara, pesan kunci EN/ID, klaim terlarang, glosarium.
  - **Tarif media** (di Nilai media, kolom "Tarif per artikel"): otomatis dari trafik bulanan media (label *Otomatis*), bisa diganti harga media kit lewat ikon pensil (label *Media kit*), dan bisa dikembalikan ke otomatis.
  - **Workspace** (khusus admin): anggota tim & peran saja.
  - **Dihapus dari UI** (masuk dokumentasi developer): metode & frekuensi crawler per sumber, status integrasi, daftar endpoint API GHL, lokasi token.
  - **GoHighLevel tidak disebut di UI** (18 Nov): tidak ada label "Synced with GHL"; pesan, error, dan toast memakai istilah umum ("akun sosial", "jadwal"). Integrasi GHL tetap berjalan di backend.

Keputusan penting:
- **Kalender konten digabung ke Planner.** Sebelumnya ada "Kalender konten" dan "Social Planner" terpisah, padahal tim hanya butuh satu kalender. Posting sosial (dari GHL), siaran pers, dan catatan internal kini tampil di kalender yang sama, dibedakan warna dan filter jenis.
- **Tidak ada menu Approvals** (dihapus 18 Nov atas permintaan). Draf cukup disimpan, disalin, atau dikirim ke Planner; status *In review* GHL juga tidak dipakai. Studio disederhanakan dari 4 tab menjadi satu editor dengan alat teks.
- **GHL tidak ditampilkan di aplikasi** (nama, status, maupun endpoint); cukup di dokumentasi developer.

## 2b. Proyek (multi-brand)

- **Satu proyek = satu brand** dengan kata kunci, sumber, kompetitor, dan dashboard sendiri. Semua halaman (Home, Mentions, Insights, Studio, Planner, dst.) menampilkan data proyek aktif.
- **Ganti proyek** lewat tombol nama proyek di atas sidebar (daftar proyek, "Semua proyek", "Proyek baru"), atau ⌘K → "Ganti ke …".
- **Halaman Proyek** (`#/projects`): kartu per proyek berisi kata kunci, mention 30 hari, skor kehadiran, % negatif, sumber data, tombol Buka dashboard, dan hapus (untuk proyek buatan pengguna).
- **Buat proyek** (`#/new-project`): nama*, situs (opsional), **kata kunci*** sebagai chip (Enter/koma; tempel daftar dipisah koma; Backspace menghapus yang terakhir; saran otomatis dari nama, mis. `kopikenangan`, `#KopiKenangan`, domain), pengecualian, maksimal 3 kompetitor, bahasa, dan sumber. Validasi inline.
- **Proses** (`#/processing`): 5 langkah terlihat (berita & blog → media sosial → AI bahasa/sentimen/emosi → skor → dashboard), penghitung mention, bilah progres, lalu tombol **Buka dashboard**.
- Prototype: proyek baru memakai **data simulasi** dari kata kuncinya (label "Simulated data" di topbar) dan disimpan di browser. Produksi: proyek disimpan di server dan membuat job pengumpulan data sungguhan (mention pertama dalam hitungan menit, 30 hari terakhir diisi otomatis).
- Status *dilihat* disimpan per pengguna **dan per proyek**.

## 2c. Bantuan AI di setiap menu

Semua blok AI memakai komponen yang sama: label **AI**, tombol buat ulang dan salin, tautan ke mention sumber, dan catatan "Dibuat AI dari N mention, periksa sumber". Prototype menyusun teks dari data proyek dengan template (angka dan kutipan nyata untuk dataset); produksi memakai LLM dengan input yang sama dan wajib mengutip sumber.

| Menu | Bantuan AI |
|---|---|
| Topbar (semua halaman) | **Tanya AI**: tanya-jawab tentang data proyek (mention negatif, posting terbaik, waktu posting terbaik, kompetitor, ringkasan, atau topik bebas lewat pencarian konteks), dengan contoh pertanyaan dan kutipan sumber |
| Home | **Ringkasan harian AI**: volume, topik utama, sentimen, mention berdampak tertinggi, dan saran tindakan |
| Mentions | **Ringkas dengan AI** untuk hasil filter (tema, sumber, mention penting, langkah lanjut) dan **saran tindakan AI** di setiap detail mention (tanggapi / jawab / terima kasih / bagikan / tidak perlu) dengan tombol draf |
| Insights | Penjelasan AI per tab (interaksi, sentimen, topik, emosi, audiens) |
| Benchmark | Kesimpulan persaingan AI |
| Alerts | Saran respons AI untuk setiap peringatan terbuka |
| Planner | **Saran posting dari AI**: 3 ide (topik utama, repost UGC terbaik, kata kunci yang naik) dijadwalkan pada jam interaksi tertinggi; satu klik menjadi draf |
| Reports | Ringkasan eksekutif AI |
| Studio | Sudah berbasis AI (menulis, terjemah, koreksi, ringkas) |

## 2d. Hapus proyek

- Tombol **Delete** di setiap kartu proyek dan **Danger zone** di Pengaturan proyek, keduanya dengan konfirmasi.
- Semua proyek bisa dihapus, termasuk Kura Kura Bali, selama masih ada proyek lain (minimal satu proyek). Setelah menghapus proyek aktif, aplikasi pindah ke proyek lain dan membuka halaman Proyek.

## 3. Alur yang saling tersambung (monitoring → aksi)

Setiap insight punya langkah lanjut sekali klik:
- Peringatan lonjakan negatif → **Review mentions** (sudah terfilter topik + negatif) atau **Draft a statement** (Studio terbuka dengan konteks peringatan dan brief terisi).
- Mention → **Draft response** (Studio, template balasan, bahasa mengikuti bahasa mention).
- Topik / kata kunci di Insights → membuka Mentions terfilter.
- Draf caption → **Schedule in Planner** (composer terbuka dengan teks terisi).
- Draf → **Save draft** (daftar draf tersimpan di Studio) atau **Schedule in Planner** (untuk caption/balasan).
- Posting GHL gagal → Home → Planner membuka posting itu beserta penyebab dan tombol Retry.

## 4. Pola interaksi

- **Mentions = daftar + panel filter di kanan** (mengikuti pola Brand24, 18 Nov). Tidak ada status kerja atau penanggung jawab.
  - **Sumber**: centang lebih dari satu; "All sources" mencentang semuanya (default).
  - **Sentimen, emosi, lokasi**: pilih satu atau lebih; kosong = semua.
  - **Skor pengaruh minimal** (slider 0–10), **tingkat penting** (Semua / Penting = skor dampak ≥ 6), **status dilihat** (Semua / Belum dilihat / Sudah dilihat).
  - **Pencarian konteks pintar**: tulis kebutuhan dengan kata biasa (EN/ID), mis. "pengunjung yang bertanya soal parkir"; AI mencari mention dengan makna yang sama. Prototype memakai peta konsep sederhana; produksi memakai pencarian semantik (embedding).
  - **Status dilihat otomatis dan per pengguna**: membuka mention menandainya *Sudah dilihat* hanya untuk pengguna itu. Ada tombol "Tandai semua sudah dilihat" untuk hasil filter. Prototype menyimpannya di browser; produksi menyimpannya per pengguna di server.
  - Klik mention membuka panel detail (sentimen AI + keyakinan, emosi, skor dampak & pengaruh, rincian interaksi, terjemahan) dengan tombol **Draft response**.
  - Pintasan: J/K pindah, Enter buka, R balas.
- **Sentimen sepenuhnya oleh model AI**, tanpa koreksi manual. Panel detail menampilkan label beserta tingkat keyakinan model (mis. "AI · 91%").
- **Terjemahan mention** berbahasa Indonesia bisa ditampilkan dalam English (untuk manajemen non-Indonesia).
- **Pemeriksaan otomatis di Studio** berjalan saat mengetik: pesan kunci, klaim berisiko/terlarang, keterbacaan, placeholder, kontak media, panjang karakter, nada. Ada skor kesiapan sebagai panduan, tanpa langkah persetujuan.
- **Composer Planner**: pilih akun, penghitung karakter mengikuti batas kanal terketat, pratinjau per kanal, validasi tanggal masa depan, posting terjadwal/terbit dikunci (GHL hanya mengizinkan edit draf).
- **Command palette (⌘K / Ctrl K)**: lompat ke halaman, buat posting/draf, ganti bahasa/tema/rentang tanggal.
- Setiap aksi memberi umpan balik (toast), dan aksi yang bisa dibatalkan menyediakan **Undo**. Hapus selalu minta konfirmasi.
- Empty state yang menjelaskan langkah berikutnya; skeleton saat AI "menulis".

## 5. Data visual

- **Warna sentimen: biru = positif, terakota = negatif, pasir = netral.** Merah–hijau sengaja dihindari karena sulit dibedakan oleh pengguna buta warna. Warna aksen UI (teal) tidak dipakai di grafik agar tidak terbaca sebagai data.
- Grafik volume: kolom bertumpuk, **negatif di garis dasar** agar lonjakan negatif langsung terbaca; penanda bernomor untuk peristiwa (festival, keluhan akses, tanam mangrove).
- Sentimen per aspek: batang divergen (negatif ke kiri, positif ke kanan).
- Benchmark: satu sumbu, label langsung di ujung garis, brand sendiri ditebalkan.
- Setiap grafik punya **tooltip** dan tombol **Table** (tampilan tabel untuk aksesibilitas/ekspor). Tidak ada pie, word cloud, atau grafik dua sumbu.
- Setiap KPI punya delta vs periode sebelumnya dan ikon (i) berisi definisi.

## 6. Metrik interaksi dan skor

Interaksi menjadi metrik utama, di samping volume dan sentimen.

- **Interaksi** = reaksi + komentar + dibagikan; **tayangan** ditampilkan terpisah jika platform melaporkannya.
- **Tingkat interaksi** = interaksi ÷ perkiraan jangkauan.
- **Skor dampak (0–10, per mention)** = 40% jangkauan + 40% interaksi + 20% audiens penulis. Rentang skala dikalibrasi ke volume Kura Kura Bali (jangkauan 30–100 rb, interaksi 1–1.000 per mention). Dipakai untuk mengurutkan mention ("Highest impact") dan menentukan mana yang ditanggapi dulu.
- **Skor pengaruh (0–10, per penulis/situs)** = 60% besar audiens + 40% rata-rata interaksi per mention. Dipakai untuk menemukan kreator dan jurnalis.
- **Skor kehadiran (0–100, per brand)** = 35% volume mention + 35% jangkauan + 30% interaksi. KPI di Home, dengan perubahan dalam poin.
- Semua skor memakai **skala logaritmik**, agar satu posting viral atau media raksasa tidak mendominasi. Bobot bisa diatur di backend.
- Tampil di: Home (KPI), Insights → tab **Engagement** (KPI, grafik interaksi per hari, mention dengan dampak tertinggi, penjelasan skor), Mentions (skor di tiap item, urutan, filter skor pengaruh dan tingkat penting), detail mention (rincian interaksi, skor dampak, skor pengaruh penulis), Sources & audience (skor pengaruh).

## 7. Bahasa (i18n)

- Semua teks UI ada di `i18n.js` (EN + ID). Terjemahan Indonesia ditulis natural, bukan harfiah.
- Angka, tanggal, mata uang, dan waktu relatif mengikuti locale (`en-GB` / `id-ID`), mis. "21.6m" vs "21,6 jt", "Rp 1,2 M".
- Isi mention (konten pengguna) tetap dalam bahasa aslinya.
- Studio bisa menulis dalam English atau Indonesia, terlepas dari bahasa UI.

## 8. Aksesibilitas & responsif

- Navigasi keyboard penuh, focus ring terlihat, label ARIA pada kontrol ikon, status tidak hanya bergantung warna (selalu ada label/ikon).
- Tema terang/gelap (ikut OS, bisa diganti manual), `prefers-reduced-motion` dihormati.
- Mobile: sidebar menjadi drawer, panel detail mention layar penuh, tabel di-scroll di dalam kartu, tidak ada scroll horizontal halaman. Rentang tanggal di HP lewat pencarian (⌘K).

## 9. Yang masih mock (perlu backend)

- Semua data adalah contoh (`data.js`), dimodelkan dari cuplikan trial Brand24 Kura Kura Bali (19 Okt – 18 Nov 2026): ±164 mention/30 hari, mayoritas berita, hampir tanpa sentimen negatif; topik nyata (KEK & investasi, outlet Sira Village, Labdanation Fashion Week, pendidikan & masyarakat), media dan kreator nyata, angka per item perkiraan. Total harian dijumlahkan dari mention sehingga semua angka konsisten. Perubahan hilang saat halaman dimuat ulang.
- AI: sentimen dan keyakinannya masih data contoh; draf memakai template, terjemahan hanya untuk teks contoh, ringkasan memakai metode ekstraktif sederhana. Produksi memakai LLM.
- GHL: objek `ghl` di `app.js` adalah adapter. Di produksi diganti `fetch` ke backend yang menyimpan token GHL dan meneruskan ke `/social-media-posting/{locationId}/…`.
- Ekspor/unduh laporan, unggah PDF/Word, dan notifikasi Slack/WhatsApp belum berfungsi.

## Menjalankan

```bash
cd prototype && python3 -m http.server 5317 --bind 127.0.0.1
```

Lalu buka http://localhost:5317. (Membuka `index.html` langsung dengan klik dua kali juga bisa di kebanyakan browser.)
