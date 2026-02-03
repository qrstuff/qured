import { createImageData } from "../imageDataLike.js";

/**
 * Color distance threshold: binarize by distance to foreground/background.
 * If no hint, skip (caller can use raw grayscale or other passes).
 */
export function colorDistanceThreshold(
	imageData: ImageData,
	foreground: [number, number, number],
	background: [number, number, number],
	midpoint = 0.5,
): ImageData {
	const { data, width, height } = imageData;
	const out = createImageData(width, height);
	const dst = out.data;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i]!,
			g = data[i + 1]!,
			b = data[i + 2]!;
		const dF = Math.sqrt(
			(r - foreground[0]) ** 2 +
				(g - foreground[1]) ** 2 +
				(b - foreground[2]) ** 2,
		);
		const dB = Math.sqrt(
			(r - background[0]) ** 2 +
				(g - background[1]) ** 2 +
				(b - background[2]) ** 2,
		);
		const v = dF <= dB ? 0 : 255;
		dst[i] = dst[i + 1] = dst[i + 2] = v;
		dst[i + 3] = data[i + 3]!;
	}
	return out;
}

function luminance(r: number, g: number, b: number): number {
	return (0.299 * r + 0.587 * g + 0.114 * b) | 0;
}

/**
 * Binarize by luminance with optional foreground/background hint.
 * If hint given, threshold at midpoint between mean luminance of fg and bg regions.
 */
export function colorHintBinarize(
	imageData: ImageData,
	foreground?: [number, number, number],
	background?: [number, number, number],
): ImageData {
	const { data, width, height } = imageData;
	const out = createImageData(width, height);
	const dst = out.data;

	if (foreground && background) {
		const thresh =
			(luminance(foreground[0], foreground[1], foreground[2]) +
				luminance(background[0], background[1], background[2])) >>
			1;
		for (let i = 0; i < data.length; i += 4) {
			const l = luminance(data[i]!, data[i + 1]!, data[i + 2]!);
			const v = l <= thresh ? 0 : 255;
			dst[i] = dst[i + 1] = dst[i + 2] = v;
			dst[i + 3] = data[i + 3]!;
		}
	} else {
		// Simple Otsu-like: use mean luminance as threshold
		let sum = 0,
			n = 0;
		for (let i = 0; i < data.length; i += 4) {
			sum += luminance(data[i]!, data[i + 1]!, data[i + 2]!);
			n++;
		}
		const thresh = n ? sum / n : 128;
		for (let i = 0; i < data.length; i += 4) {
			const l = luminance(data[i]!, data[i + 1]!, data[i + 2]!);
			const v = l <= thresh ? 0 : 255;
			dst[i] = dst[i + 1] = dst[i + 2] = v;
			dst[i + 3] = data[i + 3]!;
		}
	}
	return out;
}
