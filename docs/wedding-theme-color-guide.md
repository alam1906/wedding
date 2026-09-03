# Panduan Warna Tema Website Undangan Digital

Dokumen ini menjadi referensi desain dan implementasi warna untuk seluruh tema website undangan digital.

## Struktur Tema

Tersedia empat gaya utama, masing-masing memiliki tiga varian:

- `minimalist-1`, `minimalist-2`, `minimalist-3`
- `neobrutalism-1`, `neobrutalism-2`, `neobrutalism-3`
- `playful-1`, `playful-2`, `playful-3`
- `3d-design-1`, `3d-design-2`, `3d-design-3`

Arti nomor varian dibuat konsisten pada seluruh gaya:

| Nomor | Karakter      | Kesan                               |
| ----- | ------------- | ----------------------------------- |
| `1`   | Romantic Warm | Lembut, hangat, intim, dan romantis |
| `2`   | Elegant       | Mewah, formal, matang, dan berkelas |
| `3`   | Fresh         | Segar, modern, ringan, dan ceria    |

## Peran Warna

Setiap tema wajib memiliki lima token warna utama:

| Token        | Penggunaan                                                    |
| ------------ | ------------------------------------------------------------- |
| `background` | Latar belakang halaman                                        |
| `surface`    | Card, modal, formulir RSVP, dan panel informasi               |
| `text`       | Judul, paragraf, label, dan informasi utama                   |
| `primary`    | Tombol utama, nama mempelai, tautan aktif, dan elemen penting |
| `accent`     | Ornamen, ikon, badge, garis dekoratif, dan highlight          |

## Palet Seluruh Tema

| Tema             | Background | Surface   | Text      | Primary   | Accent    |
| ---------------- | ---------- | --------- | --------- | --------- | --------- |
| `minimalist-1`   | `#FAF7F2`  | `#FFFFFF` | `#332D2A` | `#B77878` | `#D8B4A0` |
| `minimalist-2`   | `#F4F1EA`  | `#FFFFFF` | `#252722` | `#66705A` | `#B49A68` |
| `minimalist-3`   | `#F3F8F7`  | `#FFFFFF` | `#263332` | `#4F7C78` | `#A8C9C5` |
| `neobrutalism-1` | `#FFF1E6`  | `#FFFFFF` | `#181818` | `#FF6B6B` | `#FFD166` |
| `neobrutalism-2` | `#FFF8CC`  | `#FFFFFF` | `#111111` | `#5B5FEF` | `#FF8FAB` |
| `neobrutalism-3` | `#DFF7FF`  | `#FFFFFF` | `#151515` | `#00B894` | `#FF9F1C` |
| `playful-1`      | `#FFF0F5`  | `#FFFFFF` | `#4A3041` | `#F472B6` | `#FBBF24` |
| `playful-2`      | `#F2ECFF`  | `#FFFFFF` | `#352B4A` | `#8B5CF6` | `#22D3EE` |
| `playful-3`      | `#E9FFF6`  | `#FFFFFF` | `#234037` | `#34D399` | `#FB7185` |
| `3d-design-1`    | `#FFF1F4`  | `#FFFFFF` | `#382B36` | `#E879A9` | `#FFB86B` |
| `3d-design-2`    | `#141225`  | `#24203D` | `#F8F7FF` | `#8B5CF6` | `#38BDF8` |
| `3d-design-3`    | `#EAF7FF`  | `#FFFFFF` | `#24344A` | `#4C8DFF` | `#43D3B5` |

## Aturan Visual per Gaya

### Minimalist

- Gunakan ruang kosong yang luas dan dekorasi secukupnya.
- `primary` digunakan dengan hemat untuk tombol utama dan nama mempelai.
- `accent` digunakan pada garis tipis, ikon, bunga, atau detail kecil.
- Card dan panel berbasis `surface` tidak menggunakan border hitam atau border gelap.
- Gunakan radius kecil setara `rounded-sm` (`border-radius: 0.25rem`) pada card dan panel.
- Pisahkan card dari latar melalui ruang kosong atau shadow yang sangat halus dari tint warna `text`.
- Hindari gradient kuat, border dekoratif, dan terlalu banyak warna dalam satu section.

