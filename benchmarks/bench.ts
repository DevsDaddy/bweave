/**
 * BWeave Compressor Benchmark Implementation
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Required Modules */
import { performance } from 'perf_hooks';
import { BWeave, BWeaveMode } from '../src';
import * as zlib from 'zlib';
import { promisify } from 'util';

/* For Testing */
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

/* Additional Methods */
export type CompressionLibrary = 'bweave' | 'zlib' | 'lz4';

/**
 * Benchmark Result
 */
export interface BenchmarkResult {
    library: string;
    mode?: string;
    originalSize: number;
    compressedSize: number;
    ratio: number;
    compressTimeMs: number;
    decompressTimeMs: number;
}

/**
 * BWeave Benchmark
 */
export class BWeaveBenchmark {
    private readonly bweave: BWeave;

    /**
     * Create Benchmark Class
     */
    constructor() {
        this.bweave = new BWeave();
    }

    /**
     * Run All Benchmarks
     * @param data {Uint8Array} Data for benchmark
     * @param iterations {number} Number of iterations
     */
    async runAll(data: Uint8Array, iterations: number = 10): Promise<BenchmarkResult[]> {
        const results: BenchmarkResult[] = [];

        // BWeave (auto)
        results.push(await this.benchmarkBWeave(data, 'auto', iterations));

        // BWeave force modes
        results.push(await this.benchmarkBWeave(data, 'LZ77', iterations, BWeaveMode.LZ77));
        results.push(await this.benchmarkBWeave(data, 'RLE', iterations, BWeaveMode.RLE));
        results.push(await this.benchmarkBWeave(data, 'DELTA', iterations, BWeaveMode.DELTA));
        results.push(await this.benchmarkBWeave(data, 'STORE', iterations, BWeaveMode.STORE));

        // zlib tests
        if (typeof zlib !== 'undefined') {
            results.push(await this.benchmarkZlib(data, iterations));
        }

        return results;
    }

    /**
     * Run Benchmark
     * @param data
     * @param label
     * @param iterations
     * @param forcedMode
     * @private
     */
    private async benchmarkBWeave(
        data: Uint8Array,
        label: string,
        iterations: number,
        forcedMode?: BWeaveMode
    ): Promise<BenchmarkResult> {
        const compressor = forcedMode !== undefined
            ? new BWeave({ autoMode: false, forcedMode })
            : this.bweave;

        let totalCompressTime = 0;
        let totalDecompressTime = 0;
        let compressedSize = 0;

        for (let i = 0; i < iterations; i++) {
            const startCompress = performance.now();
            const compressed = compressor.compress(data);
            const compressTime = performance.now() - startCompress;
            totalCompressTime += compressTime;
            compressedSize = compressed.length; // одинаково для всех итераций, можно взять последнюю

            const startDecompress = performance.now();
            const decompressed = compressor.decompress(compressed);
            const decompressTime = performance.now() - startDecompress;
            totalDecompressTime += decompressTime;

            // Check correction
            if (decompressed.length !== data.length || !this.arraysEqual(decompressed, data)) {
                throw new Error(`Decompression mismatch for ${label}`);
            }
        }

        return {
            library: 'BWeave',
            mode: label,
            originalSize: data.length,
            compressedSize,
            ratio: data.length / compressedSize,
            compressTimeMs: totalCompressTime / iterations,
            decompressTimeMs: totalDecompressTime / iterations,
        };
    }

    private async benchmarkZlib(data: Uint8Array, iterations: number): Promise<BenchmarkResult> {
        let totalCompressTime = 0;
        let totalDecompressTime = 0;
        let compressedSize = 0;

        for (let i = 0; i < iterations; i++) {
            const startCompress = performance.now();
            const compressedBuffer = await deflate(data);
            const compressTime = performance.now() - startCompress;
            totalCompressTime += compressTime;
            compressedSize = compressedBuffer.length;

            const startDecompress = performance.now();
            const decompressedBuffer = await inflate(compressedBuffer);
            const decompressTime = performance.now() - startDecompress;
            totalDecompressTime += decompressTime;

            const decompressed = new Uint8Array(decompressedBuffer);
            if (!this.arraysEqual(decompressed, data)) {
                throw new Error('zlib decompression mismatch');
            }
        }

        return {
            library: 'zlib',
            mode: 'deflate',
            originalSize: data.length,
            compressedSize,
            ratio: data.length / compressedSize,
            compressTimeMs: totalCompressTime / iterations,
            decompressTimeMs: totalDecompressTime / iterations,
        };
    }

    private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}