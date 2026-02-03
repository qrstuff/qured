import { createImageData } from "../imageDataLike.js";

/**
 * Invert luminance (R,G,B) for each pixel; alpha unchanged.
 */
export function invert(imageData: ImageData): ImageData {
	const { data, width, height } = imageData;
	const out = createImageData(width, height);
	const dst = out.data;
	for (let i = 0; i < data.length; i += 4) {
		dst[i] = 255 - data[i]!;
		dst[i + 1] = 255 - data[i + 1]!;
		dst[i + 2] = 255 - data[i + 2]!;
		dst[i + 3] = data[i + 3]!;
	}
	return out;
}
