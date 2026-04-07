/**
 * BWeave Compressor Benchmarks Data Generators
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/**
 * Generate Text Data
 * @param bytes {number} Bytes length
 * @returns {Uint8Array} Generated text data buffer
 */
export function generateTextData(bytes: number): Uint8Array {
    const json = JSON.stringify({
        id: 12345,
        name: "BWeave benchmark",
        timestamp: Date.now(),
        payload: "x".repeat(Math.max(0, bytes - 100)),
        nested: { a: 1, b: 2, c: [1, 2, 3, 4, 5] }
    });
    const encoder = new TextEncoder();
    let result = encoder.encode(json);
    if (result.length > bytes) result = result.slice(0, bytes);
    else if (result.length < bytes) {
        const padding = new Uint8Array(bytes - result.length);
        padding.fill(32); // пробелы
        const tmp = new Uint8Array(bytes);
        tmp.set(result);
        tmp.set(padding, result.length);
        result = tmp;
    }
    return result;
}

/**
 * Generate repetitive data
 * @param bytes {number} Bytes length
 * @returns {Uint8Array} Generated repetitive buffer
 */
export function generateRepetitiveData(bytes: number): Uint8Array {
    const pattern = new Uint8Array([0x42, 0x43, 0x44]);
    const result = new Uint8Array(bytes);
    for (let i = 0; i < bytes; i++) {
        result[i] = pattern[i % pattern.length];
    }
    return result;
}

/**
 * Generate monotonic data
 * @param bytes {number} Bytes length
 * @returns {Uint8Array} Generated monotonic buffer
 */
export function generateMonotonicData(bytes: number): Uint8Array {
    const result = new Uint8Array(bytes);
    for (let i = 0; i < bytes; i++) {
        result[i] = i & 0xFF;
    }
    return result;
}

/**
 * Generate random data
 * @param bytes {number} Bytes length
 * @returns {Uint8Array} Generated random buffer
 */
export function generateRandomData(bytes: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(bytes));
}

/**
 * Generate JSON Data
 * @param bytes {number} Length
 * @returns {Uint8Array} Generated JSON buffer
 */
export function generateJSONData(bytes: number): Uint8Array {
    const items = [];
    const itemCount = Math.floor(bytes / 80);
    for (let i = 0; i < itemCount; i++) {
        items.push({
            id: i,
            name: `user${i}`,
            value: Math.random() * 1000,
            tags: ['tag1', 'tag2', 'tag3'],
            active: i % 2 === 0
        });
    }
    const json = JSON.stringify(items);
    const encoder = new TextEncoder();
    let result = encoder.encode(json);
    if (result.length > bytes) result = result.slice(0, bytes);
    else if (result.length < bytes) {
        const padding = new Uint8Array(bytes - result.length);
        padding.fill(32);
        const tmp = new Uint8Array(bytes);
        tmp.set(result);
        tmp.set(padding, result.length);
        result = tmp;
    }
    return result;
}

