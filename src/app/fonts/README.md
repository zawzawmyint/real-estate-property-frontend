# Self-hosted fonts

Original TrueType assets from the official [Google Fonts repository](https://github.com/google/fonts/tree/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl), pinned to commit `e7db6ca603fd4862010383ff17ffd6cc4ffac1c0`:

- [Poppins Regular](https://github.com/google/fonts/blob/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl/poppins/Poppins-Regular.ttf): normal 400.
- [Poppins Medium](https://github.com/google/fonts/blob/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl/poppins/Poppins-Medium.ttf): normal 500.
- [Poppins SemiBold](https://github.com/google/fonts/blob/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl/poppins/Poppins-SemiBold.ttf): normal 600.
- [Lora variable](https://github.com/google/fonts/blob/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl/lora/Lora%5Bwght%5D.ttf): normal 400–700, saved locally as `Lora-Variable.ttf`. Public display text and the wordmark use 400.

Each family is distributed under the SIL Open Font License 1.1. Unmodified copies are included as [Poppins-OFL.txt](Poppins-OFL.txt) and [Lora-OFL.txt](Lora-OFL.txt), from the same family directories and commit. No font outlines or metadata were modified.

`src/app/layout.tsx` loads these assets with `next/font/local` and exports CSS variables. `src/styles/tokens.css` maps Poppins to `font-sans` and Lora to `font-display`. Browser font requests stay on the application's own origin; builds need no Google Fonts request.
