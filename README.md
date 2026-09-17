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
http://localhost:5174/?slug=yanto-yanti&rsvp=token-tamu
```

Gunakan port berbeda jika kedua dev server dijalankan bersamaan.

## Pembayaran Duitku

Pembayaran paket Pro menggunakan Duitku POP. Seluruh kredensial hanya boleh tersedia pada service
PocketBase dan tidak boleh menggunakan awalan `PUBLIC_`.

Variabel yang diperlukan:

- `DUITKU_ENV`: `sandbox` atau `production`;
- `DUITKU_MERCHANT_CODE` dan `DUITKU_API_KEY`;
- `DUITKU_API_URL`: host API yang sesuai dengan environment;
- `DUITKU_CALLBACK_URL`: URL HTTPS publik menuju
  `/api/wedez/payments/duitku/callback`;
- `DUITKU_RETURN_URL`: halaman `/upgrade` yang dibuka setelah checkout;
- `DUITKU_EXPIRY_MINUTES`: `5`, `10`, atau `60`.

Paket Pro hanya diaktifkan melalui callback Duitku yang signature, merchant code, order ID, dan
nominalnya telah diverifikasi atau melalui hasil API cek transaksi. Parameter pada return URL tidak
digunakan untuk mengubah status pembayaran.

## Pemeriksaan

```sh
bun run check
bun run lint
bun run build
```

## Deployment Dokploy

Production dibangun seluruhnya di GitHub Actions. Workflow membuat tiga image di GHCR, lalu
memanggil API Dokploy untuk menarik dan menjalankan image tanpa build di VPS. Dua image statis
menggunakan Caddy di dalam container; Traefik milik Dokploy menangani domain dan HTTPS.

Panduan lengkap repository variables, secret, GHCR, domain wildcard, volume PocketBase, dan
rollback tersedia di [`docs/deployment-dokploy.md`](docs/deployment-dokploy.md).
