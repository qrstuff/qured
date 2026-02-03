import { createImageData } from "../imageDataLike.js";

/**
 * Flatten transparent pixels onto a solid background so decoders see clear contrast.
 * Transparent/semi-transparent pixels become the background color; opaque pixels unchanged.
 * Use white for normal QRs (dark on light), black for inverted (light on dark).
 */
const DEFAULT_ALPHA_THRESHOLD = 252;

export function flattenTransparent(
	imageData: ImageData,
	background: "white" | "black",
	alphaThreshold: number = DEFAULT_ALPHA_THRESHOLD,
): ImageData {
	const { data, width, height } = imageData;
	const out = createImageData(width, height);
	const dst = out.data;
	const [r, g, b] = background === "white" ? [255, 255, 255] : [0, 0, 0];

	for (let i = 0; i < data.length; i += 4) {
		const a = data[i + 3]!;
		if (a <= alphaThreshold) {
			dst[i] = r;
			dst[i + 1] = g;
			dst[i + 2] = b;
		} else {
			dst[i] = data[i]!;
			dst[i + 1] = data[i + 1]!;
			dst[i + 2] = data[i + 2]!;
		}
		dst[i + 3] = 255;
	}
	return out;
}

/** Returns true if image has any pixel with alpha < 255. */
export function hasTransparency(
	imageData: ImageData,
	threshold = 252,
): boolean {
	const { data } = imageData;
	for (let i = 3; i < data.length; i += 4) {
		if (data[i]! <= threshold) return true;
	}
	return false;
}
