import { createImageData } from "../imageDataLike.js";

/**
 * Luminance grayscale using luma weights: 0.299R + 0.587G + 0.114B
 */
export function grayscaleLuma(imageData: ImageData): ImageData {
	const { data, width, height } = imageData;
	const out = createImageData(width, height);
	const dst = out.data;
	for (let i = 0; i < data.length; i += 4) {
		const l =
			(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) | 0;
		dst[i] = dst[i + 1] = dst[i + 2] = l;
		dst[i + 3] = data[i + 3]!;
	}
	return out;
}
