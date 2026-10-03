# Minimalist themes — Invee references

The seven themes use the existing wedding data and shared invitation behavior.
Existing weddings on `minimalist-1` retain their key and receive the new design.
The catalog migration does not update or delete wedding records. It stops if any
retired theme is still selected, rather than silently reassigning a wedding.

| Theme        | Reference                                      | Composition                                        |
| ------------ | ---------------------------------------------- | -------------------------------------------------- |
| minimalist-1 | https://demo.invee.net/?template=minimalist-6  | Ice-blue photo, clipped corners, calligraphy       |
| minimalist-2 | https://demo.invee.net/?template=minimalist-7  | Sage botanical paper and serif type                |
| minimalist-3 | https://demo.invee.net/?template=minimalist-8  | White editorial split and apricot accent           |
| minimalist-4 | https://demo.invee.net/?template=minimalist-9  | Asymmetric arch, serif type, stacked date          |
| minimalist-5 | https://demo.invee.net/?template=minimalist-10 | Dark photographic minimalism                       |
| minimalist-6 | https://demo.invee.net/?template=minimalist-11 | Warm full-bleed cover and staggered portraits      |
| minimalist-7 | https://demo.invee.net/?template=minimalist-12 | Vertical type, offset photos, black recipient band |

## Artwork

- Mode: built-in image generation; original artwork, not an extracted reference asset.
- Source: `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-0fc0b9ee-4d1e-41bc-8059-a85281cfa2f9.png`.
- Runtime asset: `apps/invitation/static/images/themes/minimalist/monstera.webp`.
- Encoding: transparent WebP, 800 × 800, quality 83, sharp YUV, metadata removed.
- Cover previews: real unopened invitation captures, WebP quality 82 via the existing capture script.
- Existing local fonts, GSAP and ScrollSmoother are reused. No dependencies added.

### Generation prompt

Use case: photorealistic-natural. Asset type: original botanical decorative cutout for a minimalist wedding invitation website. Primary request: a single large natural Monstera deliciosa leaf, viewed from above, muted sage forest green, delicate visible veins, real velvety leaf texture, beautifully organic fenestrations. Leaf stem points toward top-right, broad leaf fans toward bottom-left. Composition: single leaf entirely visible with 6% transparent margin, square canvas, no other objects. Lighting: soft diffuse daylight, elegant restrained tones. Constraints: genuinely transparent background, holes in leaf also transparent; no white backdrop, no shadow outside leaf, no text, no logo, no watermark, no flowers.

## Integration

Theme keys and colors are registered in both apps, in the public catalog, dashboard
picker, invitation registry and PocketBase select enum. Countdown, database quote,
couple/parents, events, stories, gallery, guest RSVP/wishes, gifts and footer reuse
the edition renderer. ScrollSmoother is created before section triggers, scoped
animations are reverted on navigation, and reduced motion leaves content usable.

Local migration is separate from deployment: production needs the new frontend
and PocketBase migration. Back up PocketBase before applying this forward-only
catalog replacement.

## Local verification — 2026-10-03

- Web and invitation Svelte checks: zero errors and warnings; scoped ESLint passed.
- All seven covers captured at 1200 × 900 and checked at 390 × 844 with visible opening buttons and no horizontal page overflow.
- Opened content retains the database quote, couple, events/countdown, stories, gallery, RSVP, wishes and gifts; the shared ScrollSmoother activates after opening.
- All 53 catalog entries have WebP previews. New previews are approximately 32–45 KiB each.
- Local PocketBase migration applied: 53 enum values. A bidirectional SQL EXCEPT comparison found no changed or removed wedding records; all 15 are preserved, including 14 on minimalist-1.
- Pre-migration SQLite backup: `/tmp/wedez-minimalist-db-eTpSwW/data.db`.
- No dependency installation, production migration, deployment or live RSVP submission was performed.
- Invitation preview is served on port 5174. Port 5173 was already used by the separate `launching` project, so that process was left untouched.
