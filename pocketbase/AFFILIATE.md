# Affiliate Wedez

Satu akun `users` dapat mempunyai undangan, keanggotaan affiliate, atau keduanya.
Pendaftaran akun hanya membuat `users`. Setelah login dan verifikasi, pengguna yang
belum memilih tujuan diarahkan ke `/start`. Pilihan Undangan membuat undangan gratis,
sedangkan pilihan Affiliate membuka area affiliate untuk bergabung dan langsung aktif.
`users.home_area` menyimpan tujuan login berikutnya; pilihan diperbarui saat pengguna
beralih area lewat menu akun. Formulir registrasi Undangan dan Affiliate memakai akun
`users` yang sama; asal formulir tidak disimpan karena pilihan dibuat di `/start`.

## Halaman

- `/register` dan `/login`: autentikasi `users` bersama; tujuan masuk dipilih di `/start`.
- `/affiliate/dashboard`: aktivasi keanggotaan, kode kupon, dan ringkasan komisi.
- `/affiliate/commissions`: riwayat komisi, 20 baris per halaman.
- `/affiliate/payouts`: pengajuan dan riwayat pencairan.
- `/affiliate/settings`: rekening bank.
- `/start`: pilihan tujuan login dan pembuatan undangan secara eksplisit; akun affiliate
  tidak otomatis diprovisikan.

Area affiliate menggunakan layout sendiri. Pengguna yang memiliki undangan dapat beralih
melalui menu akun; menu akun pada area undangan juga menyediakan akses affiliate.

## Aturan program

- Kode unik enam karakter, disimpan sebagai huruf kapital; backend mengabaikan kapitalisasi input.
- Setelah email terverifikasi, pengguna dapat bergabung dan langsung mendapat keanggotaan aktif.
  Kupon dapat langsung digunakan tanpa persetujuan admin.
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
status `requested/processing/paid/rejected/failed`, referensi transfer, gambar bukti transfer,
tanggal pembayaran, dan catatan. `transfer_proof` merupakan satu file terlindungi (JPG,
PNG, atau WebP, maksimal 5 MB); akses memerlukan file token dan izin melihat payout.
Permintaan yang ditolak/gagal tetap menyimpan daftar komisi untuk audit.
Komisi tersebut boleh masuk permintaan baru setelah reservasinya dilepas.

`payments` menyimpan snapshot affiliate, kode, harga asli, persentase dan nominal diskon,
dasar komisi `after_discount`, persentase dan nominal komisi. `amount` tetap nominal
yang dikirim ke Duitku. Harga pembayaran lama diisi dari nominal aslinya tanpa atribusi
affiliate secara retroaktif. `checkout_lock` mempunyai unique index untuk reservasi invoice.

Saldo dihitung dari ledger, bukan dari field saldo yang dapat diedit. Semua penulisan dari
pengguna melalui custom endpoint; API collection hanya memberikan pembacaan milik sendiri.
Data pembayaran/pengantin tidak dibuka kepada affiliator.

## Operasional dashboard admin

Gunakan menu **Pencairan** di dashboard admin. Data disimpan otomatis ke PocketBase;
tidak perlu mengubah record secara manual. Menu **Tandai dibayar** meminta referensi
dan gambar bukti transfer, menampilkan pratinjau, lalu menyimpan keduanya bersama
status. Bukti tersimpan dapat dibuka melalui **Lihat bukti**.

Jika memakai PocketBase Admin langsung, gunakan alur yang sama:

