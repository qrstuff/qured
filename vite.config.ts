import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	build: {
		lib: {
			entry: {
				qured: resolve(__dirname, "src/index.ts"),
				decodeWorker: resolve(__dirname, "src/worker/decodeWorker.ts"),
			},
			name: "Qured",
			formats: ["es"],
		},
		rollupOptions: {
			external: ["canvas"],
			output: {
				entryFileNames: "[name].js",
				chunkFileNames: "[name]-[hash].js",
				assetFileNames: "[name][extname]",
				globals: { canvas: "canvas" },
			},
		},
		sourcemap: true,
		target: "es2020",
		minify: false,
	},
});
