/**
 * BWeave Compressor Mode Detector Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */

import {BWeave, BWeaveMode, BWeaveUtils, DedupWeave, DeltaWeave, JSONWeave, LZ77Weave, RLEWeave} from "../src";

describe('modeDetector with trial compression', () => {
    const strategies = new Map([
        [BWeaveMode.LZ77, new LZ77Weave()],
        [BWeaveMode.RLE, new RLEWeave()],
        [BWeaveMode.DELTA, new DeltaWeave()],
        [BWeaveMode.JSON_WEAVE, new JSONWeave()], // без схемы
        [BWeaveMode.DEDUP_WEAVE, new DedupWeave()],
    ]);

    test('detects RLE for repetitive data', () => {
        const data = new Uint8Array(1000).fill(0xAA);
        const mode = BWeaveUtils.detectBestMode(data, strategies);
        expect(mode).toBe(BWeaveMode.RLE);
    });

    test('detects DELTA for monotonic data', () => {
        const data = new Uint8Array(256);
        for (let i = 0; i < 256; i++) data[i] = i;
        const mode = BWeaveUtils.detectBestMode(data, strategies);
        expect(mode).toBe(BWeaveMode.DELTA);
    });

    test('detects LZ77 for text', () => {
        const data = new TextEncoder().encode('Hello world! '.repeat(50));
        const mode = BWeaveUtils.detectBestMode(data, strategies);
        expect(mode).toBe(BWeaveMode.LZ77);
    });

    test('returns STORE for random data', () => {
        const data = crypto.getRandomValues(new Uint8Array(500));
        const mode = BWeaveUtils.detectBestMode(data, strategies);
        expect(mode).toBe(BWeaveMode.STORE);
    });

    test('for JSON-like data without schema, LZ77 may be chosen', () => {
        const json = JSON.stringify({ users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] });
        const data = new TextEncoder().encode(json);
        const mode = BWeaveUtils.detectBestMode(data, strategies);
        // Без схемы JSON_WEAVE не даёт преимущества, выбирается LZ77
        expect(mode).toBe(BWeaveMode.LZ77);
    });
});