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

## Deployment VPS dengan Caddy

Production menggunakan Caddy untuk dua hasil build statis dan systemd untuk PocketBase. Jalankan
dari root repository:

```sh
bun run deploy
```

Perintah tersebut menjalankan pemeriksaan dan build lokal, membuka satu koneksi SSH ke
`alam@onlytest.my.id`, mengunggah artefak ke staging user, lalu menjalankan satu tahap `sudo` untuk
membuat release atomik, membackup PocketBase, dan mengaktifkan service. Password SSH dan sudo
diminta secara interaktif dan tidak disimpan.

Pada setup pertama, perintah juga meminta Cloudflare API Token secara tersembunyi. Gunakan token
yang dibatasi ke zona `onlytest.my.id` dengan izin `Zone:Read` dan `DNS:Edit`; jangan gunakan Global
API Key. Token disimpan hanya di `/etc/caddy/cloudflare.env` pada VPS.

Lokasi production:

- web: `/var/www/wedez/web`;
- undangan: `/var/www/wedez/invitation`;
- binary dan release PocketBase: `/opt/wedez/pocketbase`;
- data PocketBase: `/var/lib/wedez/pocketbase/pb_data`;
- environment PocketBase: `/etc/wedez/pocketbase.env`;
- backup PocketBase: `/var/backups/wedez/pocketbase`;
- unit service: `/etc/systemd/system/wedez-pocketbase.service`.

`pocketbase/pb_data` lokal tidak pernah dikirim oleh script deploy. Environment berikut dapat
diganti jika target server berubah:

```sh
DEPLOY_TARGET=alam@example.com DEPLOY_PORT=22 bun run deploy
```

## Deployment Dokploy

Buat satu Docker Compose application dan pilih `./compose.yml`. Hubungkan domain melalui tab
Domains:

- domain utama ke service `web`, port `80`;
- domain API ke service `pocketbase`, port `8090`.

Routing wildcard undangan tidak dibuat melalui tab Domains karena kolom Host Dokploy tidak
menerima `*`. Service `invitation` sudah memiliki label Traefik untuk meneruskan seluruh host
`{slug}.onlytest.my.id` ke Nginx statis pada port `80`. Buat record DNS wildcard `*` yang mengarah ke VPS dengan
proxy Cloudflare aktif. Format satu tingkat ini dicakup Universal SSL gratis Cloudflare, sehingga
tidak memerlukan Advanced Certificate Manager. Gunakan mode SSL/TLS `Full` agar koneksi Cloudflare
ke router HTTPS Dokploy tetap terenkripsi.

Route lama `/{slug}?rsvp=...` pada aplikasi utama tetap tersedia sebagai redirect kompatibilitas ke
subdomain baru.

`pocketbase-data` adalah named volume dan harus dibackup sebelum upgrade atau migration. Jangan
masukkan `.env`, `pb_data`, atau backup ke Git. Isi `PB_ENCRYPTION_KEY` dengan tepat 32 karakter
melalui Environment Dokploy sebelum deployment pertama.
