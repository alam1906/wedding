# PocketBase

Folder ini adalah source service PocketBase untuk image production.

- `pb_hooks/` berisi custom route dan lifecycle hook.
- `pb_migrations/` berisi migration schema yang masuk version control.
- `pb_data/` dibuat saat runtime dan tidak boleh masuk Git atau image.

Data production dipasang ke `/pb/pb_data` melalui named volume pada `compose.yml`.
`PB_ENCRYPTION_KEY` wajib berisi tepat 32 karakter dan disimpan sebagai secret Dokploy.

Migration `1791849600_harden_public_contracts.js` mengaktifkan batch (50 operasi, timeout
10 detik, body maksimal 128 MiB), membatasi foto baru ke JPEG/PNG/WebP maksimal 10 MiB,
menambahkan indeks query tamu/kisah, serta rate limit RSVP 60 permintaan/menit per endpoint.
Simpan kisah menggunakan batch atomik, sehingga migration ini harus tersedia sebelum frontend
yang memakainya dirilis. Setiap operasi batch tetap melewati rules dan hooks PocketBase.

Hook `wedding_validation.pb.js` melindungi subdomain sistem, template WhatsApp privat, dan
rekening hadiah yang disembunyikan atau dinonaktifkan, termasuk respons realtime,
expand, serta inferensi melalui filter/sort relasi. Pemilik dan superuser tetap bisa
membaca rekening tersimpan. Slug/file lama tidak diubah atau
dihapus otomatis: perubahan data lain tetap diperbolehkan; upload/slug baru harus valid.
Audit data lama pada lingkungan yang disetujui sebelum memutuskan remediasi data tersebut.

Migration `1792886401_guest_pagination_indexes.js` menambahkan indeks daftar tamu
per wedding untuk nama, tanggal, dan pencarian nomor CSV. Frontend memuat maksimal
50 tamu per halaman; pencarian/filter tetap berlaku pada seluruh tamu milik pemilik.
Rekonsiliasi pembayaran menggunakan migration `1792886400_payment_reconciliation.js`;
lihat [panduan pembayaran](../docs/payments-duitku.md) sebelum merilis perubahan backend.
