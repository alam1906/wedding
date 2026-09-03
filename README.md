# Wedez

Frontend undangan pernikahan digital berbasis SvelteKit 5, TypeScript, dan Tailwind CSS 4.
Proyek saat ini memakai data mock; integrasi PocketBase akan menjadi sumber data dan autentikasi
untuk MVP.

## Prasyarat

- [Bun](https://bun.sh/) versi terbaru

## Menjalankan proyek

```sh
bun install
bun run dev
```

Buka URL yang ditampilkan Vite di terminal.

## Pemeriksaan kualitas

```sh
bun run check
bun run lint
bun run build
```

## Struktur utama

- `src/routes/(auth)`: login, register, dan pembuatan domain.
- `src/routes/(public)/[slug]`: halaman undangan publik.
- `src/routes/user`: dashboard dan pengelolaan undangan.
- `src/lib/components`: komponen reusable lintas route.
- `static/images`: aset gambar publik.

Detail kebutuhan produk, arsitektur static-site, dan rancangan PocketBase tersedia di
[`wedez-prd.md`](./wedez-prd.md).
