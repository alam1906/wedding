# Affiliate Wedez

Satu akun `users` dapat mempunyai undangan, keanggotaan affiliate, atau keduanya.
Pendaftaran akun hanya membuat `users`. Setelah login dan verifikasi, pengguna yang
belum memilih tujuan diarahkan ke `/start`. Pilihan Undangan membuat undangan gratis,
sedangkan pilihan Affiliate membuka area affiliate untuk mengajukan keanggotaan.
`users.home_area` menyimpan tujuan login berikutnya; pilihan diperbarui saat pengguna
beralih area lewat menu akun. Formulir registrasi Undangan dan Affiliate memakai akun
`users` yang sama; asal formulir tidak disimpan karena pilihan dibuat di `/start`.

## Halaman

- `/register` dan `/login`: autentikasi `users` bersama; tujuan masuk dipilih di `/start`.
- `/affiliate/dashboard`: pengajuan keanggotaan, kode kupon, dan ringkasan komisi.
- `/affiliate/commissions`: riwayat komisi, 20 baris per halaman.
- `/affiliate/payouts`: pengajuan dan riwayat pencairan.
- `/affiliate/settings`: rekening bank.
- `/start`: pilihan tujuan login dan pembuatan undangan secara eksplisit; akun affiliate
  tidak otomatis diprovisikan.

Area affiliate menggunakan layout sendiri. Pengguna yang memiliki undangan dapat beralih
melalui menu akun; menu akun pada area undangan juga menyediakan akses affiliate.

## Aturan program

- Kode unik enam karakter, disimpan sebagai huruf kapital; backend mengabaikan kapitalisasi input.
- Admin menyetujui keanggotaan sebelum kupon bisa digunakan. Email harus terverifikasi.
- Pengantin mendapat diskon 10% dari harga backend `WEDEZ_PRO_PRICE`.
- Affiliator mendapat 20% dari nominal setelah diskon, sebelum biaya gateway.
- Nominal dibulatkan ke bawah ke rupiah penuh. Contoh: 50.000 → 45.000 → komisi 9.000.
- Tidak boleh memakai kupon milik akun sendiri. Satu upgrade seumur hidup hanya menghasilkan satu komisi.
- Komisi tersedia setelah pembayaran Duitku terverifikasi; belum ada masa tunggu tambahan.
- Minimum pengajuan Rp50.000. Satu permintaan aktif per affiliate, maksimum 10.000 komisi per permintaan.
- Pencairan manual oleh admin. Sistem tidak mengirim transfer bank otomatis.

## Collection

`affiliates` mempunyai relasi unik `user`, kode unik, status `pending/active/rejected/suspended`,
dan rekening. `affiliate_commissions` mempunyai relasi unik `payment`, pemilik affiliate,
nominal, status `available/reserved/paid/void`, tanggal pembayaran, dan alasan pembatalan.

`affiliate_payouts` menyimpan daftar komisi, total, salinan rekening pada saat pengajuan,
status `requested/processing/paid/rejected/failed`, referensi transfer, tanggal pembayaran,
dan catatan. Permintaan yang ditolak/gagal tetap menyimpan daftar komisi untuk audit.
Komisi tersebut boleh masuk permintaan baru setelah reservasinya dilepas.

`payments` menyimpan snapshot affiliate, kode, harga asli, persentase dan nominal diskon,
dasar komisi `after_discount`, persentase dan nominal komisi. `amount` tetap nominal
yang dikirim ke Duitku. Harga pembayaran lama diisi dari nominal aslinya tanpa atribusi
affiliate secara retroaktif. `checkout_lock` mempunyai unique index untuk reservasi invoice.

Saldo dihitung dari ledger, bukan dari field saldo yang dapat diedit. Semua penulisan dari
pengguna melalui custom endpoint; API collection hanya memberikan pembacaan milik sendiri.
Data pembayaran/pengantin tidak dibuka kepada affiliator.

## Operasional PocketBase Admin

1. Buka `affiliates`, tinjau record `pending`, lalu ubah `status` menjadi `active` atau `rejected`.
   Pemilik dan kode tidak dapat diubah. `suspended` menghentikan penggunaan kupon baru dan
   pengajuan pencairan; pembayaran yang sudah mempunyai snapshot tetap direkonsiliasi.
