import { createImageData } from "../imageDataLike.js";

/**
 * Light denoise: box blur radius 1 (3x3). Conservative.
 */
export function denoiseLight(imageData: ImageData): ImageData {
	const { data, width, height } = imageData;
	const out = createImageData(width, height);
	const dst = out.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0,
				g = 0,
				b = 0,
				a = 0,
				n = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const ny = y + dy;
					const nx = x + dx;
					if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
						const i = (ny * width + nx) << 2;
						r += data[i]!;
						g += data[i + 1]!;
						b += data[i + 2]!;
						a += data[i + 3]!;
						n++;
					}
				}
			}
			const i = (y * width + x) << 2;
			dst[i] = n ? (r / n) | 0 : data[i]!;
			dst[i + 1] = n ? (g / n) | 0 : data[i + 1]!;
			dst[i + 2] = n ? (b / n) | 0 : data[i + 2]!;
			dst[i + 3] = n ? (a / n) | 0 : data[i + 3]!;
		}
	}
	return out;
}