1. Keanggotaan baru langsung `active`; dashboard admin tidak menyediakan persetujuan,
   penolakan pendaftaran, atau filter antrean pendaftar. Menu Afiliasi hanya menyediakan
   filter `active`/`suspended` dan kontrol penangguhan serta aktivasi kembali akun yang
   ditangguhkan. Record lama `pending`/`rejected` tetap dapat dilihat tanpa tombol
   persetujuan, dengan label **Belum aktif**/**Dinonaktifkan**. Pemilik dan kode tidak
   dapat diubah. `suspended`
   menghentikan penggunaan kupon baru dan pengajuan pencairan; pembayaran yang sudah
   mempunyai snapshot tetap direkonsiliasi. Pendaftaran ulang tidak membuka kembali akun
   yang ditolak atau ditangguhkan.
2. Buka `affiliate_payouts` dengan status `requested`. Periksa total dan rekening snapshot.
3. Ubah menjadi `processing` sebelum melakukan transfer manual, agar operator lain tahu
   pengajuan sedang ditangani.
4. Setelah transfer dipastikan berhasil, isi `transfer_reference`, unggah `transfer_proof`,
   dan ubah menjadi `paid` dalam penyimpanan yang sama. Hook memvalidasi file, memperbarui
   semua komisi secara atomik, dan mengisi `paid_at`. Bukti yang sudah tersimpan tidak
   dapat diganti atau dihapus. Pencairan lama tanpa bukti tetap dipertahankan.
5. Jika belum diproses dan perlu ditolak, ubah `requested` → `rejected` disertai `note`.
   Jika transfer dipastikan gagal, ubah `processing` → `failed` disertai `note`.
   Kedua transisi mengembalikan komisi ke `available`.
6. Jika hasil transfer belum pasti, biarkan `processing` sampai rekonsiliasi selesai.
   Jangan melepas saldo atau mengulang transfer hanya karena koneksi terputus.

Superuser boleh menghapus record apa pun melalui PocketBase Admin, termasuk `affiliates`,
`payments`, `affiliate_commissions`, `affiliate_payouts`, dan undangan yang memiliki riwayat
pembayaran. Hak ini juga berlaku untuk bulk delete. Pengguna biasa dan request anonim
tetap tidak boleh menghapus data keuangan; aturan akses collection tidak dibuka.

Relasi wajib bawaan PocketBase tetap berlaku. Jika sebuah payment masih dirujuk komisi,
hapus record payout yang merujuk komisi tersebut (bila diperlukan), lalu komisinya,
baru payment atau affiliate-nya. Tidak ada cascade baru yang otomatis menghapus seluruh
komisi/payout ketika satu affiliate dipilih. Relasi opsional tetap dibersihkan oleh PocketBase.

Penghapusan oleh superuser bersifat permanen dan mengikuti pembersihan relasi/file bawaan
PocketBase, bukan alur rekonsiliasi pembayaran. Backup sebelum menghapus; penghapusan
komisi/payout dapat mengubah saldo dan membuat riwayat atau total pencairan tidak konsisten.
Alur hapus akun pengguna tetap mempertahankan riwayat keuangan dan menolak saldo/pencairan
yang belum selesai. Jangan membuat komisi/payout secara manual. Hook update Admin menjaga
transisi dan field snapshot. Untuk refund sebelum pencairan, admin dapat mengubah komisi
`available` → `void` dengan `void_reason`. Jika masih direservasi, selesaikan pembatalan
pencairan terlebih dahulu. Refund setelah komisi dibayar memerlukan rekonsiliasi/koreksi
terpisah; jangan mengubah riwayat `paid` menjadi `void`.

## Pemasangan dan batas verifikasi

Deploy frontend bersama `pb_hooks` dan seluruh migration, termasuk
`1791936000_add_affiliate_transfer_proof.js` untuk field bukti transfer dan
`1792627200_auto_activate_affiliates.js` untuk mengaktifkan pendaftar lama yang masih
`pending` dan emailnya telah terverifikasi. Status `rejected` dan `suspended` tidak diubah.
Pendaftar lama yang baru memverifikasi email setelah migrasi dapat memakai tombol
**Aktifkan affiliate** tanpa persetujuan admin.
Migration `1790985600_add_account_home.js` mengisi `home_area` untuk akun lama yang
sudah punya undangan atau keanggotaan affiliate; akun baru memilih sendiri setelah login.
Migration `1791072000_remove_signup_intent.js` menghapus `signup_intent` beserta nilai
lamanya karena tidak dipakai dalam alur aplikasi.
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

Untuk menguji unggahan bukti transfer dari dashboard admin, gunakan fixture yang sama:

```sh
bun scripts/test-admin-payout-browser.mjs
```

Script ini menjalankan admin terpisah di port 5195, membuat komisi melalui gateway
tiruan, lalu memeriksa validasi gambar, pratinjau, pembatalan, penyimpanan, dan akses
bukti di desktop/ponsel. PocketBase development pada port 8090 tidak digunakan.

Script browser membutuhkan instalasi Playwright yang sudah tersedia. `PLAYWRIGHT_MODULE`
dapat menunjuk modul tersebut dan `PLAYWRIGHT_CHROMIUM_EXECUTABLE` dapat menunjuk Chromium
yang sudah terpasang, tanpa menambahkan dependency aplikasi. Semua akun uji memakai domain
`example.test`. Hentikan fixture dengan Ctrl+C setelah selesai.
