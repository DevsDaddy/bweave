/**
 * BWeave CRC Check Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import {BWeave, BWeaveUtils} from "../src";

describe('Checksum functionality', () => {
    test('compressor adds checksum when enabled', () => {
        const compressor = new BWeave({ checksum: true });
        const data = new TextEncoder().encode('test data for checksum');
        const compressed = compressor.compress(data);
        // Заголовок должен быть длиннее на 4 байта (8 вместо 4)
        expect(compressed.length).toBeGreaterThan(data.length);
        // Распаковка должна работать
        const decompressed = compressor.decompress(compressed);
        expect(decompressed).toEqual(data);
        // Проверим, что CRC был добавлен (первый байт имеет установленный старший бит)
        expect(compressed[0] & 0x80).toBe(0x80);
    });

    test('crc32 utility works correctly', () => {
        const data = new TextEncoder().encode('hello');
        const hash = BWeaveUtils.crc32(data);
        expect(hash).toBe(0x3610a686);
    });

    test('crc32 on empty data', () => {
        const hash = BWeaveUtils.crc32(new Uint8Array(0));
        expect(hash).toBe(0x00000000);
    });
});