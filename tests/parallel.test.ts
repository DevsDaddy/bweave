/**
 * BWeave Parallel Compressor Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import { BWeaveCompressorParallel } from '../src';
import {BWeaveMode} from "../src";

describe('BWeaveCompressorParallel', () => {
    test('parallel compression works correctly', async () => {
        const compressor = new BWeaveCompressorParallel({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const original = new TextEncoder().encode('abc'.repeat(10000));
        const compressed = await compressor.compress(original, 1024);
        const decompressed = await compressor.decompress(compressed);
        expect(decompressed).toEqual(original);
        expect(compressed.length).toBeLessThan(original.length);
    }, 10000);

    test('parallel compression with auto mode', async () => {
        const compressor = new BWeaveCompressorParallel({ autoMode: true });
        const original = new Uint8Array(5000).fill(0x42);
        const compressed = await compressor.compress(original, 2048);
        const decompressed = await compressor.decompress(compressed);
        expect(decompressed).toEqual(original);
        expect(compressed.length).toBeLessThan(original.length);
    }, 10000);

    test('parallel handles empty data', async () => {
        const compressor = new BWeaveCompressorParallel();
        const empty = new Uint8Array(0);
        const compressed = await compressor.compress(empty);
        const decompressed = await compressor.decompress(compressed);
        expect(decompressed).toEqual(empty);
        expect(compressed.length).toBe(0);
    }, 5000);

    test('parallel works with single block', async () => {
        const compressor = new BWeaveCompressorParallel();
        const original = new TextEncoder().encode('small data');
        const compressed = await compressor.compress(original, 1000);
        const decompressed = await compressor.decompress(compressed);
        expect(decompressed).toEqual(original);
    }, 5000);
});