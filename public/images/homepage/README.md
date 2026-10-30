# Homepage photography

These decorative images were generated with the built-in Image Gen tool on 2026-10-30 for the selected cinematic-maroon homepage direction. They are illustrative compositions, not photographs of available listings or actual staff. Property cards continue to use their backend-provided listing photographs and demo disclosures.

- `hero.webp`: 1600 × 914; contemporary apartment terrace overlooking water and a Dubai-inspired skyline at golden hour. Original generation: `exec-baf6e9ae-7b00-49d5-ab96-4c75f5d01f2d.png`.
- `dubai-marina.webp`: 800 × 533; elevated marina, yachts and towers. Original: `exec-7b97c749-2993-456a-9595-d85a87f239ae.png`.
- `downtown-dubai.webp`: 800 × 533; Downtown Dubai-inspired skyline with Burj Khalifa. Original: `exec-260b7432-4b65-413c-bb84-2c554262bd9f.png`.
- `palm-jumeirah.webp`: 800 × 533; illustrative aerial of the palm-shaped island. Original: `exec-ae858ed9-9f2d-41b6-953d-6d0a9eda01a3.png`.
- `guidance.webp`: 1000 × 667; fictional advisor and adult clients in an apartment discussion. Original: `exec-c36db530-0cd0-4d43-a424-a65b93dd9158.png`.

Original PNGs remain in the local generated-image library; the committed WebP files are self-contained frontend assets. Existing Sharp tooling resized/encoded individual generated photographs at quality 82; no screenshot crops, remote image dependencies or new packages were used. Only the hero loads eagerly; other photography is lazy-loaded with reserved dimensions. These assets do not require backend storage or database records.
