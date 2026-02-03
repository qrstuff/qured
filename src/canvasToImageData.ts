/**
 * Draws image source to canvas (with optional downscale) and returns ImageData.
 */

import type { ImageSource } from "./loadImage.js";
import { createCanvas, type CanvasLike } from "./loadImage.js";

const DEFAULT_MAX_DIM = 1400;

export async function extractImageData(
	source: ImageSource,
	downscaleMaxDim: number = DEFAULT_MAX_DIM,
	canvas?: CanvasLike,
): Promise<ImageData> {
	const w = source.width;
	const h = source.height;
	const maxDim = Math.max(w, h);
	const scale = maxDim > downscaleMaxDim ? downscaleMaxDim / maxDim : 1;
	const outW = Math.round(w * scale);
	const outH = Math.round(h * scale);

	const c = canvas ?? (await createCanvas(outW, outH));
	(c as { width: number }).width = outW;
	(c as { height: number }).height = outH;
	const ctx = c.getContext("2d");
	if (!ctx) throw new Error("Could not get 2d context");

	if (scale < 1) {
		ctx.drawImage(
			source as ImageBitmap | HTMLImageElement,
			0,
			0,
			w,
			h,
			0,
			0,
			outW,
			outH,
		);
	} else if ("draw" in source && typeof source.draw === "function") {
		source.draw(ctx);
	} else {
		ctx.drawImage(source as ImageBitmap | HTMLImageElement, 0, 0);
	}

	return ctx.getImageData(0, 0, outW, outH);
}
