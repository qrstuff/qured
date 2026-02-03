# Qured

**Qured** is a JavaScript library that decodes **QR codes from images** entirely in the client — in the browser and in Node.js. No server, no camera, no external services. You pass an image (file, blob, buffer, or base64 string) and get back the decoded text.

---

## Purpose

- Decode QR codes from **static images** (PNG, JPEG, etc.) in **browser** and **Node.js**.
- Support **stylized** QRs: custom colors, gradients, center logos, transparent or inverted backgrounds, as long as finder patterns and contrast are preserved.
- Work **offline** and keep decoding logic **client-side** for privacy and simplicity.
- Accept **multiple input types**: `File`, `Blob`, `ArrayBuffer`, `Uint8Array`, or base64/data URL string.

---

## Features

- **Multi-input**: `File`, `Blob`, `ArrayBuffer`, `Uint8Array`, or base64/data URL string.
- **Dual engine**: Uses native **BarcodeDetector** when available (e.g. Chrome), otherwise **ZXing** with multi-pass preprocessing.
- **Preprocessing**: Luminance grayscale, adaptive thresholding (small/medium/large), inversion, transparent-background flatten (white/black), light denoise — tried in sequence until decode succeeds.
- **Transparent backgrounds**: Flattens transparent pixels onto white or black so normal and inverted transparent QRs decode.
- **Web Worker**: Decoding runs in a worker by default in the browser to avoid blocking the main thread; `worker: false` for Node or debugging.
- **Extensible**: Engine interface is generic so additional barcode formats can be added later without breaking the public API.
- **TypeScript**: Typed API and shipped `.d.ts`.

---

## Requirements

- **Browser**: Modern Chrome, Firefox, Safari (ES2020). Worker support for off-thread decoding.
- **Node.js**: `>= 18`. For decoding from image buffers (e.g. file path → buffer), the optional **canvas** package is required; without it, only `decodeFromImageData()` with your own `ImageData` is supported.

---

## Install

```bash
yarn add @qrstuff/qured
```

For **Node.js** image loading (decoding from file paths or raw buffers), add the optional dependency:

```bash
yarn add canvas
```

---

## Usage

### Browser

```js
import { decode } from "@qrstuff/qured";

// From <input type="file">
const file = document.querySelector('input[type="file"]').files[0];
const result = await decode(file);
console.log(result?.text ?? "No QR found");

// From Blob, ArrayBuffer, or base64 / data URL
const fromBlob = await decode(blob);
const fromBuffer = await decode(arrayBuffer);
const fromBase64 = await decode("data:image/png;base64,...");
```

Serve the built `dist/` (including `qured.js`, `decodeWorker.js`, and any chunk files) so the worker can load. To run decoding on the main thread (e.g. for debugging), pass `{ worker: false }`.

### Node.js

```js
import { decode } from "@qrstuff/qured";
import { readFileSync } from "fs";

const buffer = readFileSync("./qrcode.png");
const result = await decode(buffer, { worker: false });
console.log(result?.text);
```

In Node, use `{ worker: false }`; worker URL resolution is intended for the browser. Install the optional **canvas** package so Qured can decode image buffers; without it, only `decodeFromImageData()` with your own `ImageData` is supported.

### Decode from raw ImageData

If you already have `ImageData` (e.g. from a canvas), you can skip image loading and worker:

```js
import { decodeFromImageData } from "@qrstuff/qured";

const imageData = ctx.getImageData(0, 0, width, height);
const result = await decodeFromImageData(imageData);
```

### Decode all variants

To get every result found across preprocessing passes (e.g. for multi-QR or debugging):

```js
import { decodeAll } from "@qrstuff/qured";

const results = await decodeAll(fileInput.files[0]);
results.forEach(r => console.log(r.text, r.meta?.preprocessingPass));
```

---

## API

