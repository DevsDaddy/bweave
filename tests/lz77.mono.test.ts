/**
 * BWeave LZ77 Monotonic Data Test
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import {LZ77Weave} from "../src";

test('LZ77Weave on monotonic data', () => {
    const lz77 = new LZ77Weave();
    const length = 512;
    const original = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        original[i] = i & 0xFF;
    }
    const compressed = lz77.compress(original);
    const decompressed = lz77.decompress(compressed, original.length);
    expect(decompressed).toEqual(original);
});