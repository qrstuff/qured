/**
 * Web Worker: receives buffer + options, loads image, extracts ImageData, decodes, returns result.
 */

import { loadImageFromBlob } from "../loadImage.js";
import { extractImageData } from "../canvasToImageData.js";
import { decodeFromImageData } from "../decode.js";
import type { DecodeOptions, DecodeResult } from "../types.js";

export type DecodeWorkerRequest = {
	type: "decode";
	buffer: ArrayBuffer;
	options: DecodeOptions;
};

export type DecodeWorkerResponse = {
	type: "result";
	result: DecodeResult | null;
};

export type DecodeWorkerError = {
	type: "error";
	message: string;
};

async function runDecode(
	buffer: ArrayBuffer,
	options: DecodeOptions,
): Promise<DecodeResult | null> {
	const blob = new Blob([buffer]);
	const source = await loadImageFromBlob(blob);
	const downscaleMaxDim = options.downscaleMaxDim ?? 1400;
	const imageData = await extractImageData(source, downscaleMaxDim);
	return decodeFromImageData(imageData, options);
}

self.onmessage = async (ev: MessageEvent<DecodeWorkerRequest>) => {
	const msg = ev.data;
	if (msg?.type !== "decode") return;
	const post = (
		self as unknown as {
			postMessage(data: DecodeWorkerResponse | DecodeWorkerError): void;
		}
	).postMessage;
	try {
		const result = await runDecode(msg.buffer, msg.options);
		post({ type: "result", result } as DecodeWorkerResponse);
	} catch (err) {
		post({
			type: "error",
			message: err instanceof Error ? err.message : String(err),
		} as DecodeWorkerError);
	}
};
