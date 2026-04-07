/**
 * BWeave Compressor Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* General Compressor Test */
import {BWeave, BWeaveMode, BWeaveUtils} from "../src";

describe('General Compressor Test', () => {
    const compressor = new BWeave();

    // Empty data test
    test('roundtrip for empty data', () => {
        const empty = new Uint8Array(0);
        const compressed = compressor.compress(empty);
        const decompressed = compressor.decompress(compressed);
        expect(decompressed).toEqual(empty);
        expect(compressed.length).toBe(4);
    });

    // Short data test
    test('roundtrip for very short data (size may increase)', () => {
        const short = BWeaveUtils.textToBytes("Hello");
        const compressed = compressor.compress(short);
        const decompressed = compressor.decompress(compressed);
        expect(decompressed).toEqual(short);
    });

    // Long data test
    test('compresses long repetitive text effectively', () => {
        const original = BWeaveUtils.textToBytes("abc".repeat(1000));
        const compressed = compressor.compress(original);
        expect(compressed.length).toBeLessThan(original.length);
        expect(compressor.decompress(compressed)).toEqual(original);
    });

    // Repeating bytes test
    test('compresses repeating bytes (RLE)', () => {
        const original = new Uint8Array(5000).fill(0x42);
        const compressed = compressor.compress(original);
        expect(compressed.length).toBeLessThan(original.length);
        expect(compressor.decompress(compressed)).toEqual(original);
    });

    // Force lz77 mode
    test('forced mode LZ77 works', () => {
        const forced = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const data = BWeaveUtils.textToBytes("aaaaaaabbbbbbbccccccc");
        const comp = forced.compress(data);
        const decomp = forced.decompress(comp);
        expect(decomp).toEqual(data);
    });

    // Handles incompressible random data
    test('handles incompressible random data', () => {
        const random = crypto.getRandomValues(new Uint8Array(500));
        const compressed = compressor.compress(random);
        const decompressed = compressor.decompress(compressed);
        expect(decompressed).toEqual(random);
        // Сжатие может не уменьшить размер – допустимо
    });
});