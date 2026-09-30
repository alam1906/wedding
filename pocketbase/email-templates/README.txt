TEMPLATE EMAIL WEDEZ

Buka preview.html untuk melihat enam desain dan menyalin Subject / Body HTML.
Pada PocketBase: Collections > users > Edit collection > Options, tempel Subject
dan Body pada template yang sesuai, lalu Save changes.

Lima field bawaan PocketBase 0.40.1:
verification.html  -> verificationTemplate
password-reset.html -> resetPasswordTemplate
email-change.html -> confirmEmailChangeTemplate
otp.html -> otp.emailTemplate
auth-alert.html -> authAlert.emailTemplate

welcome.html adalah tambahan. PocketBase tidak memiliki field bawaan untuk
email selamat datang; pengiriman email ini perlu dibuat terpisah.
templates.json memuat Subject, Body, dan nama field; bukan ekspor collection.
subjects.json hanya memuat Subject per file.

TAUTAN DAN PLACEHOLDER
{APP_URL} mengikuti Settings > Application > Application URL PocketBase.
Untuk tautan konfirmasi bawaan, gunakan origin PocketBase yang sesuai dengan
environment (misalnya http://localhost:8090 atau https://api.wedez.id).
{TOKEN}, {OTP}, dan {ALERT_INFO} diisi PocketBase sesuai jenis email.
Nama penerima sengaja tidak dipakai agar tidak ada sapaan kosong pada akun
yang belum memiliki name. Tidak ada waktu kedaluwarsa yang ditulis permanen.

Tombol pada auth-alert dan welcome menuju web produksi https://wedez.id.
Sesuaikan tautan tersebut jika ingin memakainya untuk pengujian lokal.

RESET KATA SANDI PADA PROJECT INI
pb_hooks/password_reset.pb.js menimpa seluruh Subject, HTML, dan teks email
reset kata sandi. Jadi mengganti resetPasswordTemplate dari dashboard saja
belum mengubah email reset yang dikirim. Hook tersebut mengarahkan token ke
WEDEZ_APP_URL/reset-password#token=...; tujuan itu harus dipertahankan jika
desain baru diterapkan pada hook. Tidak ada hook yang diubah dalam paket ini.

MEMPERBARUI DESAIN
Source desain ada pada scripts/generate-email-templates.mjs.
Jalankan dari root: bun scripts/generate-email-templates.mjs
File HTML adalah fragmen Body, bukan dokumen email utuh, karena PocketBase
sudah memberi wrapper HTML. Tidak menggunakan class btn yang ditimpa CSS
default PocketBase. Semua email memakai tabel dan inline CSS tanpa aset luar.

Template ini belum disimpan ke collection, belum dikirim melalui SMTP, dan
belum diuji di klien email seperti Gmail / Outlook. Pratinjau browser memakai
placeholder contoh, bukan kredensial, token, atau informasi pengguna asli.
