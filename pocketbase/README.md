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

Hook `wedding_validation.pb.js` melindungi subdomain sistem dan template WhatsApp privat,
termasuk respons realtime dan pencarian melalui relasi. Slug/file lama tidak diubah atau
dihapus otomatis: perubahan data lain tetap diperbolehkan; upload/slug baru harus valid.
Audit data lama pada lingkungan yang disetujui sebelum memutuskan remediasi data tersebut.
