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
import {BWeave, BWeaveCompressorParallel, BWeaveMode} from '../src';
import * as zlib from 'zlib';
import { promisify } from 'util';

/* For Testing */
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

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
    /* Benchmark Setup */
    private bweaveAuto = new BWeave({ autoMode: true });
    private bweaveLZ77 = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77 });
    private bweaveRLE = new BWeave({ autoMode: false, forcedMode: BWeaveMode.RLE });
    private bweaveDelta = new BWeave({ autoMode: false, forcedMode: BWeaveMode.DELTA });
    private bweaveJSON = new BWeave({ autoMode: false, forcedMode: BWeaveMode.JSON_WEAVE, jsonSchema: { id: 1, name: 2, value: 3, tags: 4, active: 5 } });
    private bweaveDedup = new BWeave({ autoMode: false, forcedMode: BWeaveMode.DEDUP_WEAVE, dedupBlockSize: 64 });
    private bweaveParallel = new BWeaveCompressorParallel({ autoMode: true });
    private bweaveChecksum = new BWeave({ autoMode: true, checksum: true });
    private bweaveDictCache = new BWeave({ autoMode: false, forcedMode: BWeaveMode.LZ77, dictCache: true });

    /**
     * Run All Benchmarks
     * @param data {Uint8Array} Data for benchmark
     * @param iterations {number} Number of iterations
     */
    async runAll(data: Uint8Array, iterations: number = 10): Promise<BenchmarkResult[]> {
        const results: BenchmarkResult[] = [];

        results.push(await this.benchmarkBWeave(this.bweaveAuto, data, 'Auto', iterations));
        results.push(await this.benchmarkBWeave(this.bweaveLZ77, data, 'LZ77', iterations));
        results.push(await this.benchmarkBWeave(this.bweaveRLE, data, 'RLE', iterations));
        results.push(await this.benchmarkBWeave(this.bweaveDelta, data, 'Delta', iterations));
        results.push(await this.benchmarkBWeave(this.bweaveDedup, data, 'DEDUP_WEAVE', iterations));
        results.push(await this.benchmarkParallel(data, iterations));
        results.push(await this.benchmarkZlib(data, iterations));

        return results;
    }

    private async benchmarkBWeave(
        compressor: BWeave,
        data: Uint8Array,
        label: string,
        iterations: number
    ): Promise<BenchmarkResult> {
        let totalCompressTime = 0;
        let totalDecompressTime = 0;
        let compressedSize = 0;

        for (let i = 0; i < iterations; i++) {
            const startCompress = performance.now();
            const compressed = compressor.compress(data);
            const compressTime = performance.now() - startCompress;
            totalCompressTime += compressTime;
            compressedSize = compressed.length;

            const startDecompress = performance.now();
            const decompressed = compressor.decompress(compressed);
            const decompressTime = performance.now() - startDecompress;
            totalDecompressTime += decompressTime;

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

    private async benchmarkParallel(data: Uint8Array, iterations: number): Promise<BenchmarkResult> {
        let totalCompressTime = 0;
        let totalDecompressTime = 0;
        let compressedSize = 0;

        for (let i = 0; i < iterations; i++) {
            const startCompress = performance.now();
            const compressed = await this.bweaveParallel.compress(data, 32768);
            const compressTime = performance.now() - startCompress;
            totalCompressTime += compressTime;
            compressedSize = compressed.length;

            const startDecompress = performance.now();
            const decompressed = await this.bweaveParallel.decompress(compressed);
            const decompressTime = performance.now() - startDecompress;
            totalDecompressTime += decompressTime;

            if (decompressed.length !== data.length || !this.arraysEqual(decompressed, data)) {
                throw new Error(`Decompression mismatch for Parallel`);
            }
        }

        return {
            library: 'BWeave',
            mode: 'Parallel (auto)',
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