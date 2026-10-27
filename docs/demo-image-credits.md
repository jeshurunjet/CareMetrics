# Demonstration image credits

These images illustrate fictional CareMetrics records. They do **not** depict the fictional addresses or imply affiliation, occupancy or endorsement. No client or employee photograph is used. Licence and individual photo pages checked on 27 October 2026.

| Local asset | Creator and verified original page | Licence | Local preparation |
| --- | --- | --- | --- |
| `public/demo/houses/house-1.webp` | Alexander F Ungerer — [Elegant Residential Home Exterior with Lush Garden](https://www.pexels.com/photo/elegant-residential-home-exterior-with-lush-garden-31391054/) | [Pexels licence](https://www.pexels.com/license/) | 1200×720 WebP, quality 80, landscape crop |
| `public/demo/houses/house-2.webp` | Get Lost Mike — [House Exterior during Daytime](https://www.pexels.com/photo/house-exterior-during-daytime-6422939/) | [Pexels licence](https://www.pexels.com/license/) | Source resized to 1600px; crop left 420/top 0/1180×1067, then 1200×720 WebP quality 80; excludes house number |
| `public/demo/houses/house-3.webp` | Clay Elliot — [White Wooden House Near Green Trees](https://www.pexels.com/photo/white-wooden-house-near-green-trees-8894806/) | [Pexels licence](https://www.pexels.com/license/) | Source resized to 1600px; crop left 800/top 0/800×1067, then 1200×720 WebP quality 80; excludes house number |

The Pexels licence permits free website/app use and modification; credit is appreciated rather than required. These are incorporated application illustrations, not redistributed as a competing stock collection or sold as unmodified prints. Crops were visually inspected: no visible occupants, readable number, registration plate, watermark or advertising sign. Photos are overseas residential architecture; no claim of a specific New Zealand building is made. Rejected candidates are outside the repository.

House mapping is operator-controlled: Harbour House → house-1; Meadow House → house-2; Kowhai House → house-3. The first two are included on fresh fictional seeds; the third exists only in the exact populated staging polish plan. Unknown houses retain the existing unavailable-image fallback.

`public/demo/avatars/portrait-01.svg` through `portrait-16.svg` are original local geometric illustrations created for CareMetrics. No external avatar API, personal photograph, font or third-party avatar artwork is used. Stable record IDs map to illustrations in `src/lib/demo-media.ts`; existing ten staff/client profiles have distinct explicitly assigned portraits. Future unlisted IDs use a deterministic local hash into the remaining illustration set; collisions for future profiles are possible. Colours/features are decorative and convey no inferred personal characteristics. Initials remain the fallback if loading fails.
