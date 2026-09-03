Audit seluruh codebase project ini secara menyeluruh.

Baca dan pahami struktur project, konfigurasi, dependencies, arsitektur, data flow, authentication, API/backend integration, routing, state management, styling, dan deployment setup sebelum membuat perubahan apa pun.

Tujuan utama:

- memastikan project mengikuti best practice modern
- menemukan bug atau potensi bug
- meningkatkan security
- meningkatkan maintainability
- meningkatkan readability
- meningkatkan performance
- mengurangi technical debt
- menghapus code yang redundant/dead
- memastikan implementasi tidak unnecessarily complex
- memastikan pola coding konsisten di seluruh project

Project utama menggunakan:

- SvelteKit
- Svelte 5 / runes
- TypeScript
- PocketBase
- Tailwind CSS

Lakukan audit pada area berikut:

1. PROJECT STRUCTURE

- Periksa struktur folder dan file.
- Cari file yang berada di lokasi yang tidak tepat.
- Cari duplicated logic.
- Cari component yang terlalu besar dan sebaiknya dipecah.
- Cari abstraction yang berlebihan.
- Cari abstraction yang seharusnya dibuat tetapi belum dibuat.
- Pastikan naming file, function, variable, component, type, dan interface konsisten.
- Pastikan separation of concerns baik.

2. SVELTEKIT

- Periksa penggunaan +page.svelte, +page.ts, +page.server.ts, +layout.svelte, +layout.ts, +layout.server.ts, hooks, dan endpoints.
- Pastikan logic ditempatkan di server/client secara tepat.
- Hindari mengirim JavaScript ke browser apabila logic bisa dilakukan server-side.
- Periksa SSR, CSR, prerender, dan hydration.
- Cari unnecessary client-side fetching.
- Cari waterfall request.
- Cari unnecessary rerender.
- Periksa error handling dan loading state.
- Pastikan navigation menggunakan pola SvelteKit yang benar.
- Pastikan tidak menggunakan pattern SvelteKit lama/deprecated apabila ada alternatif yang lebih baik.

3. SVELTE 5

- Pastikan menggunakan Svelte 5 modern dan runes dengan benar.
- Audit penggunaan $state, $derived, $effect, $props, $bindable, snippets, dan event handling.
- Cari penggunaan $effect yang sebenarnya bisa diganti $derived atau pendekatan declarative lain.
- Cari state yang tidak perlu reactive.
- Cari derived state yang disimpan ulang secara manual.
- Hindari legacy syntax jika tidak diperlukan.
- Periksa kemungkinan stale state atau reactivity bug.

4. TYPESCRIPT

- Cari penggunaan any yang tidak perlu.
- Cari unsafe type assertions.
- Perbaiki type inference jika memungkinkan.
- Pastikan type PocketBase records dan API response jelas.
- Hindari duplicate interfaces/types.
- Gunakan reusable types hanya jika memang meningkatkan clarity.
- Jangan membuat typing menjadi unnecessarily complicated.

5. POCKETBASE

- Audit seluruh integrasi PocketBase.
- Periksa initialization PocketBase client.
- Pastikan tidak terjadi shared global auth state yang berbahaya pada SSR.
- Periksa authentication flow.
- Periksa auth refresh.
- Periksa cookies/session handling jika digunakan.
- Periksa CRUD.
- Periksa relation dan expand.
- Periksa filter/query.
- Cari unnecessary requests.
- Cari N+1 query pattern.
- Pastikan client-side dan server-side PocketBase digunakan pada tempat yang tepat.
- Jangan pernah expose admin/superuser credential ke client.

6. POCKETBASE SECURITY

- Identifikasi seluruh collection yang digunakan berdasarkan code/schema yang tersedia.
- Audit listRule, viewRule, createRule, updateRule, dan deleteRule jika tersedia.
- Pastikan authorization tidak hanya bergantung pada UI/client-side checks.
- Pastikan user hanya bisa membaca/mengubah resource yang memang dimilikinya.
- Cari kemungkinan IDOR/BOLA.
- Cari field sensitif yang mungkin terekspos.
- Cari query/filter yang bisa dimanipulasi user.
- Periksa file upload security.
- Periksa validation.
- Periksa authentication dan authorization secara terpisah.

Periksa .env usage dan pastikan hanya variable yang aman yang boleh tersedia di client.

8. PERFORMANCE
   Cari:

- unnecessary network request
- duplicate request
- sequential request yang bisa parallel
- unnecessary JavaScript
- expensive reactive computation
- unnecessary component rerender
- oversized images/assets
- inefficient loops
- repeated PocketBase queries
- data fetching yang bisa dipindahkan ke server
- data yang dikirim ke client tetapi tidak digunakan
- bundle/dependency yang tidak diperlukan

Jangan melakukan micro-optimization tanpa manfaat nyata.

9. FRONTEND/UI

- Periksa semantic HTML.
- Accessibility.
- keyboard navigation.
- form labels.
- button/link semantics.
- alt text.
- focus states.
- responsive design.
- layout shift.
- loading state.
- empty state.
- error state.
- disabled state.

10. TAILWIND

