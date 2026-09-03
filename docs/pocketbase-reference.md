# PocketBase CRUD Reference - Wedez

Dokumen ini adalah snapshot konfigurasi, schema, API rules, dan data PocketBase yang digunakan oleh project Wedez.

## Informasi snapshot

| Item                      | Nilai                      |
| ------------------------- | -------------------------- |
| Diambil pada              | 2026-09-02 06:55 WIB       |
| PocketBase URL lokal      | `http://127.0.0.1:8090`    |
| Admin UI                  | `http://127.0.0.1:8090/_/` |
| Status API saat diperiksa | Sehat, HTTP 200            |
| Sumber                    | PocketBase Admin API lokal |

Snapshot ini dapat berubah setelah schema atau data PocketBase diperbarui. Password, token, nomor rekening, alamat lengkap, URL peta, dan bagian nomor WhatsApp sengaja disamarkan.

Jangan pernah meletakkan email/password superuser PocketBase di source code browser, repository, atau environment variable dengan prefix publik.

## Temuan penting

1. Collection `weddings` saat ini mengizinkan operasi list, view, create, update, dan delete secara publik karena seluruh rule berisi string kosong (`""`). Create, update, dan delete sebaiknya dibatasi ke pemilik wedding.
2. Collection `wedding_stories` juga mengizinkan seluruh operasi secara publik. Create, update, dan delete sebaiknya dibatasi ke user pemilik relasi `wedding`.
3. Rate limiting PocketBase sedang nonaktif.
4. Backup terjadwal belum dikonfigurasi.
5. Metadata aplikasi PocketBase masih memakai `Acme`, `Support`, dan `support@example.com`.
6. Collection `guests` tidak memiliki field `created` dan `updated` pada schema saat snapshot dibuat.
7. Collection `invitations` kosong dan hanya berisi field bawaan. Collection ini tampaknya belum digunakan.
8. `users.createRule` bersifat publik. Ini wajar jika pendaftaran mandiri diizinkan, tetapi validasi input dan alur verifikasi email tetap perlu diperhatikan.

Tidak ada perubahan rule atau schema yang dilakukan saat membuat dokumen ini.

## Arti API rule PocketBase

| Nilai rule      | Arti                                                             |
| --------------- | ---------------------------------------------------------------- |
| `null`          | Terkunci. Hanya superuser yang dapat melakukan operasi tersebut. |
| `""`            | Publik. Tidak memerlukan autentikasi.                            |
| Ekspresi filter | Operasi hanya diizinkan jika ekspresi bernilai benar.            |

Rule bukan hanya mekanisme izin. Pada operasi list, rule juga bertindak sebagai filter record.

## Ringkasan collection

| Collection        | Tipe        | Record | Keterangan                                       |
| ----------------- | ----------- | -----: | ------------------------------------------------ |
| `users`           | Auth        |      1 | Akun pengguna Wedez                              |
| `weddings`        | Base        |      1 | Data utama undangan pernikahan                   |
| `wedding_stories` | Base        |      3 | Timeline kisah cinta                             |
| `guests`          | Base        |      2 | Daftar tamu dan RSVP                             |
| `invitations`     | Base        |      0 | Placeholder/collection lama yang belum digunakan |
| `_superusers`     | Auth system |      1 | Akun administrator PocketBase                    |
| `_authOrigins`    | System      |      3 | Origin autentikasi internal                      |
| `_externalAuths`  | System      |      0 | Provider autentikasi eksternal                   |
| `_mfas`           | System      |      0 | Data MFA                                         |
| `_otps`           | System      |      0 | Data OTP                                         |

Collection dengan prefix `_` dikelola oleh PocketBase. Jangan melakukan CRUD langsung terhadap collection tersebut dari fitur aplikasi.

## Konfigurasi PocketBase

### Metadata aplikasi

