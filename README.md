# Wedez

Monorepo Wedez berisi tiga aplikasi SvelteKit dan satu service PocketBase.

## Struktur

- `apps/web`: landing page, autentikasi, dashboard, dan editor pengantin.
- `apps/invitation`: undangan publik berbasis subdomain.
- `apps/admin`: dashboard operasional di `admin.wedez.id`.
- `pocketbase`: Dockerfile, hooks, dan migration PocketBase.
- `compose.yml`: empat service untuk deployment Dokploy.

## Menjalankan secara lokal

Pasang dependency seluruh workspace dari root:

```sh
bun install
```

Jalankan aplikasi utama di `http://localhost:5173`:

```sh
bun run dev:web
```

Jalankan aplikasi undangan di `http://localhost:5174`:

```sh
bun run dev:invitation
```

Jalankan dashboard admin di `http://localhost:5175`:

```sh
bun run dev:admin
```

Dashboard memakai superuser PocketBase yang sama dengan backend Wedez. Sesi admin hanya hidup di
memori tab browser dan hilang saat halaman dimuat ulang. Tidak ada kredensial admin di build frontend.

Alamat undangan development memakai subdomain sesuai slug, misalnya
`http://agushaliem.localhost:5174`. Di production, slug yang sama menjadi
`https://agushaliem.wedez.id`. Domain dasarnya diatur oleh `PUBLIC_INVITATION_URL`:
`http://localhost:5174` pada `.env.dev` dan `https://wedez.id` pada `.env`.
Jangan isi variabel tersebut dengan subdomain yang sudah mengandung slug.

Pada localhost, slug undangan juga dapat diberikan lewat query string:

```text
http://localhost:5174/?slug=yanto-yanti&rsvp=token-tamu
```

Ketiga dev server memakai port tetap, termasuk saat dijalankan bersama dengan `bun run dev:all`.

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

Invoice baru berlaku 10 menit. Nilai ini dikirim lewat parameter `expiryPeriod` saat
PocketBase membuat invoice Duitku POP; tidak diatur melalui dashboard Duitku.

Paket Pro hanya diaktifkan melalui callback Duitku yang signature, merchant code, order ID, dan
nominalnya telah diverifikasi atau melalui hasil API cek transaksi. Parameter pada return URL tidak
digunakan untuk mengubah status pembayaran.

## Pemeriksaan

```sh
bun run check
bun run lint
bun run test
bun run build
```

`bun run test` menjalankan PocketBase nyata dengan database dan data sintetis di direktori
sementara: kontrak/rules/realtime, upgrade schema berisi data, pemulihan/hapus akun, serta
pembayaran dan afiliasi. Gateway dan SMTP tetap lokal; tidak membuka `pocketbase/pb_data`.
Port default 8190, 8193, dan 8197 harus kosong; `WEDEZ_TEST_PORT` dapat menggantinya.
CI menjalankan suite ini sebelum membangun image, menggunakan PocketBase 0.40.1 untuk Linux.

Uji browser tiga aplikasi menggunakan instalasi Playwright/Chromium yang sudah tersedia:

```sh
WEDEZ_KEEP_TEST_SERVER=1 bun run test:quality
# Di terminal lain, gunakan fixture.json pada direktori artefak yang dicetak:
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium \
bun scripts/test-quality-browser.mjs /path/to/wedez-quality-xxx/fixture.json
```

Runner browser menjalankan dan menghentikan ketiga web di port 5196–5198. Hentikan fixture
PocketBase dengan Ctrl+C setelah selesai. Artefak berisi kredensial sintetis, bukan akun asli.
Untuk menguji build statis, build ketiga web dengan URL API/undangan lokal yang sama, lalu
jalankan runner dengan `WEDEZ_TEST_PREVIEW=1`. Build ulang dengan konfigurasi normal sesudahnya.

## Deployment Dokploy

Production dibangun seluruhnya di GitHub Actions. Workflow membuat empat image di GHCR, lalu
memanggil API Dokploy untuk menarik dan menjalankan image tanpa build di VPS. Tiga image statis
menggunakan Caddy di dalam container; Traefik milik Dokploy menangani domain dan HTTPS.

Panduan lengkap repository variables, secret, GHCR, domain wildcard, volume PocketBase, dan
rollback tersedia di [`docs/deployment-dokploy.md`](docs/deployment-dokploy.md).
