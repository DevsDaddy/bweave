/**
 * BWeave Compressor Store (Skip) Strategy
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import { IWeaveStrategy } from "../types";

/**
 * Store (skip) compression strategy for BWeave Compressor
 */
export class StoreWeave implements IWeaveStrategy {
  /**
   * Compress
   * @param data {Uint8Array} Uncompressed buffer
   * @returns {Uint8Array} Compressed buffer
   */
  public compress(data: Uint8Array): Uint8Array {
    return data;
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
    if (compressed.length !== originalLength)
      throw new Error("StoreWeave length mismatch");
    return compressed.slice();
  }
}
