/**
 * Decode tests: images in data/ that must decode vs must fail.
 * Run: yarn test
 * Requires optional dependency "canvas" for image loading in Node.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decode } from "@qrstuff/qured";
import { expect } from "chai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "data");

const mustDecode = [
	"basic.png",
	"colored.png",
	"gradient.png",
	"inverted.png",
	"inverted-transparent.png",
	"transparent.png",
	"shaped-1.png",
	"shaped-2.png",
];

const mustFail = ["shaped-3-bad.png"];

describe("Qured decode", () => {
	describe("must decode successfully", () => {
		for (const file of mustDecode) {
			it(file, async () => {
				const path = join(dataDir, file);
				expect(existsSync(path), `data file ${file} should exist`).to.be.true;
				const buffer = readFileSync(path);
				const result = await decode(buffer, { worker: false });
				expect(result, `expected decode for ${file}`).to.not.be.null;
				expect(result).to.have.property("text").that.is.a("string");
				expect(result).to.have.property("format", "QR_CODE");
			});
		}
	});

	describe("must fail (out-of-scope / bad QR)", () => {
		for (const file of mustFail) {
			it(file, async () => {
				const path = join(dataDir, file);
				expect(existsSync(path), `data file ${file} should exist`).to.be.true;
				const buffer = readFileSync(path);
				const result = await decode(buffer, { worker: false });
				expect(result, `expected null for ${file}`).to.be.null;
			});
		}
	});
});