| Function | Description |
| --- | --- |
| `decode(input, options?)` | Decode one QR from an image. Returns `Promise<DecodeResult \| null>`. |
| `decodeFromImageData(imageData, options?)` | Decode from raw `ImageData`. Returns `Promise<DecodeResult \| null>`. |
| `decodeAll(input, options?)` | Same inputs as `decode`; returns `Promise<DecodeResult[]>` with all results from preprocessing passes. |

**Input types:** `File | Blob | ArrayBuffer | Uint8Array | string` (base64 or data URL).

### DecodeResult

```ts
interface DecodeResult {
  text: string;
  format: "QR_CODE";
  points?: { x: number; y: number }[]; // finder/corner points if available
  meta?: {
    engine: "native" | "zxing";
    inverted?: boolean;
    preprocessingPass?: string; // e.g. 'luma', 'flatten-white', 'luma+invert'
  };
}
```

On failure, `decode` and `decodeFromImageData` return `null` (no throw).

### DecodeOptions

```ts
interface DecodeOptions {
  aggressive?: boolean; // default false — more preprocessing passes
  maxPasses?: number; // default 6 (12 if aggressive)
  downscaleMaxDim?: number; // default 1400 — max width/height before downscale
  tryInvert?: boolean; // default true — try inverted luminance
  colorHint?: {
    foreground?: [number, number, number]; // RGB
    background?: [number, number, number]; // RGB
  };
  worker?: boolean; // default true in browser; use false in Node
}
```

---

## Behaviour and limitations

- **Stylized QRs:** Optimized for codes that keep finder patterns (mostly square) and a quiet zone, with sufficient luminance contrast. Custom colors, gradients, and center logos are supported when contrast is adequate. Transparent and inverted transparent backgrounds are handled via flatten passes.
- **Not supported:** QRs without a quiet zone, merged modules, or finder patterns replaced by decorative shapes. No guarantee for “irresponsibly designed” codes.
- **Engines:** Uses native `BarcodeDetector` when available and when it supports QR; otherwise falls back to ZXing with multi-pass preprocessing (grayscale, adaptive threshold, inversion, flatten transparent, light denoise).
- **Worker:** In the browser, decoding runs in a Web Worker by default. Serve the full `dist/` so the worker script and chunks can load. Set `worker: false` to run on the main thread (e.g. Node or debugging).

---

## Build

```bash
yarn build
```

Produces `dist/qured.js`, `dist/decodeWorker.js`, and chunk files, plus TypeScript declarations under `dist/`. No minification by default.

---

## Testing

Tests live under `test/node/` (Mocha) and `test/browser/` (Playwright + Mocha harness).

### Node (Mocha)

Tests in `test/node/decode-test.js` use **Mocha** and **Chai**.

```bash
yarn test
```

- **Must decode:** Asserts that each of a set of sample images (basic, colored, gradient, inverted, transparent, shaped-1, shaped-2) decodes successfully and returns a result with `text` and `format: 'QR_CODE'`.
- **Must fail:** Asserts that certain “bad” samples (e.g. `shaped-3-bad.png`) return `null`, documenting out-of-scope or irresponsibly designed QRs.

Requires the optional **canvas** dependency so Node can load image files from `data/`. Run from the project root.

### Browser (Playwright)

Browser tests run the same decode logic in real browsers (Chromium, Firefox) via **Playwright**.

```bash
yarn build
npx playwright install chromium firefox   # first run only
yarn test:browser
```

The harness (`test/browser/browser-test.html`) loads Mocha, Chai, and Qured; `test/browser/decode-test.js` runs the decode tests. Playwright starts a static server, loads the harness, and asserts all Mocha tests passed.

---

## Releasing

Push a version tag (e.g. `v1.0.0`) to trigger the release workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will run tests, publish to npm, and create a GitHub release with a changelog of commit messages since the previous tag. Configure the `NPM_TOKEN` repository secret (npm → Access Tokens) with publish permission.

---

## License

MIT
