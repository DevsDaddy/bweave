/**
 * BWeave Compressor Implementation
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Required Modules */
import {IWeaveStrategy} from "./types";
import {DeltaWeave, LZ77Weave, RLEWeave, StoreWeave} from "./strategies";
import {BWeaveUtils} from "./utils";

/**
 * Compressor Mode
 */
export enum BWeaveMode {
    STORE = 0,
    LZ77 = 1,
    RLE = 2,
    DELTA = 3
}

/**
 * Compressor Options
 */
export interface BWeaveOptions {
    /** Automatically choose compression mode (by-defaults true) */
    autoMode?: boolean;
    /** Force Mode (autoMode = false) */
    forcedMode?: BWeaveMode;
    /** Compression block size in bytes (0 = all input buffer) */
    blockSize?: number;
}

/**
 * Create BWeave Compressor
 */
export class BWeave {
    /* Compressor Options */
    private strategies: Map<BWeaveMode, IWeaveStrategy>;
    private options: Required<BWeaveOptions>;

    /**
     * Create new BWeave Compressor Instance
     * @param options {BWeaveOptions} BWeave Compressor Options
     */
    constructor(options: BWeaveOptions = {}) {
        this.options = {
            autoMode: options.autoMode ?? true,
            forcedMode: options.forcedMode ?? BWeaveMode.LZ77,
            blockSize: options.blockSize ?? 0,
        };
        this.strategies = new Map([
            [BWeaveMode.LZ77, new LZ77Weave()],
            [BWeaveMode.RLE, new RLEWeave()],
            [BWeaveMode.DELTA, new DeltaWeave()],
            [BWeaveMode.STORE, new StoreWeave()],
        ]);
    }

    /**
     * Compress data
     * @param data {Uint8Array} Uncompressed buffer
     * @returns {Uint8Array} Compressed buffer
     */
    public compress(data: Uint8Array): Uint8Array {
        if (data.length === 0) {
            return BWeaveUtils.writeHeader(BWeaveMode.STORE, 0, new Uint8Array(0));
        }

        const mode = this.options.autoMode ? BWeaveUtils.detectBestMode(data) : this.options.forcedMode;
        const strategy = this.strategies.get(mode)!;
        const compressed = strategy.compress(data);

        if (compressed.length >= data.length && mode !== BWeaveMode.STORE) {
            const storeStrategy = this.strategies.get(BWeaveMode.STORE)!;
            const storeCompressed = storeStrategy.compress(data);
            return BWeaveUtils.writeHeader(BWeaveMode.STORE, data.length, storeCompressed);
        }
        return BWeaveUtils.writeHeader(mode, data.length, compressed);
    }

    /**
     * Decompress data
     * @param compressed {Uint8Array} Compressed buffer
     * @returns {Uint8Array} Decompressed buffer
     */
    public decompress(compressed: Uint8Array): Uint8Array {
        if (compressed.length === 0) return new Uint8Array(0);
        const { mode, originalLen, payload } = BWeaveUtils.readHeader(compressed);
        const strategy = this.strategies.get(mode);
        if (!strategy) throw new Error(`Unsupported BWeave mode ${mode}`);
        return strategy.decompress(payload, originalLen);
    }
}