# Pembayaran di Wedez

Semua proses diselesaikan di `/payment`: ringkasan paket, kupon, pilihan QRIS / virtual
account, pembayaran, dan status tagihan.
Tidak menggunakan popup, iframe, atau redirect ke
checkout Duitku untuk tagihan baru. Pembayaran tetap dilakukan melalui aplikasi
bank/e-wallet pelanggan. Kartu kredit dan channel yang memerlukan redirect tidak
ditawarkan pada halaman ini.

## Pengaturan merchant

- Gunakan Merchant Code dan API Key proyek **Duitku API** untuk environment yang
  sama (`sandbox` / `production`). Pastikan akses direct API dan channel QRIS/VA
  sudah aktif; hubungi dukungan Duitku jika merchant belum mendapat akses/channel.
- Backend membaca channel dan biaya aktual melalui Get Payment Method. Tidak ada
  daftar bank palsu atau biaya yang hanya ditetapkan di browser.
- Jika menginginkan biaya layanan Rp0 untuk pelanggan, atur biaya ditanggung
  merchant pada portal Duitku. Jika dibebankan kepada pelanggan, biaya ditampilkan
  sebelum pembuatan tagihan. Harga paket dan komisi tetap dihitung tanpa biaya gateway.
- `DUITKU_CALLBACK_URL=https://api.wedez.id/api/wedez/payments/duitku/callback` untuk
  production. URL harus publik, HTTPS, dan menuju backend/database environment yang
  bersangkutan. Sandbox lokal memerlukan staging atau HTTPS tunnel ke PocketBase
  lokal; jangan arahkan callback sandbox ke database production.
- `DUITKU_RETURN_URL=https://wedez.id/payment` (atau
  `http://localhost:5173/payment` untuk sandbox lokal). Return URL bukan bukti
  pembayaran: parameter URL tidak pernah mengaktifkan Pro.
- Semua kredensial hanya berada di environment PocketBase, tidak di `PUBLIC_*` / Vite.
  Tidak perlu plugin browser maupun SDK popup Duitku. Paket `qrcode` hanya mengubah
  `qrString` gateway menjadi gambar secara lokal, tanpa layanan QR pihak ketiga.

Endpoint inquiry dan metode dipilih otomatis dari `DUITKU_ENV`: sandbox.duitku.com
atau passport.duitku.com. `DUITKU_API_URL` lama tetap divalidasi untuk kompatibilitas
konfigurasi, tetapi pembuatan invoice tidak lagi memakai endpoint POP createInvoice.

## Perilaku dan keamanan

- Harga, kupon, channel aktif, dan biaya diperiksa ulang oleh backend. Perubahan
  harga/biaya sejak pemilihan meminta pengguna memuat ulang sebelum membuat tagihan.
- Form kupon dibuka langsung di halaman. Perubahan kupon memuat ulang harga dan
  metode beserta biaya aktual; tombol bayar dinonaktifkan selama validasi dan ketika
  kode yang diketik belum diterapkan. Tombol bayar meminta konfirmasi kupon hanya
  jika belum ada kupon valid. Kupon valid langsung melanjutkan pembuatan tagihan.
- Satu tagihan aktif per wedding, dilindungi transaksi SQLite dan unique checkout lock.
  Kupon/channel tidak dapat diganti selama tagihan aktif.
- QR/VA tersimpan bersama tagihan supaya refresh tidak membuat tagihan baru. Detail
  pembayaran hanya dapat diakses pemilik wedding yang sudah terverifikasi.
- Timeout/respons gateway yang tidak lengkap tetap mempertahankan reservasi: jangan
  menerbitkan invoice lain karena gateway mungkin sudah membuat tagihan pertama.
- Status dipantau saat tab terlihat. Countdown diselaraskan dengan waktu server.
  Status callback/polling diperiksa signature/order/amount; aktivasi Pro dan komisi
  memakai transaksi idempoten yang sama. Status paid tidak dapat diturunkan.
- QR/VA disembunyikan saat waktu habis; status akhir tetap dikonfirmasi backend.
- Setelah Pro terkonfirmasi aktif, halaman menampilkan hitung mundur dan otomatis
  kembali ke dashboard dalam 5 detik. Tombol Lanjut ke dashboard tetap tersedia;
  timer dibersihkan jika pengguna meninggalkan halaman lebih awal.
- Tagihan POP lama tetap direkonsiliasi. Pengguna diminta menunggu kedaluwarsa sebelum
  membuat tagihan baru jika detail QR/VA belum tersedia; tidak otomatis diarahkan keluar.

## Menjalankan dan memverifikasi

Restart PocketBase setelah memperbarui kode agar migration
`1792540800_add_direct_payment_details.js` menambahkan kolom detail pembayaran dan
rate limit. Jangan menimpa atau menghapus database untuk menjalankan migration.
Build frontend web setelah dependency terpasang (`bun install`).

`bun scripts/test-affiliate.mjs` menjalankan PocketBase/SQLite di direktori sementara
dengan provider Duitku tiruan, termasuk signature direct API, metode, biaya, kupon,
konkurensi, callback duplikat, expiry, dan isolasi pemilik. Tidak menyentuh pb_data asli.

Sebelum production, lakukan UAT dengan kredensial sandbox sebenarnya: QR dapat
dipindai, VA/nominal benar, callback mencapai backend yang sama, status Pro aktif,
dan komisi hanya tercatat sekali. Tes lokal dengan mock bukan bukti konfigurasi
merchant atau callback production sudah benar.

Referensi: [Duitku API](https://docs.duitku.com/api/id/).