| Setting        | Nilai                   |
| -------------- | ----------------------- |
| App name       | `Acme`                  |
| App URL        | `http://localhost:8090` |
| Sender name    | `Support`               |
| Sender address | `support@example.com`   |
| Accent color   | `#1055c9`               |
| Hide controls  | `false`                 |

### SMTP

| Setting     | Nilai       |
| ----------- | ----------- |
| Enabled     | `true`      |
| Host        | `127.0.0.1` |
| Port        | `1025`      |
| Username    | Kosong      |
| Auth method | `PLAIN`     |
| TLS         | `false`     |
| Local name  | `localhost` |

Konfigurasi ini sesuai untuk SMTP lokal seperti Mailpit, bukan untuk production.

### Backup dan file storage

| Setting                   | Nilai        |
| ------------------------- | ------------ |
| Backup cron               | Belum diatur |
| Maksimum backup tersimpan | `3`          |
| Backup S3                 | Nonaktif     |
| Main S3 storage           | Nonaktif     |

### Rate limit, batch, dan log

| Setting                    | Nilai         |
| -------------------------- | ------------- |
| Rate limit enabled         | `false`       |
| Batch enabled              | `true`        |
| Maksimum request per batch | `50`          |
| Batch timeout              | `3` detik     |
| Batch max body size        | `0` / default |
| Log retention              | `5` hari      |
| Log IP                     | `true`        |
| Log auth ID                | `false`       |

Rule rate limit yang tersedia tetapi belum diaktifkan:

| Rule         |   Durasi | Maksimum |
| ------------ | -------: | -------: |
| `*:auth`     |  3 detik |        2 |
| `*:create`   |  5 detik |       20 |
| `/api/batch` |  1 detik |        3 |
| `/api/`      | 10 detik |      300 |

## Integrasi di project SvelteKit

Gunakan instance PocketBase project:

```ts
import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
```

Wedding aktif milik user tersimpan pada field auth `wedding_id`:

```ts
const weddingId = pocketBase.authStore.record?.wedding_id;

if (!weddingId) {
	throw new Error('Wedding aktif tidak ditemukan.');
}
```

Kode browser hanya boleh menggunakan autentikasi user biasa. Operasi superuser harus tetap berada di environment server yang aman dan tidak boleh dikirim ke client.

## Collection `users`

Collection ID: `_pb_users_auth_`

### Fields

| Field             | Tipe            | Wajib | Catatan                           |
| ----------------- | --------------- | ----- | --------------------------------- |
| `id`              | Text system     | Ya    | Record ID PocketBase              |
| `password`        | Password system | Ya    | Disimpan dan dikelola PocketBase  |
| `tokenKey`        | Text system     | Ya    | Rahasia internal, jangan diekspos |
| `email`           | Email system    | Ya    | Unik                              |
| `emailVisibility` | Bool system     | Tidak | Visibilitas email                 |
| `verified`        | Bool system     | Tidak | Status verifikasi                 |
| `name`            | Text            | Tidak | Maksimum 255 karakter             |
| `wedding_id`      | Relation        | Tidak | Single relation ke `weddings`     |
| `created`         | Autodate        | Ya    | Dibuat otomatis                   |
| `updated`         | Autodate        | Ya    | Diperbarui otomatis               |

### API rules

| Operasi | Rule                    |
| ------- | ----------------------- |
| List    | `id = @request.auth.id` |
| View    | `id = @request.auth.id` |
| Create  | Publik (`""`)           |
| Update  | `id = @request.auth.id` |
| Delete  | `id = @request.auth.id` |

### Indexes

- Unique index untuk `tokenKey`.
- Unique index untuk `email`.

### Data saat snapshot

| Field             | Nilai                      |
| ----------------- | -------------------------- |
| `id`              | `pi28pwr9mshhb8k`          |
| `email`           | `d***@gmail.com`           |
| `emailVisibility` | `false`                    |
| `verified`        | `true`                     |
| `name`            | `dadan`                    |
| `wedding_id`      | `vzk6v1ts18ual1j`          |
| `created`         | `2026-09-01 10:36:29.451Z` |
| `updated`         | `2026-09-01 10:36:39.326Z` |

