# Nine Invee-inspired editions

Reference layouts were inspected on desktop and mobile. Only their visual composition is used; all wedding content comes from Wedez's existing wedding data.

| Theme key               | Reference                                                                  | Visual direction                                                            |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `post-wedding-1`        | https://demo.invee.net/?template=post-wedding-1&ui=true&cover=image        | Foto panorama, tipografi serif berjarak, dan bunga kering bernuansa hangat. |
| `wedding-anniversary-1` | https://demo.invee.net/?template=wedding-anniversary-1&ui=true&cover=image | Foto abu-abu lembut, potret melingkar, dan aksen bunga peach.               |
| `islamic-1`             | https://demo.invee.net/?template=islamic-1&ui=true&cover=image             | Lentera emas, siluet kubah, dan bidang putih yang lapang.                   |
| `islamic-2`             | https://demo.invee.net/?template=islamic-2&ui=true&cover=image             | Geometri Islami, lengkung mihrab, dan warna hijau zamrud.                   |
| `luxury-2`              | https://demo.invee.net/?template=luxury-2                                  | Komposisi editorial krem, potret oval, dan aksen terakota.                  |
| `luxury-1`              | https://demo.invee.net/?template=luxury-1                                  | Garis emas mengalir, foto biru malam, dan potret lengkung klasik.           |
| `wedding-shower-1`      | https://demo.invee.net/?template=wedding-shower-1                          | Foto penuh, serif elegan, dan nuansa rose-beige yang lembut.                |
| `bachelorette-1`        | https://demo.invee.net/?template=bachelorette-1                            | Foto editorial, serif italic, dan perpaduan koral dengan hijau zaitun.      |
| `rehearsal-dinner-1`    | https://demo.invee.net/?template=rehearsal-dinner-1                        | Foto besar, tipografi serif italic, dan nuansa sage yang tenang.            |

## Integration

- All nine belong to **Lainnya**, and follow the existing newest-first catalog/dashboard order.
- Registered in both app key/color maps, the invitation lazy registry, web catalog and dashboard picker. The total is 76 themes.
- `themes/occasions/` contains nine thin wrappers, a shared data-driven opening scene, original SVG ornament components, scoped styles and GSAP animation helpers.
- `EditionTheme.svelte` supplies the unchanged couple/parents, event dates and location, recipient, countdown, quote from PocketBase, stories, gallery/lightbox, RSVP, one guest-wishes card, optional gifts, music and footer.
- Reference event labels such as “Bridal Shower” do not replace wedding data or add a new event type. No slogans, social icons, arrows, or demo guest records were added.

## Assets and motion

- Original code-native SVG lanterns, dome silhouettes, gold curves and repeating geometric patterns. Florals and local fonts reuse existing project assets; nothing is hotlinked to the reference site.
- No new dependency. The existing GSAP context/matchMedia lifecycle owns the entrance, photo reveals, ornament movement, opening transitions and ScrollTriggers. Reduced motion skips nonessential animation.
- All nine use the shared ScrollSmoother with `smooth: 1.2` and `smoothTouch: 0.12` when reduced motion is not requested. No global trigger teardown.
- Opening covers use `100dvh`. Responsive layouts switch between panorama, split editorial, full-photo and compact invitation cards without a horizontal scroller.
- Actual unopened covers with existing demo data are saved as WebP in `apps/web/static/images/theme-previews/`. Use `scripts/capture-theme-previews.mjs` to refresh them.

## PocketBase and validation

`1792454400_add_nine_invee_themes.js` only extends the `weddings.theme` select values. It does not change existing wedding records, defaults or selected themes. Rollback refuses removal while a new theme is in use.

The migration was applied locally. Comparison with a pre-migration backup found no changed, added or removed weddings (15 existing records). No production deployment was performed.

Source validation: web and invitation Svelte checks; scoped ESLint. A limited browser pass checked the nine covers at 390×844 and 320×568, opening/ScrollSmoother activation, all expected data sections, horizontal overflow, image loading and runtime errors. Preview screenshots were visually reviewed. RSVP forms were not submitted and live wedding data was not used for these checks.
