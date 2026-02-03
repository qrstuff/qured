/**
 * Qured – decode QR codes from images in browser and Node.js.
 * Input: File | Blob | ArrayBuffer | Uint8Array | base64 string.
 */

import type { DecodeInput, DecodeOptions, DecodeResult } from "./types.js";
import { inputToBlob } from "./normalizeInput.js";
import { loadImageFromBlob } from "./loadImage.js";
import { extractImageData } from "./canvasToImageData.js";
import { decodeFromImageData, decodeAllFromImageData } from "./decode.js";
import type {
	DecodeWorkerRequest,
	DecodeWorkerResponse,
	DecodeWorkerError,
} from "./worker/decodeWorker.js";

const DEFAULT_OPTIONS: Required<Pick<DecodeOptions, "worker">> = {
	worker: true,
};

function getWorkerUrl(): string {
	if (typeof import.meta !== "undefined" && import.meta.url) {
		return new URL("./decodeWorker.js", import.meta.url).href;
	}
	return "";
}

/**
 * Decode a single QR code from an image.
 * Accepts File, Blob, ArrayBuffer, Uint8Array, or base64/data URL string.
 * By default runs in a Web Worker; set `options.worker = false` to run on main thread (e.g. Node or debugging).
 */
export async function decode(
	input: DecodeInput,
	options: DecodeOptions = {},
): Promise<DecodeResult | null> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const blob = inputToBlob(input);

	if (opts.worker && typeof Worker !== "undefined") {
		const workerUrl = getWorkerUrl();
		if (workerUrl) {
			try {
				const buffer = await blob.arrayBuffer();
				return new Promise<DecodeResult | null>((resolve, reject) => {
					const worker = new Worker(workerUrl, { type: "module" });
					worker.onmessage = (
						ev: MessageEvent<DecodeWorkerResponse | DecodeWorkerError>,
					) => {
						worker.terminate();
						const d = ev.data;
						if (d.type === "result") resolve(d.result);
						else if (d.type === "error") reject(new Error(d.message));
						else resolve(null);
					};
					worker.onerror = () => {
						worker.terminate();
						resolve(runDecodeMain(blob, options));
					};
					worker.postMessage(
						{ type: "decode", buffer, options } as DecodeWorkerRequest,
						[buffer],
					);
				});
			} catch {
				// fall through to main thread
			}
		}
	}

	return runDecodeMain(blob, options);
}

async function runDecodeMain(
	blob: Blob,
	options: DecodeOptions,
): Promise<DecodeResult | null> {
	const source = await loadImageFromBlob(blob);
	const downscaleMaxDim = options.downscaleMaxDim ?? 1400;
	const imageData = await extractImageData(source, downscaleMaxDim);
	return decodeFromImageData(imageData, options);
}

/**
 * Decode from raw ImageData (e.g. from canvas). Skips image loading and worker; runs on current thread.
 */
export { decodeFromImageData };

/**
 * Decode all QR codes found (multiple results from multiple passes). Same inputs as decode().
 */
export async function decodeAll(
	input: DecodeInput,
	options: DecodeOptions = {},
): Promise<DecodeResult[]> {
	const blob = inputToBlob(input);
	const source = await loadImageFromBlob(blob);
	const downscaleMaxDim = options.downscaleMaxDim ?? 1400;
	const imageData = await extractImageData(source, downscaleMaxDim);
	return decodeAllFromImageData(imageData, options);
}

export type { DecodeInput, DecodeResult, DecodeOptions };
export type { DecodeEngine } from "./types.js";
