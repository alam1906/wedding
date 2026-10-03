# Overlay Shadow themes

Reference compositions (inspected on desktop and mobile):

| Theme key          | Reference                                         | Composition                                                                                     |
| ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `overlay-shadow-1` | https://demo.invee.net/?template=overlay-shadow-1 | Fixed photograph beside a paper column; full-photo mobile cover; olive and dark green sections. |
| `overlay-shadow-2` | https://demo.invee.net/?template=overlay-shadow-2 | Clipped photographic prints, paper album, ochre event panels and alternating stories.           |
| `overlay-shadow-3` | https://demo.invee.net/?template=overlay-shadow-3 | Palm shadows, warm grey paper, terracotta, arched portraits and deckled edges.                  |

All three belong to **Lainnya**. The catalog and dashboard keep their existing newest-first ordering. `EditionTheme.svelte` supplies the existing wedding data, recipient, countdown, couple/parents, quote, events/location, stories, gallery/lightbox, RSVP, guest wishes, optional gifts, music and footer. No reference demo copy or records are imported.

## Assets and motion

- `static/images/themes/overlay-shadow/`: original code-native SVG palm silhouette, paper grain and deckle mask. Binder clips are CSS. No third-party artwork is bundled or hotlinked.
- Fonts reuse the project's local Playfair, Fraunces, Alex and Jakarta files. No dependency was added.
- `OverlayScene.svelte` is shared by the opening cover and first section. Covers use `100dvh`; the first edition's fixed desktop photograph stays outside the transformed scroll content.
- GSAP uses the existing scoped context, matchMedia/reduced-motion handling and shared ScrollSmoother (`smooth: 1.2`, `smoothTouch: 0.12`). Added motion is paper/photo entrance, slow shadow drift, restrained image reveals and a coordinated opening transition. Context cleanup owns every new tween and ScrollTrigger.
- Existing RSVP behavior is unchanged: guest name and attendance share a row; messages are below; one wishes card becomes scrollable after five entries.
- Preview assets are actual unopened invitation screenshots in `apps/web/static/images/theme-previews/overlay-shadow-{1,2,3}.webp`, captured with the existing script and demo data.

`1792368000_add_overlay_shadow_themes.js` only appends three allowed `weddings.theme` values. It does not update wedding records or defaults, and rollback is blocked while one of these themes is in use.
