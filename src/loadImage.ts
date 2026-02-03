/**
 * Loads an image from a Blob to an ImageBitmap (browser) or canvas-backed image (Node).
 * Uses createImageBitmap(blob) when available, with img+drawImage fallback.
 * In Node, uses optional "canvas" package to decode and draw to canvas.
 */

export type ImageSource =
	| ImageBitmap
	| HTMLImageElement
	| {
			width: number;
			height: number;
			draw(ctx: CanvasRenderingContext2D): void;
	  };

export async function loadImageFromBlob(blob: Blob): Promise<ImageSource> {
	if (typeof createImageBitmap !== "undefined") {
		try {
			const bitmap = await createImageBitmap(blob);
			return bitmap;
		} catch {
			// fall through to img fallback
		}
	}

	if (
		typeof document !== "undefined" &&
		typeof HTMLImageElement !== "undefined"
	) {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			const url = URL.createObjectURL(blob);
			img.onload = () => {
				URL.revokeObjectURL(url);
				resolve(img);
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error("Image load failed"));
			};
			img.src = url;
		});
	}

	// Node.js: use optional canvas package
	const canvasModule = await loadNodeCanvas();
	if (canvasModule) {
		const { loadImage } = canvasModule;
		const image = (await loadImage(blob as unknown as Buffer)) as {
			width: number;
			height: number;
			[key: string]: unknown;
		};
		const w = image.width;
		const h = image.height;
		return {
			width: w,
			height: h,
			draw(ctx: CanvasRenderingContext2D) {
				ctx.drawImage(image as unknown as CanvasImageSource, 0, 0);
			},
		};
	}

	throw new Error(
		'No image decoder available. In Node.js install the optional "canvas" package.',
	);
}

let nodeCanvas:
	| {
			loadImage: (src: Buffer | Blob) => Promise<unknown>;
			createCanvas: (
				w: number,
				h: number,
			) => {
				getContext: (c: string) => CanvasRenderingContext2D | null;
				width: number;
				height: number;
			};
	  }
	| null
	| undefined = undefined;

async function loadNodeCanvas(): Promise<typeof nodeCanvas> {
	if (nodeCanvas !== undefined) return nodeCanvas;
	try {
		const canvas = await import("canvas");
		nodeCanvas = {
			loadImage: async (src: Buffer | Blob) => {
				const buf = src instanceof Blob ? await blobToBuffer(src) : src;
				return canvas.loadImage(buf) as Promise<unknown>;
			},
			createCanvas: (w: number, h: number) =>
				canvas.createCanvas(w, h) as unknown as {
					getContext: (c: string) => CanvasRenderingContext2D | null;
					width: number;
					height: number;
				},
		};
	} catch {
		nodeCanvas = null;
	}
	return nodeCanvas;
}

async function blobToBuffer(blob: Blob): Promise<Buffer> {
	const ab = await blob.arrayBuffer();
	return Buffer.from(ab);
}

export function drawSourceToCanvas(
	source: ImageSource,
	canvas:
		| HTMLCanvasElement
		| {
				width: number;
				height: number;
				getContext(type: string): CanvasRenderingContext2D | null;
		  },
): void {
	const w = source.width;
	const h = source.height;
	(canvas as { width: number; height: number }).width = w;
	(canvas as { height: number }).height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get 2d context");
	if ("draw" in source && typeof source.draw === "function") {
		source.draw(ctx);
	} else {
		ctx.drawImage(source as ImageBitmap | HTMLImageElement, 0, 0);
	}
}

export type CanvasLike = {
	width: number;
	height: number;
	getContext(type: string): CanvasRenderingContext2D | null;
};

export async function createCanvas(
	width: number,
	height: number,
): Promise<CanvasLike> {
	if (typeof OffscreenCanvas !== "undefined") {
		return new OffscreenCanvas(width, height) as unknown as CanvasLike;
	}
	if (typeof document !== "undefined") {
		const c = document.createElement("canvas");
		c.width = width;
		c.height = height;
		return c as unknown as CanvasLike;
	}
	const mod = await loadNodeCanvas();
	if (mod) return mod.createCanvas(width, height);
	throw new Error(
		'No canvas implementation available. In Node.js install the optional "canvas" package.',
	);
}