## Collection `weddings`

Collection ID: `pbc_1115120447`

### Fields

| Field                    | Tipe        | Wajib | Batasan/keterangan                            |
| ------------------------ | ----------- | ----- | --------------------------------------------- |
| `id`                     | Text system | Ya    | Record ID PocketBase                          |
| `groom_name`             | Text        | Tidak | Nama pengantin pria                           |
| `groom_father_name`      | Text        | Tidak | Nama ayah pengantin pria                      |
| `groom_mother_name`      | Text        | Tidak | Nama ibu pengantin pria                       |
| `groom_photo`            | File        | Tidak | Maksimum 1 file                               |
| `groom_payment_number`   | Text        | Tidak | Nomor rekening atau e-wallet pengantin pria   |
| `groom_payment_provider` | Text        | Tidak | Nama bank atau e-wallet pengantin pria        |
| `bride_name`             | Text        | Tidak | Nama pengantin wanita                         |
| `bride_father_name`      | Text        | Tidak | Nama ayah pengantin wanita                    |
| `bride_mother_name`      | Text        | Tidak | Nama ibu pengantin wanita                     |
| `bride_photo`            | File        | Tidak | Maksimum 1 file                               |
| `bride_payment_number`   | Text        | Tidak | Nomor rekening atau e-wallet pengantin wanita |
| `bride_payment_provider` | Text        | Tidak | Nama bank atau e-wallet pengantin wanita      |
| `cover`                  | File        | Tidak | Maksimum 1 file                               |
| `quote`                  | Text        | Tidak | Kutipan undangan                              |
| `address`                | Text        | Tidak | Alamat acara                                  |
| `akad`                   | Date        | Tidak | Waktu akad                                    |
| `reception`              | Date        | Tidak | Waktu resepsi                                 |
| `gallery`                | File        | Tidak | Maksimum 10 file                              |
| `slug`                   | Text        | Tidak | Unik melalui index                            |
| `maps`                   | URL         | Tidak | URL lokasi                                    |
| `theme`                  | Select      | Tidak | Salah satu theme yang terdaftar               |
| `plan_tier`              | Select      | Ya    | Paket aktif: `free` atau `pro`                |
| `created`                | Autodate    | Ya    | Dibuat otomatis                               |
| `updated`                | Autodate    | Ya    | Diperbarui otomatis                           |

Nilai yang valid untuk `theme`:

```text
minimalist-1
minimalist-2
minimalist-3
neubrutalism-1
neubrutalism-2
neubrutalism-3
playful-1
playful-2
playful-3
3d-design-1
```

### API rules

Read publik tetap dibutuhkan untuk halaman undangan. Mutasi dibatasi sebagai berikut:

| Operasi | Rule                                                       |
| ------- | ---------------------------------------------------------- |
| List    | Publik (`""`)                                              |
| View    | Publik (`""`)                                              |
| Create  | User terautentikasi dan `plan_tier` wajib `free`           |
| Update  | Owner wedding; `plan_tier` tidak boleh berubah dari client |
| Delete  | Owner wedding                                              |

### Indexes

```sql
CREATE UNIQUE INDEX `idx_4in7ijlqe6` ON `weddings` (`slug`)
```

### Data saat snapshot

