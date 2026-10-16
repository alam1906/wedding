# Landing page checkpoint

Versi sebelum redesign neubrutalism pada 16 Oktober 2026 disimpan dalam Git tag:

`checkpoint-landing-before-neubrutalism-2026-10-16`

Commit: `a95db24d6c56973309174cb8d7895051ca092d68`.

Checkpoint dibuat ketika working tree bersih, sebelum perubahan desain. Tag ini lokal dan belum dikirim ke remote.

## Mengembalikan landing page lama

Jalankan dari root repository:

```sh
git restore --source checkpoint-landing-before-neubrutalism-2026-10-16 -- apps/web/src/routes/+page.svelte
```

Perintah ini hanya mengembalikan halaman `/`. Setelah itu, file eksperimen dalam `apps/web/src/lib/features/landing/` tidak lagi digunakan dan boleh dihapus secara terpisah. Tidak perlu reset seluruh repository.

Redesign menggunakan komponen dan style yang khusus untuk `/`. Navbar bersama, `/tema`, halaman autentikasi, data katalog, aset gambar, dan backend tidak diubah.
