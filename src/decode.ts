/**
 * Decode orchestration: try native (async) then ZXing on each preprocess pass until success.
 */

import type { DecodeOptions, DecodeResult } from "./types.js";
import { buildPreprocessPasses } from "./preprocess/index.js";
import { nativeDecode } from "./engines/native.js";
import { zxingEngine } from "./engines/zxing.js";

const DEFAULT_OPTIONS: Required<
	Pick<
		DecodeOptions,
		"aggressive" | "maxPasses" | "downscaleMaxDim" | "tryInvert" | "worker"
	>
> = {
	aggressive: false,
	maxPasses: 6,
	downscaleMaxDim: 1400,
	tryInvert: true,
	worker: true,
};

export async function decodeFromImageData(
	imageData: ImageData,
	options: DecodeOptions = {},
): Promise<DecodeResult | null> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const passes = buildPreprocessPasses(imageData, opts);

	// Try native first on original (browser only, async)
	const nativeResult = await nativeDecode(imageData);
	if (nativeResult)
		return {
			...nativeResult,
			meta: { ...nativeResult.meta, engine: "native" },
		};

	for (const { name, imageData: passData } of passes) {
		const nativePass = await nativeDecode(passData);
		if (nativePass) {
			return {
				...nativePass,
				meta: {
					engine: "native",
					...nativePass.meta,
					preprocessingPass: name,
					inverted: name.includes("invert"),
				},
			};
		}
		const zx = zxingEngine.decode(passData);
		if (zx) {
			return {
				...zx,
				meta: {
					engine: "zxing",
					...zx.meta,
					preprocessingPass: name,
					inverted: name.includes("invert"),
				},
			};
		}
	}
	return null;
}

export async function decodeAllFromImageData(
	imageData: ImageData,
	options: DecodeOptions = {},
): Promise<DecodeResult[]> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const passes = buildPreprocessPasses(imageData, opts);
	const seen = new Set<string>();
	const results: DecodeResult[] = [];

	const nativeResult = await nativeDecode(imageData);
	if (nativeResult && !seen.has(nativeResult.text)) {
		seen.add(nativeResult.text);
		results.push({
			...nativeResult,
			meta: { ...nativeResult.meta, engine: "native" },
		});
	}

	for (const { name, imageData: passData } of passes) {
		const nativePass = await nativeDecode(passData);
		if (nativePass && !seen.has(nativePass.text)) {
			seen.add(nativePass.text);
			results.push({
				...nativePass,
				meta: { engine: "native", ...nativePass.meta, preprocessingPass: name },
			});
		}
		const zx = zxingEngine.decode(passData);
		if (zx && !seen.has(zx.text)) {
			seen.add(zx.text);
			results.push({
				...zx,
				meta: { engine: "zxing", ...zx.meta, preprocessingPass: name },
			});
		}
	}
	return results;
}