| Field                    | Nilai                              |
| ------------------------ | ---------------------------------- |
| `id`                     | `vzk6v1ts18ual1j`                  |
| `groom_name`             | `dadan`                            |
| `groom_father_name`      | `dandi`                            |
| `groom_mother_name`      | `dinda`                            |
| `groom_photo`            | `glasshouse_venue_xf8cax0vet.webp` |
| `groom_payment_number`   | `[REDACTED]`                       |
| `groom_payment_provider` | `(kosong)`                         |
| `bride_name`             | `didin`                            |
| `bride_father_name`      | `dandi`                            |
| `bride_mother_name`      | `dinda`                            |
| `bride_photo`            | `coral_bouquet_hyogef96ti.webp`    |
| `bride_payment_number`   | `[REDACTED]`                       |
| `bride_payment_provider` | `(kosong)`                         |
| `cover`                  | `glasshouse_venue_1xjsoai692.webp` |
| `quote`                  | `no one can stop me`               |
| `address`                | `[REDACTED]`                       |
| `akad`                   | `2026-09-29 18:01:00.000Z`         |
| `reception`              | `2026-09-25 19:02:00.000Z`         |
| `slug`                   | `dadan-hilma`                      |
| `maps`                   | `[REDACTED]`                       |
| `theme`                  | `neubrutalism-3`                   |
| `plan_tier`              | `free`                             |
| `created`                | `2026-09-01 10:36:39.325Z`         |
| `updated`                | `2026-09-01 23:04:42.236Z`         |

File `gallery`:

```text
coral_bouquet_1bn5uiltf3.webp
glasshouse_venue_bip0emho3q.webp
raka_laras_hero_vq2xrsq7gm.webp
wedding_rings_b4vts9cidh.webp
```

### Contoh CRUD

Ambil wedding berdasarkan ID milik user:

```ts
const weddingId = pocketBase.authStore.record?.wedding_id;
if (!weddingId) throw new Error('Wedding aktif tidak ditemukan.');

const wedding = await pocketBase.collection('weddings').getOne(weddingId);
```

Ambil wedding publik berdasarkan slug:

```ts
const wedding = await pocketBase
	.collection('weddings')
	.getFirstListItem(pocketBase.filter('slug = {:slug}', { slug }));
```

Update data wedding:

```ts
const updatedWedding = await pocketBase.collection('weddings').update(weddingId, {
	groom_name: 'Nama pria',
	bride_name: 'Nama wanita',
	theme: 'minimalist-1'
});
```

Upload satu file:

```ts
const payload = new FormData();
payload.set('cover', optimizedFile);

const updatedWedding = await pocketBase.collection('weddings').update(weddingId, payload);
```

Tambah file gallery tanpa mengganti file lama:

```ts
const payload = new FormData();

for (const file of optimizedFiles) {
	payload.append('gallery+', file);
}

await pocketBase.collection('weddings').update(weddingId, payload);
```

Hapus satu file dari gallery:

```ts
await pocketBase.collection('weddings').update(weddingId, {
	'gallery-': fileName
});
```

## Collection `wedding_stories`

Collection ID: `pbc_2566319712`

### Fields

| Field        | Tipe        | Wajib | Batasan/keterangan                                          |
| ------------ | ----------- | ----- | ----------------------------------------------------------- |
| `id`         | Text system | Ya    | Record ID PocketBase                                        |
| `wedding`    | Relation    | Ya    | Single relation ke `weddings`, cascade delete aktif         |
| `title`      | Text        | Ya    | Minimum 1, maksimum 200 karakter                            |
| `content`    | Text        | Ya    | Minimum 1, maksimum 5000 karakter                           |
| `date`       | Date        | Tidak | Tanggal cerita                                              |
| `image`      | File        | Tidak | Maksimum 1 file; MIME, ukuran, dan thumbnail belum dibatasi |
| `sort_order` | Number      | Ya    | Integer, minimum 1                                          |
| `created`    | Autodate    | Ya    | Dibuat otomatis                                             |
| `updated`    | Autodate    | Ya    | Diperbarui otomatis                                         |

### API rules

| Operasi | Rule          |
| ------- | ------------- |
| List    | Publik (`""`) |
| View    | Publik (`""`) |
| Create  | Publik (`""`) |
| Update  | Publik (`""`) |
| Delete  | Publik (`""`) |

Tidak ada custom index pada collection ini saat snapshot dibuat.

