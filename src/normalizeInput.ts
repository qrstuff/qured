/**
 * Converts all supported inputs into a Blob for image loading.
 * - Base64 / data URL → decode → Uint8Array → Blob
 * - ArrayBuffer / Uint8Array → Blob
 * - File / Blob → pass through
 */
export function inputToBlob(
	input: File | Blob | ArrayBuffer | Uint8Array | string,
): Blob {
	if (input instanceof Blob && !(input instanceof File)) {
		return input;
	}
	if (input instanceof File) {
		return input;
	}
	if (input instanceof ArrayBuffer) {
		return new Blob([input as BlobPart]);
	}
	if (input instanceof Uint8Array) {
		const slice = input.buffer.slice(
			input.byteOffset,
			input.byteOffset + input.byteLength,
		);
		return new Blob([slice as ArrayBuffer]);
	}
	if (typeof input === "string") {
		const binary = base64ToUint8Array(input);
		return new Blob([
			binary.buffer.slice(
				binary.byteOffset,
				binary.byteOffset + binary.byteLength,
			) as ArrayBuffer,
		]);
	}
	throw new TypeError("Unsupported input type");
}

const DATA_URL_PREFIX = /^data:([^;]+);base64,/;

function base64ToUint8Array(str: string): Uint8Array {
	let base64 = str.trim();
	const match = base64.match(DATA_URL_PREFIX);
	if (match) {
		base64 = base64.slice(match[0].length);
	}
	const binary = atob(base64);
	const len = binary.length;
	const out = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		out[i] = binary.charCodeAt(i);
	}
	return out;
}