```css
.card {
	border: 0;
	border-radius: 0.25rem;
	color: var(--color-text);
	background-color: var(--color-surface);
	box-shadow: 0 0.75rem 2rem color-mix(in srgb, var(--color-text) 8%, transparent);
}
```

### Neobrutalism

- Gunakan warna solid dengan kontras tinggi.
- Semua card dan tombol menggunakan border gelap yang tegas.
- Gunakan hard shadow tanpa blur.
- Jangan gunakan glassmorphism atau shadow lembut.

```css
border: 3px solid #111111;
box-shadow: 6px 6px 0 #111111;
```

### Playful

- Gunakan bentuk bulat, organik, dan ilustrasi yang menyenangkan.
- `primary` dan `accent` boleh tampil bersamaan, tetapi teks tetap menggunakan warna `text`.
- Warna dekoratif tambahan harus berasal dari variasi terang atau gelap palet utama.
- Hindari penggunaan terlalu banyak warna dengan saturasi tinggi dalam satu area.

### 3D Design

- Gunakan `primary` dan `accent` untuk objek 3D, lighting, dan gradient.
- Card tetap menggunakan `surface` agar konten mudah dibaca.
- Gunakan shadow lembut dan highlight untuk membangun kedalaman.
- Untuk `3d-design-2`, pertahankan latar gelap dan teks terang.

```css
background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
```

## Contoh CSS Variables

Contoh berikut menggunakan palet `minimalist-1`:

```css
:root {
	--color-background: #faf7f2;
	--color-surface: #ffffff;
	--color-text: #332d2a;
	--color-primary: #b77878;
	--color-accent: #d8b4a0;
}

body {
	color: var(--color-text);
	background-color: var(--color-background);
}

.card {
	background-color: var(--color-surface);
}

.button-primary {
	color: #ffffff;
	background-color: var(--color-primary);
}
```

## Contoh Struktur TypeScript

```ts
export type ThemeColors = {
	background: string;
	surface: string;
	text: string;
	primary: string;
	accent: string;
};

export const themeColors: Record<string, ThemeColors> = {
	'minimalist-1': {
		background: '#FAF7F2',
		surface: '#FFFFFF',
		text: '#332D2A',
		primary: '#B77878',
		accent: '#D8B4A0'
	},
	'minimalist-2': {
		background: '#F4F1EA',
		surface: '#FFFFFF',
		text: '#252722',
		primary: '#66705A',
		accent: '#B49A68'
	},
	'minimalist-3': {
		background: '#F3F8F7',
		surface: '#FFFFFF',
		text: '#263332',
		primary: '#4F7C78',
		accent: '#A8C9C5'
	}
};
```

Objek tersebut dapat diteruskan untuk seluruh tema menggunakan nilai dari tabel palet.

## Aturan Aksesibilitas

- Gunakan `text` untuk semua teks panjang; jangan gunakan `accent` sebagai warna paragraf.
- Teks pada tombol harus memiliki kontras yang cukup terhadap warna tombol.
- Targetkan rasio kontras minimal `4.5:1` untuk teks biasa dan `3:1` untuk teks besar.
- Jika warna `primary` terlalu terang untuk tombol, gunakan versi yang lebih gelap atau gunakan warna teks gelap.
- Jangan menyampaikan informasi hanya melalui warna; sertakan teks, ikon, atau bentuk.

## Instruksi untuk Codex

Saat membuat atau mengubah tema undangan:

1. Gunakan nama dan palet tema persis seperti tabel di atas.
2. Gunakan token semantik, bukan menulis warna hex berulang kali di komponen.
3. Pertahankan arti varian: `1` romantis, `2` elegan, dan `3` segar.
4. Terapkan karakter visual gaya tanpa mengubah identitas warnanya.
5. Periksa keterbacaan teks dan tombol sebelum menyelesaikan implementasi.
6. Jangan menambahkan warna baru kecuali berupa variasi opacity, tint, atau shade dari palet aktif.
7. Pastikan setiap section terasa konsisten, tetapi tetap memiliki hierarki antara background, surface, primary, dan accent.
