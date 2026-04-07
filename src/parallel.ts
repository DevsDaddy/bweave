/**
 * BWeave Parallel Compression
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Modules */
import { BWeave, BWeaveOptions } from "./index";

/**
 * BWeave Parallel Compressor
 */
export class BWeaveCompressorParallel {
  compressor: BWeave;

  /**
   * Create parallel BWeave Compressor
   * @param options {BWeaveOptions} Options
   */
  constructor(options?: BWeaveOptions) {
    this.compressor = new BWeave(options);
  }

  /**
   * Compress async
   * @param data {Uint8Array} Data buffer
   * @param blockSize {number} Block size
   * @returns {Promise<Uint8Array>} Compressed data buffer
   */
  public async compress(
    data: Uint8Array,
    blockSize: number = 32768
  ): Promise<Uint8Array> {
    if (data.length === 0) return new Uint8Array(0);

    const blocks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += blockSize) {
      blocks.push(data.subarray(i, Math.min(i + blockSize, data.length)));
    }

    const compressedBlocks = await Promise.all(
      blocks.map((block) => Promise.resolve(this.compressor.compress(block)))
    );

    return this.mergeBlocks(compressedBlocks);
  }

  /**
   * Decompress
   * @param compressed {Uint8Array} Compressed data buffer
   * @returns {Promise<Uint8Array>} Decompressed data buffer
   */
  public async decompress(compressed: Uint8Array): Promise<Uint8Array> {
    if (compressed.length === 0) return new Uint8Array(0);

    const parts: Uint8Array[] = [];
    let offset = 0;

    while (offset < compressed.length) {
      if (offset + 4 > compressed.length) {
        throw new Error("Invalid compressed data: unexpected end");
      }
      const blockLen =
        (compressed[offset] << 24) |
        (compressed[offset + 1] << 16) |
        (compressed[offset + 2] << 8) |
        compressed[offset + 3];
      offset += 4;

      if (offset + blockLen > compressed.length) {
        throw new Error("Invalid compressed data: block length exceeds buffer");
      }
      const block = compressed.subarray(offset, offset + blockLen);
      offset += blockLen;

      const decompressedBlock = this.compressor.decompress(block);
      parts.push(decompressedBlock);
    }

    const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLen);
    let pos = 0;
    for (const p of parts) {
      result.set(p, pos);
      pos += p.length;
    }
    return result;
  }

  /**
   * Merge blocks
   * @param blocks {Uint8Array[]} Blocks
   * @returns {Uint8Array} Merged blocks buffer
   * @private
   */
  private mergeBlocks(blocks: Uint8Array[]): Uint8Array {
    let totalLen = 0;
    for (const b of blocks) totalLen += 4 + b.length;

    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const b of blocks) {
      result[offset] = (b.length >> 24) & 0xff;
      result[offset + 1] = (b.length >> 16) & 0xff;
      result[offset + 2] = (b.length >> 8) & 0xff;
      result[offset + 3] = b.length & 0xff;
      offset += 4;
      result.set(b, offset);
      offset += b.length;
    }
    return result;
  }
}
