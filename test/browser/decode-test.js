/**
 * Browser decode tests — same logic as node/decode-test.js but uses fetch for images.
 * Loaded by browser-test.html and run by Mocha.
 */
import { decode } from "/dist/qured.js";

const { expect } = window.chai;

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

async function fetchImageBuffer(filename) {
	const res = await fetch(`/data/${filename}`);
	if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
	return res.arrayBuffer();
}

describe("Qured decode (browser)", () => {
	describe("must decode successfully", () => {
		for (const file of mustDecode) {
			it(file, async () => {
				const buffer = await fetchImageBuffer(file);
				const result = await decode(new Uint8Array(buffer));
				expect(result, `expected decode for ${file}`).to.not.be.null;
				expect(result).to.have.property("text").that.is.a("string");
				expect(result).to.have.property("format", "QR_CODE");
			});
		}
	});

	describe("must fail (out-of-scope / bad QR)", () => {
		for (const file of mustFail) {
			it(file, async () => {
				const buffer = await fetchImageBuffer(file);
				const result = await decode(new Uint8Array(buffer));
				expect(result, `expected null for ${file}`).to.be.null;
			});
		}
	});
});

const passed = [];
const failed = [];
const runner = window.mocha.run((failures) => {
	window.__mochaDone = true;
	window.__mochaFailures = failures;
	window.__mochaResults = { passed, failed };
});
runner.on("pass", (t) => passed.push(t.fullTitle()));
runner.on("fail", (t) => failed.push(t.fullTitle()));