2. Buka `affiliate_payouts` dengan status `requested`. Periksa total dan rekening snapshot.
3. Ubah menjadi `processing` sebelum melakukan transfer manual, agar operator lain tahu
   pengajuan sedang ditangani.
4. Setelah transfer dipastikan berhasil, isi `transfer_reference` dan ubah menjadi `paid`
   dalam penyimpanan yang sama. Hook memperbarui semua komisi secara atomik dan mengisi `paid_at`.
5. Jika belum diproses dan perlu ditolak, ubah `requested` → `rejected` disertai `note`.
   Jika transfer dipastikan gagal, ubah `processing` → `failed` disertai `note`.
   Kedua transisi mengembalikan komisi ke `available`.
6. Jika hasil transfer belum pasti, biarkan `processing` sampai rekonsiliasi selesai.
   Jangan melepas saldo atau mengulang transfer hanya karena koneksi terputus.

Jangan membuat/menghapus komisi atau payout secara manual. Hook request Admin juga menjaga
transisi dan field snapshot. Untuk refund sebelum pencairan, admin dapat mengubah komisi
`available` → `void` dengan `void_reason`. Jika masih direservasi, selesaikan pembatalan
pencairan terlebih dahulu. Refund setelah komisi dibayar memerlukan rekonsiliasi/koreksi
terpisah; jangan mengubah riwayat `paid` menjadi `void`.

## Pemasangan dan batas verifikasi

Deploy frontend bersama `pb_hooks` dan migration `1790899200_add_affiliates.js`,
`1790985600_add_account_home.js`, serta `1791072000_remove_signup_intent.js`.
Migration kedua mengisi `home_area` untuk akun lama yang sudah punya undangan atau
keanggotaan affiliate; akun baru memilih sendiri setelah login. Migration ketiga
menghapus `signup_intent` beserta nilai lamanya karena tidak dipakai dalam alur aplikasi.
PocketBase menjalankan migration saat start. Backup database sebelum pembaruan production.
Migration ini maju saja: ledger tidak dihapus oleh perintah rollback. Gunakan migration
koreksi jika diperlukan.

Migration mengaktifkan rate limiter PocketBase serta menambahkan batas untuk quote,
pembuatan sesi pembayaran, dan pengajuan pencairan. Aturan rate limiter yang sudah ada
dipertahankan. Relasi `payments.wedding` tidak lagi melakukan cascade delete; catatan
keuangan dilindungi dari penghapusan. Penghapusan akun/undangan yang mempunyai riwayat
keuangan memerlukan alur retensi atau anonimisasi terpisah.

Invoice yang masih aktif dengan kupon/nominal berbeda harus diselesaikan atau ditunggu
kedaluwarsa sebelum membuat yang baru. Timeout pembuatan invoice mempertahankan reservasi,
karena gateway mungkin sudah menerima permintaan. Callback dan pengecekan status memakai
fungsi kredit komisi yang sama, dengan pemeriksaan signature/ID/nominal dan unique payment.

Tidak ada perubahan DNS, domain, secret, atau deployment production dalam implementasi lokal.
Ketersediaan SMTP dan transaksi Duitku asli tetap perlu diuji pada environment tujuan.

## Pengujian

Jalankan `bun scripts/test-affiliate.mjs` dari root repository. Script memakai binary
`pocketbase/pocketbase`, database sementara, port 8190, dan server Duitku tiruan. Script
tidak membaca kredensial production, tidak memakai `pocketbase/pb_data`, dan menghentikan
proses PocketBase yang dibuatnya. Data uji disimpan di direktori sementara yang dicetak.

Untuk uji browser, jalankan fixture dengan `WEDEZ_KEEP_TEST_SERVER=1`, lalu frontend:

```sh
WEDEZ_KEEP_TEST_SERVER=1 bun scripts/test-affiliate.mjs
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8190 bun run --cwd apps/web dev -- --host 127.0.0.1 --port 5190
bun scripts/test-affiliate-browser.mjs
```

Script browser membutuhkan instalasi Playwright yang sudah tersedia. `PLAYWRIGHT_MODULE`
dapat menunjuk modul tersebut dan `PLAYWRIGHT_CHROMIUM_EXECUTABLE` dapat menunjuk Chromium
yang sudah terpasang, tanpa menambahkan dependency aplikasi. Semua akun uji memakai domain
`example.test`. Hentikan fixture dengan Ctrl+C setelah selesai.