### Data saat snapshot

| ID                | Judul         | Tanggal      | Image                              | Urutan | Wedding           |
| ----------------- | ------------- | ------------ | ---------------------------------- | -----: | ----------------- |
| `rgm9lumttn0xpmd` | `pertemuan 1` | `2001-01-01` | `wedding_rings_r8tm3jy1x1.webp`    |      1 | `vzk6v1ts18ual1j` |
| `szcs0qrr9x9wxwo` | `pertemuan 2` | `2002-02-02` | `glasshouse_venue_a1sbvz2rd8.webp` |      2 | `vzk6v1ts18ual1j` |
| `fy4tne96i3qxbv4` | `pertemuan 3` | `2003-03-30` | `coral_bouquet_si5jlvi637.webp`    |      3 | `vzk6v1ts18ual1j` |

Isi `content` masing-masing record saat snapshot sama dengan judulnya.

### Contoh CRUD

List story berdasarkan wedding:

```ts
const stories = await pocketBase.collection('wedding_stories').getFullList({
	filter: pocketBase.filter('wedding = {:weddingId}', { weddingId }),
	sort: 'sort_order'
});
```

Create story dengan gambar:

```ts
const payload = new FormData();
payload.set('wedding', weddingId);
payload.set('title', 'Pertemuan pertama');
payload.set('content', 'Isi cerita');
payload.set('date', '2026-09-02');
payload.set('sort_order', '1');
payload.set('image', optimizedFile);

const story = await pocketBase.collection('wedding_stories').create(payload);
```

Update story:

```ts
const story = await pocketBase.collection('wedding_stories').update(storyId, {
	title: 'Judul baru',
	content: 'Cerita baru',
	date: '2026-09-03',
	sort_order: 2
});
```

Hapus gambar story tanpa menghapus record:

```ts
await pocketBase.collection('wedding_stories').update(storyId, {
	image: null
});
```

Delete story:

```ts
await pocketBase.collection('wedding_stories').delete(storyId);
```

Bangun URL file:

```ts
const imageUrl = story.image
	? pocketBase.files.getURL(story, story.image, { thumb: '1200x800' })
	: null;
```

Catatan: thumbnail `1200x800` hanya akan bekerja sesuai konfigurasi dan kemampuan PocketBase. Field `image` saat ini belum memiliki daftar thumbnail preset.

## Collection `guests`

Collection ID: `pbc_2047001084`

### Fields

