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

/**
 * Generate HTTP Data
 * @param bytes {number} Length
 * @returns {Uint8Array} Generated HTTP buffer
 */
export function generateHTTPData(bytes: number): Uint8Array {
    const request = `GET /api/data HTTP/1.1\r\nHost: example.com\r\nUser-Agent: BWeave/1.0\r\nAccept: application/json\r\nAuthorization: Bearer token\r\n\r\n`;
    const encoder = new TextEncoder();
    let result = encoder.encode(request);
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

/**
 * Generate HTML Data
 * @param bytes {number} Length
 * @returns {Uint8Array} Generated HTML buffer
 */
export function generateHTMLData(bytes: number): Uint8Array {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="container"><p>Hello world</p></div></body></html>`;
    const encoder = new TextEncoder();
    let result = encoder.encode(html);
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

/**
 * Generate JS Data
 * @param bytes {number} Length
 * @returns {Uint8Array} Generated JS buffer
 */
export function generateJSData(bytes: number): Uint8Array {
    const js = `function hello() { const x = 42; return x; } let promise = new Promise((r) => r(1)); promise.then(console.log);`;
    const encoder = new TextEncoder();
    let result = encoder.encode(js);
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

/**
 * Generate Protobuf Data
 * @param bytes {number} Length
 * @returns {Uint8Array} Generated Protobuf buffer
 */
export function generateProtobufData(bytes: number): Uint8Array {
    let result = new Uint8Array([
        0x08, 0x96, 0x01, 0x12, 0x03, 0x66, 0x6f, 0x6f, 0x08, 0x2a, 0x12, 0x03, 0x62, 0x61, 0x72, 0x08,
        0x01, 0x08, 0x02, 0x08, 0x03, 0x08, 0x04, 0x08, 0x05, 0x08, 0x06, 0x08, 0x07, 0x08, 0x08,
    ]);
    if (result.length > bytes) result = result.slice(0, bytes);
    else if (result.length < bytes) {
        const padding = new Uint8Array(bytes - result.length);
        padding.fill(0);
        const tmp = new Uint8Array(bytes);
        tmp.set(result);
        tmp.set(padding, result.length);
        result = tmp;
    }
    return result;
}