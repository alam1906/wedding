# PocketBase

Folder ini adalah source service PocketBase untuk image production.

- `pb_hooks/` berisi custom route dan lifecycle hook.
- `pb_migrations/` berisi migration schema yang masuk version control.
- `pb_data/` dibuat saat runtime dan tidak boleh masuk Git atau image.

Data production dipasang ke `/pb/pb_data` melalui named volume pada `compose.yml`.
`PB_ENCRYPTION_KEY` wajib berisi tepat 32 karakter dan disimpan sebagai secret Dokploy.
