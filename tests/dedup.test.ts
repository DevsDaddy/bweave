/**
 * BWeave Dedup Strategy Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import { DedupWeave } from '../src';

describe('DedupWeave', () => {
    test('deduplicates repeated blocks', () => {
        const pattern = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
        const data = new Uint8Array(pattern.length * 3);
        for (let i = 0; i < 3; i++) data.set(pattern, i * pattern.length);
        const weave = new DedupWeave(8);
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
        expect(compressed.length).toBeLessThan(data.length);
    });

    test('handles non-repeating data', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const weave = new DedupWeave(4);
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
        // Для неповторяющихся данных размер может не уменьшиться
    });

    test('handles partial last block', () => {
        const data = new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4, 1, 2]);
        const weave = new DedupWeave(4);
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
    });
});