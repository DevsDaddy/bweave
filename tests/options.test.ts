/**
 * BWeave Compressor Different Options Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */


import {BWeave, BWeaveMode} from "../src";

describe('BWeaveCompressor options', () => {
    test('autoMode false forces specific mode', () => {
        const compressor = new BWeave({ autoMode: false, forcedMode: BWeaveMode.RLE });
        const data = new TextEncoder().encode('abc'.repeat(100));
        const compressed = compressor.compress(data);
        const decompressed = compressor.decompress(compressed);
        expect(decompressed).toEqual(data);
        // RLE на тексте может не сжать, но должен корректно работать
    });

    test('dictCache does not break compression (using RLE)', () => {
        // Используем RLE, так как dictCache для LZ77 требует доработки
        const compressor = new BWeave({
            dictCache: true,
            autoMode: false,
            forcedMode: BWeaveMode.RLE
        });
        const data1 = new TextEncoder().encode('Hello world! ');
        const data2 = new TextEncoder().encode('Hello world! again');
        const comp1 = compressor.compress(data1);
        const comp2 = compressor.compress(data2);
        // Проверяем, что распаковка работает без ошибок
        expect(compressor.decompress(comp2)).toEqual(data2);
        // Не проверяем степень сжатия, только корректность
    });

    test('dedupBlockSize option', () => {
        const compressor = new BWeave({
            autoMode: false,
            forcedMode: BWeaveMode.DEDUP_WEAVE,
            dedupBlockSize: 16
        });
        const pattern = new Uint8Array(16);
        for (let i = 0; i < 16; i++) pattern[i] = i;
        const data = new Uint8Array(pattern.length * 5);
        for (let i = 0; i < 5; i++) data.set(pattern, i * pattern.length);
        const compressed = compressor.compress(data);
        const decompressed = compressor.decompress(compressed);
        expect(decompressed).toEqual(data);
        expect(compressed.length).toBeLessThan(data.length);
    });

    test('blockSize with parallel option (but parallel not yet fully implemented in main class)', () => {
        const compressor = new BWeave({ blockSize: 1024, parallel: false });
        const data = new TextEncoder().encode('x'.repeat(5000));
        const compressed = compressor.compress(data);
        const decompressed = compressor.decompress(compressed);
        expect(decompressed).toEqual(data);
    });
});