/**
 * Multi-pass preprocessing: build a list of ImageData variants to try decoding.
 * Each pass returns new ImageData. Pass metadata is used for DecodeResult.meta.preprocessingPass.
 * Transparent backgrounds are flattened onto white/black so decoders see clear contrast.
 */

import type { DecodeOptions } from "../types.js";
import { grayscaleLuma } from "./grayscale.js";
import { adaptiveThreshold, type ThresholdPreset } from "./threshold.js";
import { invert } from "./invert.js";
import { denoiseLight } from "./denoise.js";
import { colorHintBinarize } from "./colorHint.js";
import { flattenTransparent, hasTransparency } from "./flattenTransparent.js";

export interface PreprocessPass {
	name: string;
	run(imageData: ImageData, options: DecodeOptions): ImageData;
}

const LUMA = { name: "luma", run: (id: ImageData) => grayscaleLuma(id) };

function thresh(preset: ThresholdPreset): PreprocessPass {
	return {
		name: `adaptive-${preset}`,
		run: (id: ImageData) => adaptiveThreshold(grayscaleLuma(id), preset),
	};
}

const INVERT: PreprocessPass = {
	name: "invert",
	run: (id: ImageData) => invert(id),
};

const DENOISE: PreprocessPass = {
	name: "denoise",
	run: (id: ImageData) => denoiseLight(id),
};

function colorHintPass(options: DecodeOptions): PreprocessPass | null {
	const hint = options.colorHint;
	if (!hint?.foreground || !hint?.background) return null;
	return {
		name: "color-hint",
		run: (id: ImageData) =>
			colorHintBinarize(id, hint.foreground!, hint.background!),
	};
}

/**
 * Build ordered list of (pass name, imageData) to try.
 * tryInvert: if true, also try inverted version of each grayscale/threshold variant.
 * When the image has transparency, we flatten onto white and black and run the full pipeline
 * from both, so both normal and inverted transparent-background QRs decode.
 */
export function buildPreprocessPasses(
	initialImageData: ImageData,
	options: DecodeOptions,
): { name: string; imageData: ImageData }[] {
	const maxPasses = options.aggressive ? 12 : (options.maxPasses ?? 6);
	const tryInvert = options.tryInvert !== false;
	const out: { name: string; imageData: ImageData }[] = [];

	const passes: PreprocessPass[] = [
		LUMA,
		thresh("small"),
		thresh("medium"),
		thresh("large"),
		DENOISE,
	];
	const ch = colorHintPass(options);
	if (ch) passes.push(ch);

	let current: ImageData = initialImageData;
	if (hasTransparency(initialImageData)) {
		const flatWhite = flattenTransparent(initialImageData, "white");
		const flatBlack = flattenTransparent(initialImageData, "black");
		current = flatWhite;
		out.push({ name: "flatten-white", imageData: flatWhite });
		out.push({ name: "flatten-black", imageData: flatBlack });
		// Try luma + invert on black early (for inverted transparent: light modules on black)
		if (out.length < maxPasses) {
			const blackLuma = LUMA.run(flatBlack);
			out.push({ name: "flatten-black+luma", imageData: blackLuma });
			if (tryInvert && out.length < maxPasses) {
				out.push({
					name: "flatten-black+luma+invert",
					imageData: invert(blackLuma),
				});
			}
		}
	}

	// Main pipeline (from original or flatten-white when transparent)
	for (const p of passes) {
		if (out.length >= maxPasses) break;
		current = p.run(current, options);
		out.push({ name: p.name, imageData: current });
		if (tryInvert && out.length < maxPasses) {
			const inv = invert(current);
			out.push({ name: `${p.name}+invert`, imageData: inv });
		}
	}

	// When transparent: more passes from flatten-black (adaptive threshold etc.)
	if (hasTransparency(initialImageData) && out.length < maxPasses) {
		let currentBlack: ImageData = flattenTransparent(initialImageData, "black");
		for (const p of passes) {
			if (out.length >= maxPasses) break;
			currentBlack = p.run(currentBlack, options);
			out.push({ name: `flatten-black+${p.name}`, imageData: currentBlack });
			if (tryInvert && out.length < maxPasses) {
				out.push({
					name: `flatten-black+${p.name}+invert`,
					imageData: invert(currentBlack),
				});
			}
		}
	}
	return out.slice(0, maxPasses);
}
