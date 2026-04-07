/**
 * BWeave Compressor Delta Strategy
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import { IWeaveStrategy } from "../types";
import { RLEWeave } from "./rle";

/**
 * Delta Strategy for BWeave Compressor
 */
export class DeltaWeave implements IWeaveStrategy {
  /* RLE and LZ77 Instances */
  private rle = new RLEWeave();

  /**
   * Compress
   * @param data {Uint8Array} Uncompressed buffer
   * @returns {Uint8Array} Compressed buffer
   */
  public compress(data: Uint8Array): Uint8Array {
    if (data.length < 2) {
      const rleCompressed = this.rle.compress(data);
      const result = new Uint8Array(1 + rleCompressed.length);
      result[0] = 0x01; // RLE
      result.set(rleCompressed, 1);
      return result;
    }
    const deltas = new Uint8Array(data.length);
    deltas[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      deltas[i] = data[i] - data[i - 1];
    }
    const compressedDeltas = this.rle.compress(deltas);
    if (compressedDeltas.length >= deltas.length) {
      const result = new Uint8Array(1 + deltas.length);
      result[0] = 0x00; // STORE
      result.set(deltas, 1);
      return result;
    }
    const result = new Uint8Array(1 + compressedDeltas.length);
    result[0] = 0x01; // RLE
    result.set(compressedDeltas, 1);
    return result;
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
    if (compressed.length === 0) throw new Error("DeltaWeave: empty");
    const mode = compressed[0];
    const payload = compressed.subarray(1);
    let deltas: Uint8Array;
    if (mode === 0x00) {
      if (payload.length !== originalLength)
        throw new Error("DeltaWeave: STORE length mismatch");
      deltas = payload.slice();
    } else if (mode === 0x01) {
      deltas = this.rle.decompress(payload, originalLength);
    } else {
      throw new Error(`DeltaWeave: unknown mode ${mode}`);
    }
    const out = new Uint8Array(originalLength);
    out[0] = deltas[0];
    for (let i = 1; i < originalLength; i++) {
      out[i] = out[i - 1] + deltas[i];
    }
    return out;
  }
}
