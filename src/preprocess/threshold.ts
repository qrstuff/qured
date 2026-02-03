/**
 * Adaptive (local) thresholding with configurable window size.
 * Presets: small (8), medium (16), large (32).
 */
export type ThresholdPreset = "small" | "medium" | "large";

import { createImageData } from "../imageDataLike.js";

const WINDOW: Record<ThresholdPreset, number> = {
	small: 8,
	medium: 16,
	large: 32,
};

function getLuma(data: Uint8ClampedArray, i: number): number {
	return (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) | 0;
}

export function adaptiveThreshold(
	imageData: ImageData,
	preset: ThresholdPreset = "medium",
): ImageData {
	const { data, width, height } = imageData;
	const out = createImageData(width, height);
	const dst = out.data;
	const radius = WINDOW[preset];
	const half = radius >> 1;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let sum = 0;
			let count = 0;
			for (let dy = -half; dy <= half; dy++) {
				for (let dx = -half; dx <= half; dx++) {
					const ny = Math.max(0, Math.min(height - 1, y + dy));
					const nx = Math.max(0, Math.min(width - 1, x + dx));
					const i = (ny * width + nx) << 2;
					sum += getLuma(data, i);
					count++;
				}
			}
			const mean = count > 0 ? sum / count : 0;
			const i = (y * width + x) << 2;
			const l = getLuma(data, i);
			const v = l <= mean ? 0 : 255;
			dst[i] = dst[i + 1] = dst[i + 2] = v;
			dst[i + 3] = data[i + 3]!;
		}
	}
	return out;
}