| Field         | Tipe        | Wajib | Batasan/keterangan                                                                                                           |
| ------------- | ----------- | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`          | Text system | Ya    | Record ID PocketBase                                                                                                         |
| `wedding`     | Relation    | Ya    | Single relation ke `weddings`, cascade delete aktif                                                                          |
| `name`        | Text        | Ya    | Minimum 1, maksimum 150 karakter                                                                                             |
| `whatsapp`    | Text        | Ya    | 8-20 karakter, wajib format internasional                                                                                    |
| `rsvp_status` | Select      | Ya    | `pending`, `attending`, atau `not_attending`                                                                                 |
| `message`     | Text        | Tidak | Maksimum 1000 karakter                                                                                                       |
| `rsvp_token`  | Text        | Ya    | 12-64 karakter; token baru menggunakan tepat 32 huruf kecil `a-z`, sedangkan format lama tetap diterima untuk kompatibilitas |
| `guest_count` | Number      | Ya    | Integer, minimum 1                                                                                                           |

Regex `whatsapp`:

```regex
^\+[1-9][0-9]{7,14}$
```

Regex `rsvp_token`:

```regex
^[A-Za-z0-9_-]{12,64}$
```

Collection ini belum memiliki field `created` dan `updated`.

### Status RSVP

| Nilai database  | Label UI    |
| --------------- | ----------- |
| `pending`       | Menunggu    |
| `attending`     | Hadir       |
| `not_attending` | Tidak hadir |

### API rules

List dan view:

```text
@request.auth.id != "" && wedding = @request.auth.wedding_id
```

Create:

```text
@request.auth.id != "" && @request.body.wedding = @request.auth.wedding_id
```

Update:

```text
@request.auth.id != "" && wedding = @request.auth.wedding_id && (@request.body.wedding:isset = false || @request.body.wedding = @request.auth.wedding_id)
```

Delete:

```text
@request.auth.id != "" && wedding = @request.auth.wedding_id
```

### Indexes

```sql
CREATE UNIQUE INDEX idx_guests_rsvp_token ON guests (rsvp_token)
```

### Data saat snapshot

| ID                | Nama   | WhatsApp      | Status    | Pesan  | Jumlah | Wedding           |
| ----------------- | ------ | ------------- | --------- | ------ | -----: | ----------------- |
| `nebf2vjjm13n2qc` | `agus` | `+628****061` | `pending` | Kosong |      1 | `vzk6v1ts18ual1j` |
| `wyb7qiqgwgtd1ng` | `alam` | `+628****789` | `pending` | Kosong |      1 | `vzk6v1ts18ual1j` |

Nilai `rsvp_token` tersedia pada kedua record tetapi disamarkan dalam dokumen ini.

### Normalisasi nomor WhatsApp

Karena schema mewajibkan format internasional, input seperti `081234567890` harus dikonversi menjadi `+6281234567890` sebelum dikirim.

```ts
function normalizeWhatsapp(value: string): string {
	const digits = value.replace(/\D/g, '');

	if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
	if (digits.startsWith('62')) return `+${digits}`;

	return value.startsWith('+') ? `+${digits}` : `+${digits}`;
}
```

### Membuat RSVP token

```ts
function createRsvpToken(): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz';
	const tokenLength = 32;
	let token = '';

	while (token.length < tokenLength) {
		const bytes = crypto.getRandomValues(new Uint8Array(tokenLength));

		for (const byte of bytes) {
			if (byte >= 234) continue;

			token += alphabet[byte % alphabet.length];
			if (token.length === tokenLength) break;
		}
	}

	return token;
}
```

Token dipakai sebagai identitas rahasia pada link undangan, misalnya:

```text
http://localhost:5173/dadan-hilma?rsvp=TOKEN_TAMU
```

Jangan menampilkan token di tabel pengelolaan tamu atau log publik.

### Contoh CRUD untuk dashboard user

List tamu milik wedding aktif:

```ts
const weddingId = pocketBase.authStore.record?.wedding_id;
if (!weddingId) throw new Error('Wedding aktif tidak ditemukan.');

const guests = await pocketBase.collection('guests').getFullList({
	filter: pocketBase.filter('wedding = {:weddingId}', { weddingId })
});