- Cari duplicated utility combinations yang sangat sering muncul.
- Jangan membuat abstraction hanya karena dua element memiliki style mirip.
- Cari class yang tidak diperlukan.
- Pastikan responsive utilities konsisten.
- Hindari inline style jika Tailwind lebih tepat, kecuali ada alasan teknis yang jelas.

11. ERROR HANDLING

- Cari catch kosong.
- Cari error yang diabaikan.
- Pastikan error dari PocketBase/API ditangani dengan benar.
- Jangan expose internal error sensitif ke user.
- Pastikan user mendapat feedback yang sesuai.
- Gunakan HTTP status yang tepat pada server endpoints/actions.

12. CODE QUALITY
    Cari:

- dead code
- unused imports
- unused variables
- commented-out code
- duplicate code
- magic values
- overly long functions
- deeply nested conditions
- confusing boolean logic
- premature abstraction
- unnecessary helper
- unnecessary wrapper component
- unnecessary dependency

Utamakan code sederhana dan eksplisit daripada abstraction yang terlalu pintar.

13. DEPENDENCIES
    Audit package.json:

- unused dependencies
- duplicate functionality
- package yang sebenarnya tidak diperlukan
- package deprecated
- dependency yang dapat diganti native API dengan mudah

Jangan upgrade major dependency hanya karena ada versi lebih baru kecuali ada alasan konkret.

14. CONFIGURATION
    Audit:

- svelte.config
- vite.config
- tsconfig
- package.json
- eslint/prettier jika ada
- adapter configuration
- environment configuration
- deployment-related files
- Docker/Caddy config jika tersedia

Pastikan konfigurasi sesuai dengan cara project ini benar-benar dijalankan.

15. ARCHITECTURE
    Setelah memahami keseluruhan project, tentukan apakah architecture saat ini sudah proporsional.

Hindari:

- overengineering
- unnecessary repository/service layers
- unnecessary state management
- unnecessary generic abstractions
- premature optimization

Untuk aplikasi kecil/menengah, prioritaskan:
simplicity > abstraction
clarity > cleverness
maintainability > theoretical purity

PROSES KERJA:

Tahap 1 — Discovery
Baca keseluruhan project terlebih dahulu.
Jangan langsung mengubah file setelah menemukan masalah pertama.
Pahami hubungan antar-file dan architecture secara keseluruhan.

Tahap 2 — Audit
Buat daftar temuan dan klasifikasikan:

CRITICAL
Masalah security, data loss, auth bypass, production-breaking bug.

HIGH
Bug serius, architectural issue, performance issue besar.

MEDIUM
Maintainability, correctness edge case, inefficient implementation.

LOW
Cleanup, naming, simplification, minor consistency issue.

Untuk setiap temuan jelaskan:

- file/lokasi
- masalah
- kenapa itu masalah
- dampaknya
- solusi yang direkomendasikan

Tahap 3 — Validasi
Sebelum memperbaiki sesuatu:

- pastikan perubahan tidak merusak behavior yang sudah ada
- periksa penggunaan code tersebut di seluruh project
- jangan menghapus code hanya karena terlihat tidak digunakan sebelum memastikan referensinya

Tahap 4 — Implementasi
Setelah audit selesai, perbaiki masalah yang memang layak diperbaiki.

Prioritas:

1. security
2. correctness / bugs
3. architecture
4. performance
5. maintainability
6. cleanup

Jangan melakukan rewrite besar apabila perbaikan kecil sudah cukup.

Pertahankan behavior dan UI existing kecuali behavior tersebut merupakan bug.

Tahap 5 — Verification
Setelah perubahan:

- jalankan type checking
- lint jika tersedia
- tests jika tersedia
- build production
- periksa error/warning

Gunakan command project yang sudah tersedia di package.json.

Perbaiki error yang disebabkan perubahan Anda.

OUTPUT AKHIR

Berikan ringkasan:

## Audit Summary

Jumlah:

- Critical:
- High:
- Medium:
- Low:

## Critical / High Findings

Jelaskan temuan paling penting.

## Changes Made

Daftar perubahan yang benar-benar dilakukan.

## Security

Masalah security yang ditemukan dan status perbaikannya.

## Performance

Optimisasi meaningful yang dilakukan.

## Architecture

Penilaian singkat architecture project.

## Remaining Recommendations

Hal yang belum perlu diperbaiki sekarang tetapi layak dipertimbangkan kemudian.

## Verification

Tampilkan hasil:

- Type check
- Lint
- Tests
- Production build

ATURAN PENTING:

- Jangan mengubah sesuatu hanya untuk terlihat lebih "clean".
- Jangan membuat abstraction tanpa manfaat nyata.
- Jangan rewrite working code tanpa alasan kuat.
- Jangan mengubah UI/design kecuali diperlukan untuk bug/accessibility.
- Jangan menambah dependency jika native/existing solution sudah cukup.
- Jangan mengubah public API atau database schema tanpa alasan kuat.
- Jangan membuat breaking changes.
- Jangan menebak. Periksa codebase sebelum mengambil kesimpulan.
- Jika sebuah implementasi sudah baik, biarkan.
- Fokus pada masalah nyata dan improvement yang measurable.
