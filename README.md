# WildLens

Point your phone at a plant, bird, animal or insect and find out what it is. An open-weight vision model runs inside your browser, so your photos never leave your device.

WildLens is a mobile-first, offline-first PWA with a calm "field notebook" look. It is built for the DEV "Touch Grass" challenge: an excuse to go outside, look closely at what is living around you, and keep notes.

## Features

- **On-device identification.** The model runs in the browser with WebAssembly. Nothing is uploaded.
- **Honest uncertainty.** Results are confident, uncertain (top 3 candidates plus a best guess at the group, such as the cat family) or "no subject found". The app never forces a guess.
- **Safety notes.** Shown for anything hazardous. Plants always carry "never eat from photo".
- **Look closer.** A short observation prompt for each category, to get you noticing details instead of just tapping a result.
- **Field journal.** Observations are saved locally in IndexedDB with notes and optional approximate location. Export and clear are built in.
- **Works offline.** After the first model download, everything runs without a connection.
- **Light and dark themes**, onboarding, and a settings screen for model download and removal.

## How identification works

1. The photo is center-cropped to a square, resized to 224 x 224 and normalized.
2. The image encoder of BioCLIP, exported to ONNX, runs through ONNX Runtime Web (WASM) and produces a 512-dimensional embedding.
3. That embedding is compared by cosine similarity with precomputed text embeddings, one per species (built from its full taxonomic string) plus a set of "not nature" prompts.
4. A softmax over all labels gives probabilities. Scoring turns them into a result:
   - **Confident:** one species is clearly ahead.
   - **Uncertain:** top 3 species, plus a group guess (genus, family, order or class) when the species is unclear but the group is.
   - **No subject:** a "not nature" prompt beats every species.

Species are just text, so adding one never needs retraining. Only the image encoder runs on the device. Text embeddings are computed once, offline.

## Tech stack

- React, TypeScript, Vite, Tailwind CSS
- [BioCLIP](https://huggingface.co/imageomics/bioclip) (ViT-B/16, MIT licence, Imageomics Institute), exported to ONNX
- ONNX Runtime Web (WASM), served from `/ort/`
- IndexedDB for the journal, localStorage for settings, a small history-based router
- Service worker and web manifest for the PWA
- GBIF species match API, used at build time only, to fill in taxonomy

## Project structure

```
wildlens/
├─ index.html, package.json, vite.config.ts, tailwind.config.js, tsconfig.json
├─ render.yaml                   Render static-site blueprint
├─ scripts/
│  ├─ copy-ort.mjs               copies ONNX Runtime wasm into public/ort
│  └─ build-taxa.ts              looks up taxonomy on GBIF, writes public/models/labels.json
├─ public/
│  ├─ sw.js, manifest.webmanifest, icons/
│  ├─ ort/                       generated, not committed
│  └─ models/                    model files, not committed (see below)
└─ src/
   ├─ main.tsx, App.tsx
   ├─ ai/
   │  ├─ NatureIdentifier.ts     the interface the UI depends on
   │  ├─ BioClipIdentifier.ts    real inference
   │  ├─ DemoIdentifier.ts       dev-only fake results (?demo=1)
   │  ├─ scoring.ts              softmax, thresholds, group fallback
   │  ├─ modelInfo.ts            model id, file URLs, cache check and delete
   │  └─ index.ts                lazy getIdentifier
   ├─ data/                      species, general names and hazards, distractors
   ├─ domain/                    types, species helpers, safety, challenges
   ├─ screens/                   Onboarding, Home, Camera, Preview, Analyze, Result, Journal, Entry, Settings
   ├─ components/, lib/, state/, storage/
```

## Getting started

You need Node 20 or newer. Python is only needed once, in Google Colab, to export the model.

```bash
git clone https://github.com/Esu05/wildlens.git
cd wildlens
npm install
```

### 1. Build the label file

```bash
npx tsx scripts/build-taxa.ts
```

This looks up each species on GBIF and writes `public/models/labels.json`. Anything it cannot resolve is printed at the end. Add those to `OVERRIDES` in the script and run it again.

### 2. Export the model (once)

Open a new Google Colab notebook, upload `labels.json`, and run the export cell from [`docs/export-bioclip.md`](docs/export-bioclip.md). It produces two files:

- `bioclip_image.onnx` (the image encoder, roughly 330 MB)
- `text_embeddings.bin` (the precomputed species and distractor embeddings)

Put both in `public/models/` next to `labels.json`. Rerun the export whenever the species list or the distractors change.

### 3. Run it

```bash
npm run dev
```

Open the printed URL. The first run downloads the model and caches it with the Cache API. `?demo=1` switches to fake results for UI work.

## Deploying on Render

Render hosts the app as a static site. The model files are too big for GitHub (100 MB per file limit), so they live on Hugging Face and the app downloads them from there on first use.

1. **Host the model files.** Create a model repo on Hugging Face and upload `bioclip_image.onnx`, `text_embeddings.bin` and `labels.json` to it. The base URL is `https://huggingface.co/<user>/<repo>/resolve/main`.
2. **Push the code.** Keep `public/models/` and `public/ort/` in `.gitignore`.
3. **Create the site.** In Render choose New, then Blueprint, and select this repo. It reads `render.yaml`. Or create a Static Site by hand:
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
   - Rewrite rule: `/*` to `/index.html` (the app uses client-side routing)
4. **Set the environment variable** `VITE_MODEL_HOST` to the Hugging Face base URL from step 1. Vite reads it at build time, so redeploy after changing it.
5. The build must run `scripts/copy-ort.mjs` so `public/ort/` exists. Check that `package.json` calls it from a `prebuild` or `postinstall` script.

Camera access needs HTTPS. Render provides it by default.

## Privacy

- Photos are processed on the device and never uploaded.
- Journal entries live in IndexedDB on the device. Location is optional and rounded to about 1 km.
- The only network requests are the one-time model download and the app files themselves.

## Limitations and safety

- Identification is zero-shot against a fixed species list of a few hundred entries. Anything outside the list will be matched to something similar, or reported as uncertain.
- Look-alikes are the hard part: similar small birds, frogs, grasses, big cats at odd angles. Use the top 3 and the "Look closer" prompts, not just the first answer.
- A blurry photo, a tiny subject or a cluttered background will lower accuracy for any model.
- **Never use WildLens to decide whether a plant or mushroom is safe to eat, or whether an animal is safe to handle.** It is a field-notebook companion, not a safety tool.

## Credits

- [BioCLIP](https://huggingface.co/imageomics/bioclip) by the Imageomics Institute (MIT licence). Stevens et al., "BioCLIP: A Vision Foundation Model for the Tree of Life", CVPR 2024.
- [ONNX Runtime Web](https://onnxruntime.ai/) for in-browser inference.
- [GBIF](https://www.gbif.org/) for taxonomy.


## License

See the `LICENSE` file.