guests.sort((left, right) => left.name.localeCompare(right.name, 'id'));
```

Gunakan sorting client-side di atas. Pada snapshot ini, request dengan sort gabungan tertentu pernah ditolak oleh instance PocketBase.

Create tamu dari form yang hanya berisi nama dan WhatsApp:

```ts
const guest = await pocketBase.collection('guests').create({
	wedding: weddingId,
	name: form.name.trim(),
	whatsapp: normalizeWhatsapp(form.whatsapp),
	rsvp_status: 'pending',
	message: '',
	rsvp_token: createRsvpToken(),
	guest_count: 1
});
```

Edit nama dan nomor WhatsApp tanpa menimpa jawaban RSVP tamu:

```ts
const guest = await pocketBase.collection('guests').update(guestId, {
	name: form.name.trim(),
	whatsapp: normalizeWhatsapp(form.whatsapp)
});
```

Delete tamu:

```ts
await pocketBase.collection('guests').delete(guestId);
```

Field `rsvp_status` dan `message` sebaiknya diisi oleh tamu melalui endpoint/hook RSVP yang memvalidasi `rsvp_token`. Jangan membuka update collection `guests` secara publik hanya agar form RSVP dapat bekerja, karena itu memungkinkan record tamu lain diubah jika ID-nya diketahui.

## Collection `payments`

Collection ID: `pbc_631030571`

Collection ini menyimpan riwayat transaksi payment gateway untuk setiap wedding. Status paket aktif tetap dibaca dari `weddings.plan_tier`.

| Field                     | Tipe        | Wajib | Batasan/keterangan                                      |
| ------------------------- | ----------- | ----- | ------------------------------------------------------- |
| `id`                      | Text system | Ya    | Record ID PocketBase                                    |
| `wedding`                 | Relation    | Ya    | Single relation ke `weddings`, cascade delete aktif     |
| `provider`                | Text        | Ya    | Nama payment gateway, maksimum 50 karakter              |
| `provider_transaction_id` | Text        | Ya    | ID transaksi dari provider, maksimum 255 karakter       |
| `amount`                  | Number      | Ya    | Bilangan bulat minimal 1                                |
| `currency`                | Select      | Ya    | Saat ini hanya `IDR`                                    |
| `status`                  | Select      | Ya    | `pending`, `paid`, `failed`, `expired`, atau `refunded` |
| `paid_at`                 | Date        | Tidak | Waktu pembayaran terverifikasi                          |
| `expires_at`              | Date        | Tidak | Batas waktu transaksi pending                           |
| `created`                 | Autodate    | Ya    | Dibuat otomatis                                         |
| `updated`                 | Autodate    | Ya    | Diperbarui otomatis                                     |

Index unik menggabungkan `provider` dan `provider_transaction_id`. List dan view hanya dapat dilakukan oleh pemilik wedding; create, update, dan delete terkunci untuk client agar hanya backend atau webhook tepercaya yang dapat mengubah transaksi.

## Collection `invitations`

Collection ID: `pbc_3554030554`

- Jumlah record: `0`.
- Field: `id`, `created`, dan `updated`.
- Seluruh API rule terkunci.
- Belum digunakan oleh alur CRUD tamu saat ini.

Jika tidak akan digunakan, collection ini dapat dihapus setelah memastikan tidak ada kode atau relasi yang bergantung kepadanya.

## System collections

### `_superusers`

- Tipe auth system.
- Jumlah record: 1.
- Seluruh API rule terkunci.
- Memiliki field autentikasi internal seperti `email`, `password`, `tokenKey`, `verified`, `created`, dan `updated`.
- Memiliki unique index untuk email dan token key.
- Detail record tidak ditulis untuk menjaga kredensial administrator.

### `_authOrigins`

- Jumlah record: 3.
- Menyimpan `collectionRef`, `recordRef`, dan `fingerprint`.
- List/view/delete dibatasi ke pemilik record autentikasi.
- Create/update terkunci.
- Kombinasi `collectionRef`, `recordRef`, dan `fingerprint` bersifat unik.

### `_externalAuths`

- Jumlah record: 0.
- Menyimpan provider autentikasi eksternal dan provider ID.
- List/view/delete dibatasi ke pemilik record autentikasi.
- Create/update terkunci.

### `_mfas`

- Jumlah record: 0.
- Menyimpan metode MFA yang terkait ke record autentikasi.
- List/view dibatasi ke pemilik; operasi lain terkunci.

### `_otps`

- Jumlah record: 0.
- Menyimpan OTP internal, tujuan pengiriman, dan relasi record autentikasi.
- Password dan tujuan pengiriman bersifat hidden.
- List/view dibatasi ke pemilik; operasi lain terkunci.

## Penanganan error PocketBase

PocketBase biasanya mengembalikan detail validasi per field pada `response.data`.

```ts
import ClientResponseError from 'pocketbase';

