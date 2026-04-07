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
import {DedupWeave, DeltaWeave, JSONWeave, LZ77Weave, RLEWeave, StoreWeave} from "./strategies";
import {BWeaveUtils} from "./utils";
import {DictionaryCache} from "./cache/dictionary";

/**
 * Compressor Mode
 */
export enum BWeaveMode {
    STORE = 0,
    LZ77 = 1,
    RLE = 2,
    DELTA = 3,
    JSON_WEAVE = 4,
    DEDUP_WEAVE = 5,
}

/**
 * Compressor Options
 */
export interface BWeaveOptions {
    /* Automatically choose compression mode (by-defaults true) */
    autoMode?: boolean;
    /* Force Mode (autoMode = false) */
    forcedMode?: BWeaveMode;
    /* Compression block size in bytes (0 = all input buffer) */
    blockSize?: number;
    /* Use Parallel compression (if blocksize > 0) */
    parallel?: boolean;
    /* Cache last window for cross-pacakge compression */
    dictCache?: boolean;
    /* Adds checksum for headers */
    checksum?: boolean;
    /* schema for key mappings */
    jsonSchema?: Record<string, number>;
    /* Block size for DEDUP_WEAVE (by-defaults 64) */
    dedupBlockSize?: number;
    /* Dictionary Cache */
    sharedDict?: Uint8Array | undefined;
}

/**
 * Create BWeave Compressor
 */
export class BWeave {
    /* Compressor Options */
    private readonly strategies: Map<BWeaveMode, IWeaveStrategy>;
    private options: Required<BWeaveOptions>;
    private lastWindow: Uint8Array | null = null;

    /**
     * Create new BWeave Compressor Instance
     * @param options {BWeaveOptions} BWeave Compressor Options
     */
    constructor(options: BWeaveOptions = {}) {
        // Default Options
        this.options = {
            autoMode: options.autoMode ?? true,
            forcedMode: options.forcedMode ?? BWeaveMode.LZ77,
            blockSize: options.blockSize ?? 0,
            parallel: options.parallel ?? false,
            dictCache: options.dictCache ?? false,
            checksum: options.checksum ?? false,
            jsonSchema: options.jsonSchema ?? {},
            dedupBlockSize: options.dedupBlockSize ?? 64,
            sharedDict: options.sharedDict as Uint8Array ?? undefined
        };

        let dictCache: DictionaryCache | undefined;
        if (options.sharedDict) dictCache = new DictionaryCache(options.sharedDict);

        // Add Strategies Map
        const lz77 = new LZ77Weave(dictCache);
        const rle = new RLEWeave();
        const delta = new DeltaWeave();
        const store = new StoreWeave();
        const jsonWeave = new JSONWeave(options.jsonSchema, lz77);
        const dedup = new DedupWeave(options.dedupBlockSize);

        this.strategies = new Map([
            [BWeaveMode.LZ77, lz77],
            [BWeaveMode.RLE, rle],
            [BWeaveMode.DELTA, delta],
            [BWeaveMode.STORE, store],
            [BWeaveMode.JSON_WEAVE, jsonWeave],
            [BWeaveMode.DEDUP_WEAVE, dedup],
        ]);
    }

    /**
     * Compress data
     * @param data {Uint8Array} Uncompressed buffer
     * @returns {Uint8Array} Compressed buffer
     */
    public compress(data: Uint8Array): Uint8Array {
        if (data.length === 0) return BWeaveUtils.writeHeader(BWeaveMode.STORE, 0, new Uint8Array(0), this.options.checksum);
        const mode = this.options.autoMode ? BWeaveUtils.detectBestMode(data, this.strategies) : this.options.forcedMode;
        let strategy = this.strategies.get(mode)!;

        if (this.options.dictCache && this.lastWindow && mode === BWeaveMode.LZ77) {
            const combined = new Uint8Array(this.lastWindow.length + data.length);
            combined.set(this.lastWindow);
            combined.set(data, this.lastWindow.length);
            const compressedCombined = strategy.compress(combined);
            this.lastWindow = data.slice(-4096);
            return BWeaveUtils.writeHeader(mode, data.length, compressedCombined, this.options.checksum);
        }

        const compressed = strategy.compress(data);
        if (compressed.length >= data.length && mode !== BWeaveMode.STORE) {
            const storeStrategy = this.strategies.get(BWeaveMode.STORE)!;
            const storeCompressed = storeStrategy.compress(data);
            this.lastWindow = this.options.dictCache ? data.slice(-4096) : null;
            return BWeaveUtils.writeHeader(BWeaveMode.STORE, data.length, storeCompressed, this.options.checksum);
        }
        this.lastWindow = this.options.dictCache ? data.slice(-4096) : null;
        return BWeaveUtils.writeHeader(mode, data.length, compressed, this.options.checksum);
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