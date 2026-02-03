/**
 * ZXing-based QR decoder. Works with ImageData (luminance).
 */

import {
	BinaryBitmap,
	HybridBinarizer,
	MultiFormatReader,
	RGBLuminanceSource,
} from "@zxing/library";
import type { DecodeEngine, DecodeResult } from "../types.js";
import { imageDataToLuminance } from "./imageDataToLuminance.js";

export const zxingEngine: DecodeEngine = {
	formats: ["QR_CODE"],
	decode(imageData: ImageData): DecodeResult | null {
		const { width, height } = imageData;
		const luminance = imageDataToLuminance(imageData);
		try {
			const source = new RGBLuminanceSource(luminance, width, height);
			const bitmap = new BinaryBitmap(new HybridBinarizer(source));
			const reader = new MultiFormatReader();
			const result = reader.decode(bitmap);
			if (!result) return null;
			const points = result.getResultPoints();
			return {
				text: result.getText(),
				format: "QR_CODE",
				points: points?.length
					? points.map((p: { getX(): number; getY(): number }) => ({
							x: p.getX(),
							y: p.getY(),
						}))
					: undefined,
				meta: { engine: "zxing" },
			};
		} catch {
			return null;
		}
	},
};
