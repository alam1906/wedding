# Wedez

Monorepo Wedez berisi dua aplikasi SvelteKit dan satu service PocketBase.

## Struktur

- `apps/web`: landing page, autentikasi, dashboard, dan editor pengantin.
- `apps/invitation`: undangan publik berbasis subdomain.
- `pocketbase`: Dockerfile, hooks, dan migration PocketBase.
- `compose.yml`: tiga service untuk deployment Dokploy.

## Menjalankan secara lokal

Pasang dependency seluruh workspace dari root:

```sh
bun install
```

Jalankan aplikasi utama:

```sh
bun run dev:web
```

Jalankan aplikasi undangan:

```sh
bun run dev:invitation
```

Pada localhost, slug undangan dapat diberikan lewat query string:

```text
http://localhost:5173/?slug=yanto-yanti&rsvp=token-tamu
```

Gunakan port berbeda jika kedua dev server dijalankan bersamaan.

## Pemeriksaan

```sh
bun run check
bun run lint
bun run build
```

## Deployment Dokploy

Buat satu Docker Compose application dan pilih `./compose.yml`. Hubungkan domain melalui tab
Domains:

- domain utama ke service `web`, port `80`;
- wildcard domain undangan ke service `invitation`, port `3000`;
- domain API ke service `pocketbase`, port `8090`.

Route lama `/{slug}?rsvp=...` pada aplikasi utama tetap tersedia sebagai redirect kompatibilitas ke
subdomain baru.

`pocketbase-data` adalah named volume dan harus dibackup sebelum upgrade atau migration. Jangan
masukkan `.env`, `pb_data`, atau backup ke Git. Isi `PB_ENCRYPTION_KEY` dengan tepat 32 karakter
melalui Environment Dokploy sebelum deployment pertama.
