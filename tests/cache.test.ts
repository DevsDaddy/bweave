import {DictionaryCache, PresetDictionaries} from "../src/cache/dictionary";
import {BWeave, BWeaveMode} from "../src";

describe('Preset dictionaries improve compression', () => {
    test('JSON dictionary improves compression of JSON data', () => {
        const dict = PresetDictionaries.json;
        const compressorNoDict = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const compressorWithDict = new BWeave({
            autoMode: false,
            forcedMode: BWeaveMode.LZ77,
            sharedDict: dict,
        });

        const jsonData = JSON.stringify({
            id: 123,
            name: 'John Doe',
            value: 99.5,
            data: { items: [1, 2, 3], total: 6, page: 1, limit: 10, offset: 0 },
        });
        const data = new TextEncoder().encode(jsonData);

        const compNoDict = compressorNoDict.compress(data);
        const compWithDict = compressorWithDict.compress(data);

        const decompressedWithDict = compressorWithDict.decompress(compWithDict);
        expect(decompressedWithDict).toEqual(data);
        expect(compWithDict.length).toBeLessThanOrEqual(compNoDict.length);
    });

    test('HTTP dictionary improves compression of HTTP request', () => {
        const dict = PresetDictionaries.http;
        const compressorNoDict = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const compressorWithDict = new BWeave({
            autoMode: false,
            forcedMode: BWeaveMode.LZ77,
            sharedDict: dict,
        });

        const httpRequest = `GET /api/users HTTP/1.1\r\nHost: example.com\r\nUser-Agent: BWeave/1.0\r\nAccept: application/json\r\n\r\n`;
        const data = new TextEncoder().encode(httpRequest);

        const compNoDict = compressorNoDict.compress(data);
        const compWithDict = compressorWithDict.compress(data);

        const decompressed = compressorWithDict.decompress(compWithDict);
        expect(decompressed).toEqual(data);
        expect(compWithDict.length).toBeLessThanOrEqual(compNoDict.length);
    });

    test('HTML dictionary improves compression of HTML fragment', () => {
        const dict = PresetDictionaries.html;
        const compressorNoDict = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const compressorWithDict = new BWeave({
            autoMode: false,
            forcedMode: BWeaveMode.LZ77,
            sharedDict: dict,
        });

        const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="content"><span>Hello</span></div><a href="https://example.com">link</a><img src="pic.jpg"/></body></html>`;
        const data = new TextEncoder().encode(html);

        const compNoDict = compressorNoDict.compress(data);
        const compWithDict = compressorWithDict.compress(data);

        const decompressed = compressorWithDict.decompress(compWithDict);
        expect(decompressed).toEqual(data);
        expect(compWithDict.length).toBeLessThanOrEqual(compNoDict.length);
    });

    test('JavaScript dictionary improves compression of JS code', () => {
        const dict = PresetDictionaries.js;
        const compressorNoDict = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const compressorWithDict = new BWeave({
            autoMode: false,
            forcedMode: BWeaveMode.LZ77,
            sharedDict: dict,
        });

        const jsCode = `
      const x = 42;
      function greet(name) {
        return "Hello, " + name;
      }
      let promise = new Promise((resolve) => resolve(1));
      promise.then((value) => console.log(value));
    `;
        const data = new TextEncoder().encode(jsCode);

        const compNoDict = compressorNoDict.compress(data);
        const compWithDict = compressorWithDict.compress(data);

        const decompressed = compressorWithDict.decompress(compWithDict);
        expect(decompressed).toEqual(data);
        expect(compWithDict.length).toBeLessThanOrEqual(compNoDict.length);
    });

    test('Binary dictionary improves compression of binary data (pcap-like)', () => {
        const dict = PresetDictionaries.binary;
        const compressorNoDict = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const compressorWithDict = new BWeave({
            autoMode: false,
            forcedMode: BWeaveMode.LZ77,
            sharedDict: dict,
        });

        // Генерируем бинарные данные, похожие на заголовок pcap + пакеты
        const binaryData = new Uint8Array(512);
        for (let i = 0; i < binaryData.length; i++) {
            binaryData[i] = (i % 256) ^ 0xAA; // смесь
        }
        // Вставляем повторяющиеся паттерны, которые могут быть в словаре
        binaryData.set([0x00, 0x00, 0x00, 0x00], 10);
        binaryData.set([0xFF, 0xFF, 0xFF, 0xFF], 20);
        binaryData.set([0x01, 0x02, 0x03, 0x04], 30);

        const data = binaryData;

        const compNoDict = compressorNoDict.compress(data);
        const compWithDict = compressorWithDict.compress(data);

        const decompressed = compressorWithDict.decompress(compWithDict);
        expect(decompressed).toEqual(data);
        expect(compWithDict.length).toBeLessThanOrEqual(compNoDict.length);
    });

    test('Protobuf dictionary improves compression of protobuf-like data', () => {
        const dict = PresetDictionaries.protobuf;
        const compressorNoDict = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
        const compressorWithDict = new BWeave({
            autoMode: false,
            forcedMode: BWeaveMode.LZ77,
            sharedDict: dict,
        });

        // Имитация protobuf сообщения с повторяющимися полями
        const protoData = new Uint8Array([
            0x08, 0x96, 0x01, // field 1 varint 150
            0x12, 0x03, 0x66, 0x6f, 0x6f, // field 2 string "foo"
            0x08, 0x2a, // field 1 varint 42
            0x12, 0x03, 0x62, 0x61, 0x72, // field 2 string "bar"
            0x08, 0x01, 0x08, 0x02, 0x08, 0x03
        ]);
        const data = protoData;

        const compNoDict = compressorNoDict.compress(data);
        const compWithDict = compressorWithDict.compress(data);

        const decompressed = compressorWithDict.decompress(compWithDict);
        expect(decompressed).toEqual(data);
        expect(compWithDict.length).toBeLessThanOrEqual(compNoDict.length);
    });
});