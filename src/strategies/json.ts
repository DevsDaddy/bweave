/**
 * BWeave Compressor JSON Strategy
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Modules */
import { LZ77Weave } from "./lz77";
import { IWeaveStrategy } from "../types";
import { BWeaveUtils } from "../utils";

/**
 * JSON Strategy for BWeave Compressor
 */
export class JSONWeave implements IWeaveStrategy {
  private lz77: LZ77Weave;
  private schema: Map<string, number>;
  private reverseSchema: Map<number, string>;

  /**
   * JSON Data Strategy for BWeave Compressor
   * @param schema {Record<string,number>} Schema for compression
   * @param lz77 {LZ77Weave} LZ77 Instance
   */
  constructor(schema?: Record<string, number>, lz77?: LZ77Weave) {
    this.lz77 = lz77 || new LZ77Weave();
    this.schema = new Map();
    this.reverseSchema = new Map();
    if (schema) {
      for (const [key, token] of Object.entries(schema)) {
        this.schema.set(key, token);
        this.reverseSchema.set(token, key);
      }
    }
  }

  /**
   * Compress
   * @param data {Uint8Array} Decompressed data buffer
   * @returns {Uint8Array} Compressed data buffer
   */
  public compress(data: Uint8Array): Uint8Array {
    const decoder = new TextDecoder();
    let obj: any;
    try {
      obj = JSON.parse(decoder.decode(data));
    } catch {
      return this.lz77.compress(data);
    }

    const tokenized = this.tokenize(obj);
    const tokenizedBytes = BWeaveUtils.textToBytes(JSON.stringify(tokenized));
    const compressed = this.lz77.compress(tokenizedBytes);
    const schemaBytes = this.serializeSchema(tokenizedBytes.length);
    const result = new Uint8Array(schemaBytes.length + compressed.length);
    result.set(schemaBytes);
    result.set(compressed, schemaBytes.length);
    return result;
  }

  /**
   * Decompress
   * @param compressed {Uint8Array} Compressed buffer
   * @param originalLength {number} Original Length
   * @returns {Uint8Array} Decompressed buffer
   */
  public decompress(
    compressed: Uint8Array,
    originalLength: number
  ): Uint8Array {
    if (compressed.length < 6) {
      return this.lz77.decompress(compressed, originalLength);
    }

    const schemaLen = (compressed[0] << 8) | compressed[1];
    const tokenizedLen =
      (compressed[2] << 24) |
      (compressed[3] << 16) |
      (compressed[4] << 8) |
      compressed[5];

    if (schemaLen > compressed.length - 6) {
      return this.lz77.decompress(compressed, originalLength);
    }

    const schemaBytes = compressed.subarray(6, 6 + schemaLen);
    const payload = compressed.subarray(6 + schemaLen);

    try {
      const schemaStr = new TextDecoder().decode(schemaBytes);
      const savedSchema = JSON.parse(schemaStr);
      this.schema.clear();
      this.reverseSchema.clear();
      for (const [key, token] of Object.entries(savedSchema)) {
        this.schema.set(key, token as number);
        this.reverseSchema.set(token as number, key);
      }

      const decompressedTokenized = this.lz77.decompress(payload, tokenizedLen);
      const tokenizedStr = new TextDecoder().decode(decompressedTokenized);
      const tokenizedObj = JSON.parse(tokenizedStr);
      const originalObj = this.detokenize(tokenizedObj);
      return BWeaveUtils.textToBytes(JSON.stringify(originalObj));
    } catch {
      return this.lz77.decompress(compressed, originalLength);
    }
  }

  /**
   * Tokenize
   * @param obj {any} Object
   * @returns {any} Tokenized object
   * @private
   */
  private tokenize(obj: any): any {
    if (typeof obj !== "object" || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.tokenize(item));
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const token = this.schema.get(key);
      if (token !== undefined) {
        result[`__${token}`] = this.tokenize(value);
      } else {
        result[key] = this.tokenize(value);
      }
    }
    return result;
  }

  /**
   * Detokenize
   * @param obj {any} Object
   * @returns {obj} Detokenized object
   * @private
   */
  private detokenize(obj: any): any {
    if (typeof obj !== "object" || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.detokenize(item));
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("__")) {
        const token = parseInt(key.slice(2), 10);
        const originalKey = this.reverseSchema.get(token);
        if (originalKey) result[originalKey] = this.detokenize(value);
        else result[key] = this.detokenize(value);
      } else {
        result[key] = this.detokenize(value);
      }
    }
    return result;
  }

  /**
   * Serialize Schema
   * @returns {Uint8Array} Serialized Schema
   * @private
   */
  private serializeSchema(tokenizedLength: number): Uint8Array {
    const schemaObj: Record<string, number> = {};
    for (const [key, token] of this.schema.entries()) {
      schemaObj[key] = token;
    }
    const schemaJson = JSON.stringify(schemaObj);
    const schemaBytes = BWeaveUtils.textToBytes(schemaJson);
    const result = new Uint8Array(2 + 4 + schemaBytes.length);
    result[0] = (schemaBytes.length >> 8) & 0xff;
    result[1] = schemaBytes.length & 0xff;
    result[2] = (tokenizedLength >> 24) & 0xff;
    result[3] = (tokenizedLength >> 16) & 0xff;
    result[4] = (tokenizedLength >> 8) & 0xff;
    result[5] = tokenizedLength & 0xff;
    result.set(schemaBytes, 6);
    return result;
  }
}
