/**
 * BWeave Compressor LZ77 Strategy Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import {BWeaveUtils, LZ77Weave} from '../src';

/**
 * Test LZ77 Strategy
 */
test('LZ77Weave roundtrip', () => {
    const weave = new LZ77Weave();
    const original = BWeaveUtils.textToBytes('abracadabra abracadabra');
    const compressed = weave.compress(original);
    const decompressed = weave.decompress(compressed, original.length);
    expect(decompressed).toEqual(original);
    expect(compressed.length).toBeLessThan(original.length);
});