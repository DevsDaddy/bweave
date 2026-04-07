/**
 * BWeave Compressor RLE Strategy
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import { IWeaveStrategy } from "../types";

/**
 * RLE Strategy for BWeave Compressor
 */
export class RLEWeave implements IWeaveStrategy {
  /**
   * Compress
   * @param data {Uint8Array} Uncompressed buffer
   * @returns {Uint8Array} Compressed buffer
   */
  public compress(data: Uint8Array): Uint8Array {
    const out: number[] = [];
    let i = 0;
    const len = data.length;
    while (i < len) {
      let run = 1;
      const byte = data[i];
      while (i + run < len && data[i + run] === byte && run < 255) run++;
      out.push(run, byte);
      i += run;
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
    for (let i = 0; i < compressed.length && outPos < originalLength; i += 2) {
      const count = compressed[i];
      const byte = compressed[i + 1];
      for (let j = 0; j < count; j++) out[outPos++] = byte;
    }
    return out;
  }
}
