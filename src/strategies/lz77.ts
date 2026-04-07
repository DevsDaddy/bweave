/**
 * BWeave Compressor LZ77 Strategy
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Modules */
import { IWeaveStrategy } from "../types";
import { DictionaryCache } from "../cache/dictionary";

/**
 * LZ77 Strategy for BWeave Compressor
 */
export class LZ77Weave implements IWeaveStrategy {
  /* Strategy constants */
  private readonly MAX_MATCH = 18;
  private readonly MIN_MATCH = 3;
  private readonly ESCAPE_BYTE = 0xfe;
  private readonly DICT_MARKER = 0xfd;
  private readonly dictionaryCache?: DictionaryCache;
  private readonly dictionary?: Uint8Array;

  /**
   * Create LZ77 Strategy
   * @param dictionaryCache {DictionaryCache} Dictionary Cache
   */
  constructor(dictionaryCache?: DictionaryCache) {
    this.dictionaryCache = dictionaryCache;
    this.dictionary = dictionaryCache ? dictionaryCache.dict : undefined;
  }

  /**
   * Compress
   * @param data {Uint8Array} Uncompressed buffer
   * @returns {Uint8Array} Compressed buffer
   */
  public compress(data: Uint8Array): Uint8Array {
    const out: number[] = [];
    let pos = 0;
    const n = data.length;
    const windowSize = this.getWindowSize(n);

    while (pos < n) {
      let bestDist = 0;
      let bestLen = 0;
      let isDictMatch = false;

      if (this.dictionaryCache) {
        const dictMatch = this.dictionaryCache.findMatch(data, pos);
        if (dictMatch && dictMatch.length > bestLen) {
          bestLen = dictMatch.length;
          bestDist = dictMatch.offset;
          isDictMatch = true;
        }
      }

      if (!isDictMatch || bestLen < this.MAX_MATCH) {
        const windowStart = Math.max(0, pos - windowSize);
        for (let dist = 1; dist <= pos - windowStart; dist++) {
          let len = 0;
          while (
            len < this.MAX_MATCH &&
            pos + len < n &&
            data[pos + len] === data[pos - dist + len]
          ) {
            len++;
          }
          if (len >= this.MIN_MATCH && len > bestLen) {
            bestLen = len;
            bestDist = dist;
            isDictMatch = false;
            if (bestLen === this.MAX_MATCH) break;
          }
        }
      }

      if (bestLen >= this.MIN_MATCH) {
        const lenMinus3 = bestLen - 3;
        if (isDictMatch) {
          out.push(this.ESCAPE_BYTE, this.DICT_MARKER);
          const distMinus1 = bestDist;
          const high = (distMinus1 >> 4) & 0xff;
          const low = ((distMinus1 & 0x0f) << 4) | lenMinus3;
          out.push(high, low);
        } else {
          const distMinus1 = bestDist - 1;
          const high = (distMinus1 >> 4) & 0xff;
          const low = ((distMinus1 & 0x0f) << 4) | lenMinus3;
          out.push(this.ESCAPE_BYTE, high, low);
        }
        pos += bestLen;
      } else {
        const byte = data[pos];
        if (byte === this.ESCAPE_BYTE) {
          out.push(this.ESCAPE_BYTE, this.ESCAPE_BYTE);
        } else {
          out.push(byte);
        }
        pos++;
      }
    }
    return new Uint8Array(out);
  }

  /**
   * Decompress
   * @param compressed {Uint8Array} Compressed buffer
   * @param originalLength {number} Original buffer size
   * @returns {Uint8Array} Uncompressed buffer
   */
  public decompress(
    compressed: Uint8Array,
    originalLength: number
  ): Uint8Array {
    const out = new Uint8Array(originalLength);
    let outPos = 0;
    let i = 0;

    while (outPos < originalLength && i < compressed.length) {
      const first = compressed[i++];
      if (first === this.ESCAPE_BYTE) {
        if (i >= compressed.length) throw new Error("LZ77: incomplete escape");
        const second = compressed[i];
        if (second === this.ESCAPE_BYTE) {
          out[outPos++] = this.ESCAPE_BYTE;
          i++;
        } else if (second === this.DICT_MARKER) {
          if (!this.dictionary)
            throw new Error("LZ77: dictionary required but missing");
          if (i + 2 >= compressed.length)
            throw new Error("LZ77: incomplete dict reference");
          i++;
          const high = compressed[i++];
          const low = compressed[i++];
          const dictOffset = ((high << 4) | (low >> 4)) & 0x0fff;
          const lenMinus3 = low & 0x0f;
          const length = lenMinus3 + 3;
          for (let j = 0; j < length; j++) {
            if (dictOffset + j >= this.dictionary.length) {
              throw new Error("LZ77: dictionary index out of range");
            }
            out[outPos++] = this.dictionary[dictOffset + j];
          }
        } else {
          if (i + 1 >= compressed.length)
            throw new Error("LZ77: incomplete window reference");
          const high = second;
          const low = compressed[i + 1];
          i += 2;
          const distMinus1 = ((high << 4) | (low >> 4)) & 0x0fff;
          const lenMinus3 = low & 0x0f;
          const distance = distMinus1 + 1;
          const length = lenMinus3 + 3;
          if (distance > outPos)
            throw new Error(`LZ77: distance ${distance} > outPos ${outPos}`);
          for (let j = 0; j < length; j++) {
            out[outPos] = out[outPos - distance];
            outPos++;
          }
        }
      } else {
        out[outPos++] = first;
      }
    }
    if (outPos !== originalLength)
      throw new Error(`LZ77: expected ${originalLength} bytes, got ${outPos}`);
    return out;
  }

  /**
   * Get Window Size
   * @param dataLength {number} Data length
   * @returns {number} Window size
   * @private
   */
  private getWindowSize(dataLength: number): number {
    if (dataLength < 1024) return 256;
    if (dataLength < 65536) return 4096;
    return 16384;
  }
}
