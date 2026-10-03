# Adat — Invee references

Implemented in `apps/invitation/src/lib/features/wedding-themes/themes/adat/`.
All eleven keys use category `adat`; existing wedding data and sections remain shared.

## Reference mapping

| Theme                                 | Reference                                                  | Original ornament      |
| ------------------------------------- | ---------------------------------------------------------- | ---------------------- |
| Sumatera Utara (`sumatera-utara`)     | [Invee](https://demo.invee.net/?template=sumatera-utara)   | `rumah-bolon.webp`     |
| Sulawesi Selatan (`sulawesi-selatan`) | [Invee](https://demo.invee.net/?template=sulawesi-selatan) | `saoraja.webp`         |
| Sumatera Barat (`sumatera-barat`)     | [Invee](https://demo.invee.net/?template=sumatera-barat)   | `rumah-gadang.webp`    |
| Jakarta (`jakarta`)                   | [Invee](https://demo.invee.net/?template=jakarta)          | `monas.webp`           |
| Jawa Barat (`jawa-barat`)             | [Invee](https://demo.invee.net/?template=jawa-barat)       | `julang-ngapak.webp`   |
| Jawa Tengah (`jawa-tengah`)           | [Invee](https://demo.invee.net/?template=jawa-tengah)      | `gunungan.webp`        |
| Jawa Timur (`jawa-timur`)             | [Invee](https://demo.invee.net/?template=jawa-timur)       | `gunungan.webp`        |
| Bali (`bali`)                         | [Invee](https://demo.invee.net/?template=bali)             | `meru.webp`            |
| Sunda (`sunda`)                       | [Invee](https://demo.invee.net/?template=sunda)            | `imah-jolopong.webp`   |
| Dayak (`dayak`)                       | [Invee](https://demo.invee.net/?template=dayak)            | `talawang.webp`        |
| Banjar (`banjar`)                     | [Invee](https://demo.invee.net/?template=banjar)           | `bubungan-tinggi.webp` |

## Artwork

Mode: built-in imagegen, separate generation per asset. Original illustrations, not downloaded reference artwork. Transparency is retained for ornaments and frames. The tropical engraving is opaque.

Saved assets: `apps/invitation/static/images/themes/adat/`.
Optimized with the existing cwebp executable: quality 82, method 6, sharp YUV, no metadata, alpha quality 100. No new dependencies.

- `apps/invitation/static/images/themes/adat/rumah-bolon.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-b9923f0f-3aa6-4c9c-8626-1a9005049095.png`
- `apps/invitation/static/images/themes/adat/saoraja.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-cb7776b7-05cc-4571-bdab-f082abcfe0e4.png`
- `apps/invitation/static/images/themes/adat/rumah-gadang.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-8feb6a1e-8094-4e86-886e-74f0278b4d76.png`
- `apps/invitation/static/images/themes/adat/monas.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-9b53a92e-650a-4e14-975c-37c24290f8a0.png`
- `apps/invitation/static/images/themes/adat/julang-ngapak.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-411ed23f-46a7-4182-92c1-2cf9ba9b3609.png`
- `apps/invitation/static/images/themes/adat/gunungan.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-89698547-d133-497a-b1b4-0b45622ef395.png`
- `apps/invitation/static/images/themes/adat/meru.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-a6d41316-da5b-42b3-a3d7-0a4ebab4c5f5.png`
- `apps/invitation/static/images/themes/adat/imah-jolopong.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-1b740448-80a2-4817-974a-35f1c2185f94.png`
- `apps/invitation/static/images/themes/adat/talawang.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-77b5ab06-2acf-4a05-81da-c19b41d78ebe.png`
- `apps/invitation/static/images/themes/adat/bubungan-tinggi.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-c34218eb-9c29-4511-be00-ff5ef1c70648.png`
- `apps/invitation/static/images/themes/adat/tropical-engraving.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-f0747d79-8f9f-48ea-a3a4-29e0909e7f38.png`
- `apps/invitation/static/images/themes/adat/oval-frame.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-214ad5b8-98ed-404a-9da2-9da9ebf102f4.png`
- `apps/invitation/static/images/themes/adat/arch-frame.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-166a4fe2-d11c-430f-a1cf-9bb5fb2b786f.png`
- `apps/invitation/static/images/themes/adat/penjor.webp` — source `/Users/alam/.codex/generated_images/01a0ce36-11be-7fc2-9375-67f6ea9493cb/exec-ad0a6bab-7b7e-4b69-a76d-e982cef20ef2.png`

## Final generation prompts

Shared prefix for the ten regional emblems:

> Use case: stylized-concept. Asset type: original finely engraved cultural illustration for an Indonesian wedding website. Single isolated object on genuinely transparent alpha, centered, fully visible with 6% clear margins. Antique copperplate engraving, precise delicate ink hatching, warm ivory and muted antique-gold linework, restrained ochre shading. Elegant historical architectural plate, not a photograph or 3D render. No text, lettering, numbers, logo, watermark, frame, people or background landscape. Subject:

### rumah-bolon

a North Sumatran Batak Toba Rumah Bolon house, front three-quarter view, dramatically upswept saddle-shaped roof with high curving pointed gables, broad triangular facade with intricate red-black-ivory gorga carvings, timber stilt supports and a small entry ladder. Wide architectural silhouette. Authentic Batak structure, not a Minangkabau multi-horned house.

### saoraja

a South Sulawesi Bugis traditional Saoraja timber stilt house, front three-quarter view, raised wooden living floor on many tall upright posts, broad layered steep triangular pitched roof with distinctive stacked timpa laja gable trim, verandah and straight front staircase. Wide architectural silhouette, not a Toraja saddle roof.

### rumah-gadang

a West Sumatran Minangkabau Rumah Gadang house, frontal symmetrical architectural view, elongated timber structure on short stilts, six sharply upcurving pointed gonjong roof peaks including two taller central peaks, rich carved facade and centered staircase. Clearly recognizable multiple buffalo-horn-shaped roof silhouette. Wide composition.

### monas

the Jakarta National Monument Monas, accurate full-height tall slender square obelisk rising from its broad square ceremonial plinth and stepped pedestal, small golden flame sculpture at the very top. Front three-quarter architectural view, slim vertical composition. Engraved antique gold and warm ivory, no surrounding buildings or flags.

### julang-ngapak

a West Javanese Sundanese imah Julang Ngapak traditional wooden house, front three-quarter view, broad low thatched gabled roof with splayed wing-like overhanging eaves, crossed finials at gable apex, airy wooden porch, bamboo walls, short posts and small front steps. Sage-olive tint in the hatching with ivory highlights. Wide composition, simple rural West Java structure.

### gunungan

a single Javanese wayang kulit gunungan / kayon ornamental leather silhouette, vertical flame-shaped pointed leaf with flat pedestal and long narrow handle, intricate perforated symmetrical gold scrollwork of tree-of-life branches, stylized pavilion gate at base, traditional Javanese vegetal carving. Entire silhouette and handle visible, delicate cream and antique-gold ink, no face or person. Narrow tall composition.

### meru

a single Balinese pura Meru shrine, straight-on view, eleven progressively smaller dark-gold tiered thatched roofs tapering toward a pointed finial, square carved stone plinth with front steps and small timber shrine body. Fine Balinese stone carving detail, antique gold and ivory etching. Full structure isolated, narrow vertical composition.

### imah-jolopong

a Sundanese imah Jolopong wooden village house in West Java, long simple straight-ridge gabled roof covered in terracotta tiles, low front porch with timber posts, bamboo wall panels, front steps, wide horizontal facade viewed slightly from one side. Muted slate-blue and ivory engraved linework instead of gold. Wide composition, no upswept roof horns.

### talawang

a single traditional Dayak Talawang shield from Kalimantan, vertical elongated hexagonal wooden shield with sharply pointed top and bottom, authentic interlocking curvilinear aso motifs symmetrically painted in warm ivory, gold, deep maroon and black. Fine engraved aged wood details, vivid but sophisticated, straight-on complete shield view, narrow tall composition. No weapons, no face, no human.

### bubungan-tinggi

a South Kalimantan Banjarese Rumah Bubungan Tinggi house, front three-quarter architectural view. Very tall steep narrow central pitched roof above a long lower front porch roof and two lower side anjung wings, wooden carved balustrades and tall stilt columns with front staircase. Precise recognizably Banjar high-ridged timber architecture, no curved roof horns. Warm amber-gold engraving, wide composition.

### tropical-engraving

Use case: stylized-concept. Asset type: original portrait background illustration for traditional Indonesian wedding websites. An intricate antique copperplate engraving of a lush Indonesian tropical valley, elegant palm trees and broad tropical leaves framing left and right, distant terraced hills and soft mist, very pale calm open central space. Monochrome warm ivory, pale parchment and desaturated sepia ink only. Vertical 2:3 composition, detailed delicate fine hatching, paper grain extremely subtle, refined historic print, not photographic, not cartoon. No buildings, people, animals, text, symbols, borders, logos or watermark. Darker leaves toward the two lower corners, ample quiet middle for overlaid invitation content.

### oval-frame

Use case: stylized-concept. Asset type: original portrait photograph frame overlay for a traditional Indonesian wedding website. One tall elegant oval carved antique-gold frame, fine acanthus and floral relief with a small crest at top and bottom, refined detailed copperplate-engraved texture, subdued champagne-gold highlights, dark umber fine hatching. Frontal flat view, no perspective. Outer proportions 3:4, large absolutely EMPTY TRANSPARENT oval opening occupies 74% of width and 80% of height; both the inner hole and surrounding background must be genuinely transparent alpha. Frame fills 90% of canvas, complete edges with small safe margin. No image or color inside opening, no glass, no background, no text, no people, no logo, no extra objects.

### arch-frame

Use case: stylized-concept. Asset type: original engraved architectural frame overlay for traditional Indonesian wedding portrait photographs. Tall slender archway, delicate ivory stone columns on the two sides, semicircular carved arch with restrained botanical scrollwork at top. Antique etched illustration, warm ivory with muted golden-sepia engraving shadows, harmonious elegant proportions. Straight-on symmetrical front view, 3:4 vertical composition. Large completely EMPTY TRANSPARENT arched opening between the columns and beneath the arch, opening occupies 75% of width and 82% of height. Both interior and exterior transparent alpha. No floor, no landscape, no photo, no text, no people, no image in the opening, no logos. Complete frame with slight margins.

### penjor

Use case: stylized-concept. Asset type: original ornamental illustration for a Balinese wedding website. A single tall slender Balinese penjor ceremonial bamboo pole, gently arching dramatically to the right at the upper tip, beautifully hanging woven palm-leaf janur decorations, delicate tassels and small coconut-leaf ornaments following the curve. Fine antique copperplate engraving in champagne gold and warm ivory, delicate natural fibers. Full height visible, frontal view, genuine transparent background, not photorealistic. One object only, centered with small safe margins. No people, buildings, text, border, logo, ground or watermark.

## Implementation boundaries

- Ten narrow illustrated compositions; Jawa Timur retains the full-width photographic composition.
- Cover: 100dvh, recipient and date from the existing data; no new invitation copy or controls.
- Shared quote, couple, events/countdown, stories, gallery, RSVP/wishes, enabled gifts, music, and footer remain intact.
- GSAP motion uses the existing scoped context and matchMedia lifecycle; existing ScrollSmoother is created before ScrollTriggers. Reduced-motion keeps content accessible without animated scrolling.
- References: [GSAP ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/), [gsap.context](<https://gsap.com/docs/v3/GSAP/gsap.context()>), [gsap.matchMedia](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()>).
- Database addition is append-only in `1792281600_add_adat_invee_themes.js`; it does not remap or edit any wedding records. Restart a running PocketBase after manual migration to refresh its collection cache, per [PocketBase migrations](https://pocketbase.io/docs/js-migrations/).
