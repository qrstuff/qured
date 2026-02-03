/**
 * Native BarcodeDetector engine (browser only). Use when available and supports QR.
 */

import type { DecodeEngine, DecodeResult } from "../types.js";

declare global {
	interface BarcodeDetector {
		detect(image: ImageBitmapSource): Promise<BarcodeDetectorResult[]>;
	}
	interface BarcodeDetectorResult {
		rawValue: string;
		format: string;
		cornerPoints?: { x: number; y: number }[];
	}
	const BarcodeDetector: {
		new (options?: { formats: string[] }): BarcodeDetector;
		getSupportedFormats(): Promise<string[]>;
	};
}

let nativeSupported: boolean | null = null;

export async function isNativeSupported(): Promise<boolean> {
	if (nativeSupported !== null) return nativeSupported;
	if (typeof BarcodeDetector === "undefined") {
		nativeSupported = false;
		return false;
	}
	try {
		const formats = await BarcodeDetector.getSupportedFormats();
		nativeSupported = formats.includes("qr_code");
	} catch {
		nativeSupported = false;
	}
	return nativeSupported;
}

export const nativeEngine: DecodeEngine = {
	formats: ["QR_CODE"],
	decode(imageData: ImageData): DecodeResult | null {
		if (typeof BarcodeDetector === "undefined") return null;
		// BarcodeDetector expects ImageBitmapSource: ImageBitmap, ImageData, Blob, etc.
		try {
			// Sync decode not available on BarcodeDetector (it's async). So we cannot use it in a sync DecodeEngine.decode().
			return null;
		} catch {
			return null;
		}
	},
};

/**
 * Async native decode for use when we have ImageData and want to try native first.
 */
export async function nativeDecode(
	imageData: ImageData,
): Promise<DecodeResult | null> {
	if (!(await isNativeSupported())) return null;
	try {
		const detector = new BarcodeDetector({ formats: ["qr_code"] });
		const results = await detector.detect(imageData);
		if (results.length === 0) return null;
		const r = results[0]!;
		return {
			text: r.rawValue,
			format: "QR_CODE",
			points: r.cornerPoints?.map((p) => ({ x: p.x, y: p.y })),
			meta: { engine: "native" },
		};
	} catch {
		return null;
	}
}
