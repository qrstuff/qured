/**
 * Create ImageData-like object (data, width, height). Uses global ImageData in browser;
 * in Node (no ImageData) returns a plain object with Uint8ClampedArray.
 */
export function createImageData(width: number, height: number): ImageData {
	if (typeof ImageData !== "undefined") {
		return new ImageData(width, height);
	}
	return {
		data: new Uint8ClampedArray(width * height * 4),
		width,
		height,
	} as ImageData;
}
