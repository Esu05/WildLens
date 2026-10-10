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
├─ index.html
├─ package.json, package-lock.json
├─ vite.config.ts            Vite config and the service-worker precache plugin
├─ tailwind.config.js, postcss.config.js, tsconfig.json
├─ scripts/
│  ├─ build-taxa.ts          looks up taxonomy on GBIF, writes public/models/labels.json
│  └─ copy-ort.mjs           copies ONNX Runtime wasm into public/ort
├─ public/
│  ├─ sw.js, manifest.webmanifest
│  ├─ icon.svg, icon-maskable.svg
│  ├─ icons/                 PNG app icons
│  ├─ models/                bioclip_image.onnx, labels.json, text_embeddings.bin (not committed)
│  └─ ort/                   ONNX Runtime wasm files (generated, not committed)
└─ src/
   ├─ main.tsx, App.tsx      entry, view router, app shell
   ├─ index.css              colour tokens, light and dark themes
   ├─ ai/
   │  ├─ NatureIdentifier.ts   the interface the UI depends on, plus error codes
   │  ├─ BioClipIdentifier.ts  real inference with BioCLIP
   │  ├─ DemoIdentifier.ts     dev-only fake results (?demo=1)
   │  ├─ scoring.ts            softmax, thresholds, group fallback
   │  ├─ modelInfo.ts          model id, file URLs, cache check and delete
   │  └─ index.ts              lazy getIdentifier
   ├─ components/            Backdrop, BottomNav, shared UI
   ├─ data/                  species, general names and hazards, distractors
   ├─ domain/                types, species helpers, safety notes, challenges
   ├─ lib/                   format, geo, hooks, image, journal export
   ├─ screens/               Onboarding, Home, Camera, Preview, Analyze, Result, Journal, Entry, Settings
   ├─ state/settings.ts
   └─ storage/db.ts          IndexedDB wrapper
```

The UI only knows the `NatureIdentifier` interface, so the model can be swapped by changing `ai/index.ts` without touching any screen.

## Getting started

You need a recent Node version (Vite needs 20.19 or newer). Python is only needed once, in Google Colab, to export the model.

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

Open a new Google Colab notebook, upload `labels.json`, and run this in one cell:

<details>
<summary>Colab export cell</summary>

```python
!pip install -q open_clip_torch onnx

import json, torch, open_clip

model, _, _ = open_clip.create_model_and_transforms("hf-hub:imageomics/bioclip")
tokenizer = open_clip.get_tokenizer("hf-hub:imageomics/bioclip")
model.eval()
print("logit scale:", model.logit_scale.exp().item())  # if not about 100, set LOGIT_SCALE in src/ai/scoring.ts

class ImageEncoder(torch.nn.Module):
    def __init__(self, m):
        super().__init__()
        self.m = m
    def forward(self, x):
        return self.m.encode_image(x, normalize=True)

# if you get "unexpected keyword 'dynamo'", delete that argument
torch.onnx.export(
    ImageEncoder(model), torch.randn(1, 3, 224, 224), "bioclip_image.onnx",
    input_names=["pixel_values"], output_names=["embedding"],
    dynamic_axes={"pixel_values": {0: "batch"}}, opset_version=17, dynamo=False,
)

labels = json.load(open("labels.json"))
prompts = [f"a photo of {s['taxon']}" for s in labels["species"]] + labels["distractors"]
vecs = []
with torch.no_grad():
    for i in range(0, len(prompts), 64):
        vecs.append(model.encode_text(tokenizer(prompts[i:i + 64]), normalize=True))
emb = torch.cat(vecs)
assert emb.shape[1] == labels["dim"]
emb.numpy().astype("float32").tofile("text_embeddings.bin")

from google.colab import files
for f in ["bioclip_image.onnx", "text_embeddings.bin"]:
    files.download(f)
```

</details>

Put the two downloads in `public/models/` next to `labels.json`. The image encoder is roughly 330 MB. Rerun the cell whenever the species list or the distractors change.

### 3. Run it

```bash
npm run dev
```

Open the printed URL. The first run downloads the model and caches it with the Cache API. `?demo=1` switches to fake results for UI work.

## Deploying

WildLens is a static site, so any static host works. Both Vercel and Render are fine.

**Before you deploy**

- The model file is too big for GitHub (100 MB per file limit). Host `bioclip_image.onnx`, `text_embeddings.bin` and `labels.json` in a Hugging Face model repo and point the build at it with the `VITE_MODEL_HOST` environment variable, for example `https://huggingface.co/<user>/<repo>/resolve/main`. Vite reads it at build time, so redeploy after changing it.
- Keep `node_modules/`, `dist/`, `public/models/` and `public/ort/` in `.gitignore`.
- The build must run `scripts/copy-ort.mjs` so `public/ort/` exists. Check that `package.json` calls it from a `prebuild` or `postinstall` script.
- The service-worker precache plugin in `vite.config.ts` must not include `models/`, or every visitor downloads the model on first load. The app downloads it itself, once, with progress.
- Camera access needs HTTPS. Both hosts provide it by default.

**Render**

Create a Static Site from the repo with build command `npm ci && npm run build` and publish directory `dist`. Add `VITE_MODEL_HOST` as an environment variable. Under Redirects/Rewrites add a rewrite from `/*` to `/index.html`. If the build complains about the Node version, set `NODE_VERSION` to `22`.

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
