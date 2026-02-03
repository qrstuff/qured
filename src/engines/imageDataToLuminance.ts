/**
 * Convert ImageData (RGBA) to luminance Uint8ClampedArray (width*height) for ZXing.
 * Uses 0.299R + 0.587G + 0.114B.
 */
export function imageDataToLuminance(imageData: ImageData): Uint8ClampedArray {
	const { data, width, height } = imageData;
	const len = width * height;
	const out = new Uint8ClampedArray(len);
	for (let i = 0, j = 0; i < data.length; i += 4, j++) {
		out[j] =
			(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) | 0;
	}
	return out;
}
