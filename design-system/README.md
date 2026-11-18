# Kura Kura Bali — Design System

Style yang dipakai dashboard Brand Intel, siap disalin ke project lain.
Sumber brand: kurakurabali.com (diambil 18 Nov 2026).

```
design-system/
├── kkb-tokens.css   ← warna, font, radius, bayangan, palet grafik (terang + gelap)
├── kkb-ui.css       ← semua komponen (pakai token di atas)
├── preview.html     ← galeri komponen + contoh HTML
└── assets/
    ├── kkb-logo.png      (1000×640, logo lengkap)
    └── kkb-icon-192.png  (ikon cangkang, untuk favicon/avatar)
```

## Cara pakai

```html
<link rel="icon" href="assets/kkb-icon-192.png">
<link rel="stylesheet" href="kkb-tokens.css">   <!-- sudah memuat font Plus Jakarta Sans -->
<link rel="stylesheet" href="kkb-ui.css">
```

- **Mode gelap** otomatis mengikuti sistem. Paksa dengan `<html data-theme="dark">` atau `data-theme="light"`.
- **Ganti tema / brand lain**: cukup ubah nilai di `kkb-tokens.css`. Komponen tidak memakai warna langsung.
- Hanya butuh token? Salin `kkb-tokens.css` saja dan pakai `var(--accent)`, `var(--font)`, dst.

## Brand

### Logo
- `kkb-logo.png`: logo lengkap (ikon cangkang “K” + wordmark KURA KURA BALI). Untuk halaman login, laporan PDF, kop.
- `kkb-icon-192.png`: ikon saja. Untuk favicon, sidebar, avatar proyek. Tampilkan di atas latar putih (`.brand-mark.logo`).
- Beri ruang kosong minimal setinggi huruf “K” di sekeliling logo. Jangan diberi bayangan, efek, atau warna lain.

### Warna

| Token | Terang | Gelap | Dipakai untuk |
|---|---|---|---|
| `--accent` | `#2b512b` hijau tua | `#acc29b` sage | Tombol utama, menu aktif, link, highlight |
| `--accent-soft` | `#e8efe2` | `#223322` | Latar menu aktif, chip terpilih |
| `--accent-tint` | `#f5f8f1` | `#18221a` | Latar kartu AI / sorotan lembut |
| `--sage` | `#acc29b` | `#acc29b` | Aksen sekunder |
| `--sand` | `#cfcabe` | `#6f6a5f` | Garis sumbu, aksen netral |
| `--bg` | `#f7f6f2` | `#0e120e` | Latar halaman |
| `--surface` | `#ffffff` | `#151b15` | Kartu, panel |
| `--surface-2` / `-3` | `#f4f2ec` / `#e9e5da` | `#1c241c` / `#253025` | Hover, latar sekunder |
| `--ink` | `#111111` | `#f1efe8` | Teks utama |
| `--ink-2` | `#4a4a4a` | `#c8c4b8` | Teks sekunder |
| `--muted` | `#6e6e6e` | `#9b978b` | Label, keterangan |
| `--up-text` / `--up-bg` | `#2b6b2f` / `#e5f0df` | `#9fd18b` / `#1f3320` | Perubahan baik |
| `--down-text` / `--down-bg` | `#b0442a` / `#fbe9e2` | `#f39270` / `#3a221a` | Perubahan buruk |

Warna asli website (referensi): krem `#f2ecdb`, latar `#f9f9f9`, teks `#111111`, hijau `#2b512b` / `#366538`, biru `#5c9ab1`.

### Warna grafik
Bernuansa Bali dan **lolos uji buta warna** (urutan ini penting, jangan diacak):

| Token | Terang | Gelap | Arti |
|---|---|---|---|
| `--s1` / `--pos` | `#2f78b0` biru | `#4489c2` | Seri 1 · sentimen positif |
| `--s2` / `--neg` | `#d0643a` terakota | `#d36c42` | Seri 2 · sentimen negatif |
| `--s3` | `#1d9a8c` teal | `#20a090` | Seri 3 |
| `--s4` | `#9a5fb5` ungu | `#a874c6` | Seri 4 |
| `--neu` | `#b8b1a1` pasir | `#6f6a5f` | Netral |

Status (selalu dengan ikon + label, jangan warna saja): `--good` `--warning` `--serious` `--critical`.
Merah–hijau sengaja tidak dipakai untuk positif/negatif karena sulit dibedakan pengguna buta warna.

### Tipografi
- **Satu font: Plus Jakarta Sans** (400–800) untuk semua teks. Bersih, dibuat untuk layar, angka tabular (`.num`).
- Website memakai Cormorant Garamond + Instrument Sans; dashboard sengaja tidak menyamakan agar lebih mudah dibaca.

| Elemen | Ukuran / tebal |
|---|---|
| Judul halaman `h1` | 24px · 800 · letter-spacing −0.02em |
| Judul kartu `h2` | 14–15px · 700 |
| Teks | 14px · 400 · line-height 1.5 |
| Label kecil (KPI, grup menu) | 10.5–11px · 700 · huruf kapital · spasi .06em |
| Angka KPI | 30px · 800 · tabular |

### Bentuk
- Radius: kartu `--r` 16px, input `--r-sm` 10px, **tombol berbentuk pil** (999px), seperti website.
- Bayangan sangat tipis (`--shadow`); bayangan tebal hanya untuk elemen melayang (`--shadow-pop`).

## Prinsip
1. **Sedikit teks, hierarki lewat warna dan ketebalan.** Deskripsi halaman taruh di ikon ⓘ (`.info` + `data-tip`), bukan paragraf.
2. **Satu tombol utama** (`.btn.primary`) per area; sisanya `.btn` atau `.btn.ghost`.
3. **Highlight** dengan `--accent-soft` / `--accent-tint`, bukan warna baru.
4. **AI selalu ditandai**: `.ai-card` + `.ai-badge` dan catatan sumber (`.ai-note`).
5. Grafik: satu sumbu, legenda + label langsung, tooltip, dan pilihan tampilan tabel.

## Komponen utama (lihat `preview.html` untuk contoh lengkap)

| Kelas | Fungsi |
|---|---|
| `.btn` `.btn.primary` `.btn.ghost` `.btn.sm` `.btn.icon` `.btn.danger` | Tombol |
| `.input` `.select` `textarea.input` `.field` + `label` `.help` | Form |
| `.seg` + `button[aria-pressed]` | Pilihan bersebelahan |
| `.tabs` + `button[aria-selected]` | Tab |
| `.chip[aria-pressed]` | Filter chip |
| `.switch` | Toggle |
| `.card` `.card-head` `.card-body` `.card-foot` | Kartu |
| `.kpi` (`.label` `.value` `.delta` + `.up`/`.down`) | Angka utama |
| `.pill` `.pill.plain` `.dot` | Label kecil |
| `.sev.critical/.serious/.warning/.good` | Status dengan ikon |
| `table.t` | Tabel |
| `.attn` | Daftar “perlu ditangani” |
| `.ai-card` `.ai-badge` `.ai-list` `.ai-note` `.ai-inline` | Blok AI |
| `.score-chip` | Skor 0–10 dengan bar |
| `.drawer` `.scrim` `.toast` `.palette` | Panel samping, overlay, notifikasi, pencarian |
| `.grid.g2/.g3/.g4/.g-main` `.row` `.stack` `.spacer` | Tata letak |
| `.empty` `.skeleton` | Kosong / memuat |

Kelas khusus dashboard (`.inbox`, `.m-item`, `.cal`, `.studio`, `.mfilters`, dll.) ikut disertakan; abaikan jika tidak perlu.
