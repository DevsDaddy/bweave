/**
 * BWeave Compressor Dedup Strategy
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Modules */
import { IWeaveStrategy } from "../types";

/**
 * Dedup Strategy for BWeave Compressor
 */
export class DedupWeave implements IWeaveStrategy {
  // Block size
  private readonly blockSize: number;

  /**
   * Dedup Strategy
   * @param blockSize {number} block size
   */
  constructor(blockSize: number = 64) {
    this.blockSize = blockSize;
  }

  /**
   * Compress
   * @param data {Uint8Array} Uncompressed buffer
   * @returns {Uint8Array} Compressed buffer
   */
  public compress(data: Uint8Array): Uint8Array {
    const out: number[] = [];
    const seen = new Map<string, number>();
    for (let i = 0; i < data.length; i += this.blockSize) {
      const block = data.subarray(i, Math.min(i + this.blockSize, data.length));
      const hash = this.hash(block);
      if (seen.has(hash) && block.length === this.blockSize) {
        const offset = seen.get(hash)!;
        out.push(0xff, offset >> 8, offset & 0xff);
      } else {
        seen.set(hash, i);
        out.push(block.length);
        for (let j = 0; j < block.length; j++) out.push(block[j]);
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
    const out: number[] = [];
    let i = 0;
    while (out.length < originalLength && i < compressed.length) {
      const first = compressed[i++];
      if (first === 0xff) {
        const offset = (compressed[i++] << 8) | compressed[i++];
        const block = out.slice(offset, offset + this.blockSize);
        out.push(...block);
      } else {
        for (let j = 0; j < first; j++) out.push(compressed[i++]);
      }
    }
    return new Uint8Array(out);
  }

  /**
   * Hash
   * @param block {Uint8Array} Block buffer
   * @private
   */
  private hash(block: Uint8Array): string {
    let h = 0;
    for (let i = 0; i < block.length; i++) h = (h * 31 + block[i]) >>> 0;
    return h.toString(36);
  }
}
