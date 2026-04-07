/**
 * BWeave JSON Strategy Tests
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */

import {JSONWeave} from "../src";

/**
 * Test JSON Strategy
 */
describe('JSONWeave', () => {
    test('compresses JSON with schema (short data may not compress)', () => {
        const schema = { id: 1, name: 2, age: 3 };
        const json = JSON.stringify({ id: 123, name: 'Alice', age: 30, extra: 'field' });
        const data = new TextEncoder().encode(json);
        const weave = new JSONWeave(schema);
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
        // Не проверяем коэффициент сжатия для коротких данных
    });

    test('compresses large JSON effectively', () => {
        const schema = { id: 1, name: 2, age: 3, address: 4, city: 5 };
        const largeObj: any = {};
        for (let i = 0; i < 100; i++) {
            largeObj[`user${i}`] = {
                id: i,
                name: 'John Doe',
                age: 30,
                address: '123 Main St',
                city: 'New York'
            };
        }
        const json = JSON.stringify(largeObj);
        const data = new TextEncoder().encode(json);
        const weave = new JSONWeave(schema);
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
        expect(compressed.length).toBeLessThan(data.length);
    });

    test('fallback to LZ77 for invalid JSON', () => {
        const weave = new JSONWeave();
        const data = new TextEncoder().encode('not a json');
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
        expect(compressed.length).toBeGreaterThan(0);
    });

    test('handles empty object', () => {
        const weave = new JSONWeave();
        const data = new TextEncoder().encode('{}');
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
    });

    test('handles nested JSON', () => {
        const schema = { user: 1, name: 2 };
        const json = JSON.stringify({ user: { name: 'John' }, extra: true });
        const data = new TextEncoder().encode(json);
        const weave = new JSONWeave(schema);
        const compressed = weave.compress(data);
        const decompressed = weave.decompress(compressed, data.length);
        expect(decompressed).toEqual(data);
    });
});