# Deployment GitHub Actions ke Dokploy

Dokumen ini mengatur deployment production tanpa build di VPS. GitHub Actions menjalankan check,
lint, dan build tiga image. Image disimpan secara private di GHCR, kemudian Dokploy menarik image
dan menjalankan `compose.yml`.

## Arsitektur

```text
git push main
  -> GitHub Actions
     -> check + lint
     -> build image web, invitation, dan PocketBase
     -> push tag production dan sha-<commit> ke GHCR
     -> POST /api/compose.deploy
  -> Dokploy
     -> pull ketiga image
     -> mempertahankan named volume PocketBase
     -> Traefik meneruskan request ke container
```

Caddy berjalan di dalam container `web` dan `invitation` pada port 80. Traefik milik Dokploy tetap
menjadi reverse proxy publik pada port 80/443 dan menangani domain serta TLS.

Gunakan panduan ini hanya pada VPS dengan instalasi OS baru. Jangan pasang Dokploy pada VPS lama
yang pernah diambil alih melalui SSH.

## 1. Pengaturan repository GitHub

Workflow berada di `.github/workflows/deploy.yml`. Buka **Settings -> Actions -> General** dan
pilih **Workflow permissions -> Read and write permissions** agar GitHub dapat membuat package
GHCR. Workflow sendiri membatasi token tiap job ke
`contents: read` dan `packages: write`.

Tambahkan **Repository variables** berikut melalui **Settings -> Secrets and variables -> Actions**:

| Variable                | Nilai                                                |
| ----------------------- | ---------------------------------------------------- |
| `DOKPLOY_URL`           | URL HTTPS panel, misalnya `https://dokploy.wedez.id` |
| `DOKPLOY_COMPOSE_ID`    | ID Docker Compose Wedez dari Dokploy                 |
| `PUBLIC_POCKETBASE_URL` | `https://api.wedez.id`                               |
| `PUBLIC_WEDDING_URL`    | `https://wedez.id`                                   |
| `PUBLIC_INVITATION_URL` | `https://wedez.id`                                   |
| `WEB_HEALTH_URL`        | `https://wedez.id`                                   |
| `INVITATION_HEALTH_URL` | `https://deploy-health.wedez.id`                     |
| `POCKETBASE_HEALTH_URL` | `https://api.wedez.id/api/health`                    |

Tiga variable `PUBLIC_*` dan tiga health URL sudah mempunyai default untuk domain saat ini, tetapi
sebaiknya tetap dibuat agar perubahan domain terlihat jelas di pengaturan repository. Jika variable
tersebut sudah ada dengan domain lama, perbarui nilainya karena variable akan mengesampingkan default
workflow. Sesuaikan juga `DOKPLOY_URL` bila alamat panel berubah.

Tambahkan satu **Repository secret**:

| Secret            | Isi                                     |
| ----------------- | --------------------------------------- |
| `DOKPLOY_API_KEY` | API key yang dibuat dari profil Dokploy |

Jangan menyimpan API key Dokploy, token GHCR, Duitku, atau `PB_ENCRYPTION_KEY` sebagai variable
publik atau di repository.

## 2. Registry GHCR di Dokploy

GitHub Actions menerbitkan tiga package berikut:

```text
ghcr.io/alam1906/wedding-web:production
ghcr.io/alam1906/wedding-invitation:production
ghcr.io/alam1906/wedding-pocketbase:production
```

Di GitHub buat Personal Access Token khusus deployment dengan akses minimum `read:packages`. Akun
pemilik token harus mempunyai akses ke repository/package private tersebut. Di Dokploy buka
**Settings -> Registry -> Add Registry**, kemudian isi:

```text
Name: Wedez GHCR
Registry URL: ghcr.io
Username: alam1906
Password: <PAT read:packages>
```

Tekan **Test** sebelum menyimpan. Token ini hanya berada di Dokploy dan hanya digunakan untuk pull.
GitHub Actions melakukan push memakai `GITHUB_TOKEN`, sehingga tidak membutuhkan PAT tambahan.

## 3. Membuat Docker Compose di Dokploy

1. Buat Project dan Environment `production`.
2. Tambahkan service **Docker Compose** dengan source GitHub.
3. Pilih repository `alam1906/wedding`, branch `main`, dan Compose path `./compose.yml`.
4. Pilih tipe `docker-compose`, bukan Stack.
5. Nonaktifkan **Auto Deploy** karena deployment dipanggil oleh GitHub Actions setelah semua image
   selesai dipush. Ini mencegah deployment ganda atau Dokploy menarik image lama.
6. Jangan menambahkan perintah build. `compose.yml` hanya berisi `image:` dan `pull_policy: always`.

Workflow saat ini menghasilkan image `linux/amd64`, sesuai VPS Wedez yang telah diperiksa. Jika VPS
baru menggunakan ARM64, ubah `platforms` pada workflow menjadi `linux/arm64` sebelum push pertama.

Salin nilai dari `.env.example` ke tab **Environment** Dokploy, lalu ganti semua placeholder. Untuk
membuat encryption key baru yang panjangnya tepat 32 karakter, jalankan pada komputer tepercaya:

```sh
openssl rand -hex 16
```

Simpan hasilnya di password manager. Jangan mengganti `PB_ENCRYPTION_KEY` setelah PocketBase mulai
menyimpan settings terenkripsi.

Environment runtime minimum:

```text
PB_ENCRYPTION_KEY
WEDEZ_APP_URL
WEDEZ_API_URL
WEDEZ_PRO_PRICE
DUITKU_ENV
DUITKU_MERCHANT_CODE
DUITKU_API_KEY
DUITKU_API_URL
DUITKU_CALLBACK_URL
DUITKU_RETURN_URL
```

`PUBLIC_*` bukan runtime environment Dokploy. Nilainya dipasang ketika image statis dibangun oleh
GitHub Actions. Perbarui `WEDEZ_APP_URL`, `WEDEZ_API_URL`, `DUITKU_CALLBACK_URL`, dan
`DUITKU_RETURN_URL` di Environment Dokploy jika masih menunjuk domain lama.

## 4. Domain dan TLS

Tambahkan dua domain biasa melalui tab **Domains** Docker Compose:

| Host           | Service      | Container port | HTTPS |
| -------------- | ------------ | -------------: | ----- |
| `wedez.id`     | `web`        |             80 | aktif |
| `api.wedez.id` | `pocketbase` |           8090 | aktif |

Undangan menggunakan wildcard `{slug}.wedez.id`. Karena kolom Host Dokploy tidak menerima
`*`, routing wildcard sudah didefinisikan sebagai label Traefik pada service `invitation` dengan
priority rendah. Route domain `api` yang dibuat Dokploy akan menang karena
lebih spesifik.

Di Cloudflare buat record A berikut menuju IP VPS baru:

```text
@    -> IP VPS
api  -> IP VPS
*    -> IP VPS
```

Untuk TLS wildcard tanpa menyimpan Cloudflare API token di VPS, buat Cloudflare Origin Certificate
yang mencakup `wedez.id` dan `*.wedez.id`, lalu impor certificate dan private key ke
menu **Certificates** Dokploy. Gunakan Cloudflare SSL/TLS mode **Full (Strict)** dan aktifkan proxy
Cloudflare pada ketiga record. Setelah certificate diimpor, aktifkan HTTPS pada dua domain Dokploy
di atas dan pilih certificate provider **None** agar Traefik menggunakan certificate yang diimpor.

Pastikan `https://deploy-health.wedez.id` sudah mencapai service invitation sebelum
menjalankan workflow production pertama.

Di pengaturan PocketBase yang sudah berjalan, ubah Application URL menjadi `https://api.wedez.id`
agar tautan email yang memakai `{APP_URL}` mengarah ke domain API baru. Perubahan environment
container tidak otomatis mengubah pengaturan yang sudah tersimpan di database PocketBase.

## 5. API key dan Compose ID

Buat API key pada profil Dokploy dan simpan hanya sebagai GitHub secret `DOKPLOY_API_KEY`.
`DOKPLOY_COMPOSE_ID` dapat dilihat dari halaman Compose atau dicari melalui API Dokploy dengan API
key tersebut. Simpan ID sebagai GitHub variable, bukan sebagai secret.

Workflow memanggil:

```text
POST /api/compose.deploy
freshVolumes: false
```

Nilai `freshVolumes: false` wajib dipertahankan agar named volume `pocketbase-data` tidak dibuat
ulang saat deployment.

## 6. Deployment

Setiap push ke branch `main` otomatis menjalankan seluruh alur. Pull request hanya menjalankan
check, lint, dan build image tanpa push atau deployment.

Untuk menjalankan ulang commit terbaru di `main` tanpa membuat commit baru:

```sh
bun run deploy
```

Perintah tersebut membutuhkan GitHub CLI (`gh`) yang sudah login. Ia hanya memicu workflow pada
remote `main`; perubahan lokal yang belum dipush tidak ikut deployment.

Setelah API deploy dipanggil, workflow menunggu maksimal enam menit dan memverifikasi:

- web dan invitation menjalankan SHA commit yang baru;
- endpoint health PocketBase mengembalikan HTTP 2xx.

## 7. Data dan rollback

`pocketbase-data` adalah named volume. Aktifkan Volume Backup Dokploy ke storage S3-compatible dan
uji proses restore. Image baru tidak pernah berisi `pb_data`.

Setiap image mempunyai dua tag:

```text
production
sha-<full-commit-sha>
```

Untuk rollback, ubah sementara `WEDEZ_WEB_IMAGE`, `WEDEZ_INVITATION_IMAGE`, dan
`WEDEZ_POCKETBASE_IMAGE` pada Environment Dokploy ke tag SHA yang sama, lalu redeploy dengan
`freshVolumes: false`. Kembalikan ketiganya ke tag `production` sebelum deployment normal berikutnya.

Jangan rollback migration PocketBase dengan mengganti image tanpa memeriksa kompatibilitas schema
dan backup volume terlebih dahulu.
