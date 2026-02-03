/**
 * Supported input types for decoding.
 */
export type DecodeInput = File | Blob | ArrayBuffer | Uint8Array | string; // base64 or data URL

/**
 * Result of a successful decode.
 */
export interface DecodeResult {
	text: string;
	format: "QR_CODE";
	points?: { x: number; y: number }[];
	meta?: {
		engine: "native" | "zxing";
		inverted?: boolean;
		preprocessingPass?: string;
	};
}

/**
 * Options for the decode pipeline.
 */
export interface DecodeOptions {
	aggressive?: boolean;
	maxPasses?: number;
	downscaleMaxDim?: number;
	tryInvert?: boolean;
	colorHint?: {
		foreground?: [number, number, number];
		background?: [number, number, number];
	};
	worker?: boolean;
}

/**
 * Decoder engine interface for extensibility.
 */
export interface DecodeEngine {
	formats: string[];
	decode(imageData: ImageData): DecodeResult | null;
}