try {
	await pocketBase.collection('guests').create(payload);
} catch (error) {
	if (error instanceof ClientResponseError) {
		console.error(error.status, error.message, error.response?.data);
	}

	throw error;
}
```

Untuk UI production, ubah error field menjadi pesan yang mudah dipahami, tetapi simpan detail teknis hanya pada log development.

Error umum:

| Status  | Kemungkinan penyebab                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------------------- |
| 400     | Field tidak sesuai schema, format WhatsApp salah, select tidak valid, relation kosong, atau field wajib tidak dikirim |
| 401     | Auth store kosong atau token kedaluwarsa                                                                              |
| 403/404 | API rule menolak akses; PocketBase dapat menyamarkan record sebagai tidak ditemukan                                   |
| 500     | Error aplikasi yang membungkus error PocketBase tanpa menampilkan detail aslinya                                      |

## Rekomendasi rule yang lebih aman

Bagian ini hanya rekomendasi dan belum diterapkan ke database.

### `weddings`

Jika user memiliki field `wedding_id`, rule owner dapat memakai pola:

```text
@request.auth.id != "" && id = @request.auth.wedding_id
```

Rekomendasi:

| Operasi | Rekomendasi                                                                          |
| ------- | ------------------------------------------------------------------------------------ |
| List    | Owner only, atau public jika benar-benar diperlukan                                  |
| View    | Public untuk halaman undangan, atau owner only dan sediakan endpoint publik terbatas |
| Create  | User terautentikasi melalui alur onboarding terkontrol                               |
| Update  | `@request.auth.id != "" && id = @request.auth.wedding_id`                            |
| Delete  | `@request.auth.id != "" && id = @request.auth.wedding_id`                            |

### `wedding_stories`

Rule owner yang sesuai dengan struktur saat ini:

```text
@request.auth.id != "" && wedding = @request.auth.wedding_id
```

Untuk create:

```text
@request.auth.id != "" && @request.body.wedding = @request.auth.wedding_id
```

List/view dapat tetap publik jika story memang ditampilkan pada halaman undangan publik, tetapi create/update/delete harus dibatasi.

### RSVP publik

Jangan mengganti update rule `guests` menjadi publik. Gunakan salah satu opsi berikut:

1. PocketBase hook/custom route yang mencari tamu berdasarkan `rsvp_token`, lalu hanya mengizinkan update `rsvp_status` dan `message`.
2. Collection respons RSVP terpisah dengan rule create yang sangat terbatas dan token tervalidasi di hook.

Opsi pertama paling sederhana untuk struktur database saat ini.

## Checklist CRUD baru

Sebelum menambahkan fitur CRUD:

1. Pastikan nama field persis sama dengan schema.
2. Ambil `wedding_id` dari auth record, bukan dari input bebas pengguna.
3. Gunakan `pocketBase.filter()` untuk nilai filter dinamis.
4. Normalisasi WhatsApp menjadi format `+62...`.
5. Jangan menimpa `rsvp_status` dan `message` saat owner hanya mengedit nama/WhatsApp.
6. Optimalkan image di browser sebelum dimasukkan ke `FormData`.
7. Jangan memberi `name` pada raw file input jika form otomatis dibungkus dengan `FormData`; masukkan file hasil optimasi secara eksplisit.
8. Tampilkan pesan validasi per field dari error PocketBase selama development.
9. Pastikan API rules sudah membatasi record berdasarkan wedding milik user.
10. Hindari penggunaan superuser pada kode client.

## Memperbarui snapshot ini

Saat schema berubah, perbarui bagian berikut:

1. Daftar collection dan jumlah record.
2. Field, tipe, required state, dan constraint.
3. API rules dan indexes.
4. Konfigurasi SMTP, storage, backup, rate limit, dan log.
5. Contoh data yang sudah disamarkan.
6. Contoh CRUD bila nama field atau alur autentikasi berubah.

Gunakan PocketBase Admin UI atau Admin API dari mesin lokal. Jangan menuliskan token autentikasi, password superuser, `rsvp_token`, nomor rekening, atau data pribadi lengkap ke dokumen/repository.
