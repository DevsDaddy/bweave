/**
 * BWeave Compression Utils
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Mode */
import { BWeaveMode } from "./compressor";
import { ICompressionHeader, IWeaveStrategy } from "./types";

/**
 * BWeave Compressor utils
 */
export class BWeaveUtils {
  // Protected Constants
  private static HEXChars: string = "0123456789abcdef";
  private static CHECKSUM_FLAG = 0x80;
  private static crc32Table = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c >>> 0;
    }
    return table;
  })();

  /**
   * Detect best BWeave Compression Mode
   * @param data {Uint8Array} Data buffer
   * @param strategies {Map<BWeaveMode, IWeaveStrategy>} Strategies map
   * @returns {BWeaveMode} Compression mode
   */
  public static detectBestMode(
    data: Uint8Array,
    strategies: Map<BWeaveMode, IWeaveStrategy>
  ): BWeaveMode {
    const sample = data.length > 1024 ? data.subarray(0, 1024) : data;
    const candidates = [
      BWeaveMode.LZ77,
      BWeaveMode.RLE,
      BWeaveMode.DELTA,
      BWeaveMode.JSON_WEAVE,
      BWeaveMode.DEDUP_WEAVE,
    ];
    let bestMode = BWeaveMode.STORE;
    let bestSize = sample.length;
    for (const mode of candidates) {
      const strategy = strategies.get(mode);
      if (strategy) {
        try {
          const compressed = strategy.compress(sample);
          if (compressed.length < bestSize) {
            bestSize = compressed.length;
            bestMode = mode;
          }
        } catch {
          // ignore errors (e.g., JSON parsing)
        }
      }
    }
    return bestMode;
  }

  /**
   * CRC32 Function
   * @param data {Uint8Array} Buffer
   * @returns {number} CRC32
   */
  public static crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ BWeaveUtils.crc32Table[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Write compression header
   * @param mode {BWeaveMode} Compression Mode
   * @param originalLen {number} Original Length
   * @param payload {Uint8Array} Payload buffer
   * @param checksum {boolean} Checksum header
   * @returns {Uint8Array} Packet buffer with compression header
   */
  public static writeHeader(
    mode: BWeaveMode,
    originalLen: number,
    payload: Uint8Array,
    checksum: boolean = false
  ): Uint8Array {
    if (originalLen >= 0xffffff)
      throw new Error("Data too large (max 16MB per block)");
    const actualMode = checksum ? mode | BWeaveUtils.CHECKSUM_FLAG : mode;
    const headerLen = checksum ? 8 : 4;
    const header = new Uint8Array(headerLen + payload.length);
    header[0] = actualMode;
    header[1] = (originalLen >> 16) & 0xff;
    header[2] = (originalLen >> 8) & 0xff;
    header[3] = originalLen & 0xff;
    if (checksum) {
      const sum = BWeaveUtils.crc32(payload);
      header[4] = (sum >> 24) & 0xff;
      header[5] = (sum >> 16) & 0xff;
      header[6] = (sum >> 8) & 0xff;
      header[7] = sum & 0xff;
    }
    header.set(payload, headerLen);
    return header;
  }

  /**
   * Read compression header
   * @param data {Uint8Array} Packet
   * @returns {ICompressionHeader} Compression header
   */
  public static readHeader(data: Uint8Array): ICompressionHeader {
    if (data.length < 4) throw new Error("Invalid header");
    const modeByte = data[0];
    const hasChecksum = (modeByte & BWeaveUtils.CHECKSUM_FLAG) !== 0;
    const mode = (modeByte & ~BWeaveUtils.CHECKSUM_FLAG) as BWeaveMode;
    const originalLen = (data[1] << 16) | (data[2] << 8) | data[3];

    let payloadStart = 4;
    let checksumValid = true;
    if (hasChecksum) {
      if (data.length < 8) throw new Error("Invalid header: checksum missing");
      const storedCrc =
        (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
      payloadStart = 8;
      const payload = data.subarray(payloadStart);
      const computedCrc = BWeaveUtils.crc32(payload);
      checksumValid = storedCrc === computedCrc;
      if (!checksumValid) {
        console.warn("BWeave: checksum mismatch, data may be corrupted");
      }
    }
    const payload = data.subarray(payloadStart);
    return { mode, originalLen, payload, checksumValid };
  }

  /**
   * Check if value is int
   * @param value {any} Value
   * @returns {boolean}
   * @protected
   */
  public static checkInt(value: any): boolean {
    return parseInt(value) === value;
  }

  /**
   * Check Ints inside array
   * @param arrayish {any} Array
   * @returns {boolean} Any value is integer and between 0 and 255
   * @protected
   */
  public static checkInts(arrayish: any): boolean {
    let self = this;
    if (!self.checkInt(arrayish.length)) {
      return false;
    }

    for (let i = 0; i < arrayish.length; i++) {
      if (!self.checkInt(arrayish[i]) || arrayish[i] < 0 || arrayish[i] > 255) {
        return false;
      }
    }

    return true;
  }

  /**
   * Coerce Array
   * @param arg {any} Argument
   * @param copy {any} Copy
   * @protected
   */
  public static coerceArray(arg: any, copy?: any): any {
    let self = this;

    // ArrayBuffer view
    if (arg.buffer && arg.name === "Uint8Array") {
      if (copy) {
        if (arg.slice) {
          arg = arg.slice();
        } else {
          arg = Array.prototype.slice.call(arg);
        }
      }

      return arg;
    }

    // It's an array; check it is a valid representation of a byte
    if (Array.isArray(arg)) {
      if (!self.checkInts(arg)) {
        throw new Error("Array contains invalid value: " + arg);
      }

      return new Uint8Array(arg);
    }

    // Something else, but behaves like an array (maybe a Buffer? Arguments?)
    if (self.checkInt(arg.length) && self.checkInts(arg)) {
      return new Uint8Array(arg);
    }

    throw new Error("unsupported array-like object");
  }

  /**
   * Convert raw text to bytes array
   * @param text {string} raw string
   * @returns {any} bytes array
   */
  public static textToBytes(text: string): any {
    let self = this;
    let result = [],
      i = 0;
    text = encodeURI(text);
    while (i < text.length) {
      let c = text.charCodeAt(i++);

      // if it is a % sign, encode the following 2 bytes as a hex value
      if (c === 37) {
        result.push(parseInt(text.substr(i, 2), 16));
        i += 2;

        // otherwise, just the actual byte
      } else {
        result.push(c);
      }
    }

    return self.coerceArray(result);
  }

  /**
   * Convert bytes array to raw string
   * @param bytes {number[]|Uint8Array} Bytes array
   * @returns {string} raw string
   */
  public static bytesToText(bytes: number[] | Uint8Array): string {
    let result = [],
      i = 0;

    while (i < bytes.length) {
      let c = bytes[i];

      if (c < 128) {
        result.push(String.fromCharCode(c));
        i++;
      } else if (c > 191 && c < 224) {
        result.push(
          String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
        );
        i += 2;
      } else {
        result.push(
          String.fromCharCode(
            ((c & 0x0f) << 12) |
              ((bytes[i + 1] & 0x3f) << 6) |
              (bytes[i + 2] & 0x3f)
          )
        );
        i += 3;
      }
    }

    return result.join("");
  }

  /**
   * Convert HEX string to bytes array
   * @param text {string} HEX string
   * @returns {number[]} bytes array
   * @constructor
   */
  public static HEXToBytes(text: string): number[] {
    let result = [];
    for (let i = 0; i < text.length; i += 2) {
      result.push(parseInt(text.substr(i, 2), 16));
    }

    return result;
  }

  /**
   * Convert bytes array to HEX string
   * @param bytes {number[]|Uint8Array} Bytes array
   * @returns {string} HEX String
   */
  public static bytesToHEX(bytes: number[] | Uint8Array): string {
    let self = this;
    let result = [];
    for (let i = 0; i < bytes.length; i++) {
      let v = bytes[i];
      result.push(self.HEXChars[(v & 0xf0) >> 4] + self.HEXChars[v & 0x0f]);
    }
    return result.join("");
  }
}
