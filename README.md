# Carson McRae

A static portfolio of product work: case studies of Southern Surface Company, PicPledge, Recalen and TTSNative (an open-source app, formerly Local TTS), plus how TTSNative's studio voice was evaluated.

Visit https://carsonmcrae.github.io/.

The case studies describe products owned, designed, and developed by Carson McRae. PicPledge's and Recalen's application source is private; TTSNative's is public at https://github.com/carsonmcrae/ttsnative.

## Editing

The pages are plain HTML and CSS, edited directly; there is no build step. When `styles.css`, `theme.js` or `nav.js` changes, set the `?v=` value in every page's link to it to the first 12 hex digits of the file's SHA-256, so browsers fetch the new version.

## Southern Surface Company

The [case study](southern-surface/) includes public website screenshots and owner-reported results (150 new leads and 5 jobs last month, reported October 22, 2026). Those results are distinct from the invented records in the [interactive prototype](southern-surface/demo/). No operational source or customer records are included.

Serve the repository with any static HTTP server; module scripts require HTTP rather than opening HTML directly. Run `node --test southern-surface/demo/model.test.mjs` and `node scripts/check-ssc.mjs` from the repository root. See [validation and security boundaries](southern-surface/VALIDATION.md). There is no build step.
