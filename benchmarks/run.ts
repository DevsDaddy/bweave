/**
 * BWeave Compressor Benchmarks Runner
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import { BWeaveBenchmark } from './bench';
import {
    generateTextData,
    generateRepetitiveData,
    generateMonotonicData,
    generateRandomData,
} from './data/generators';

// Data sizes
const SIZES = [1024, 10240, 65536]; // 1KB, 10KB, 64KB
const ITERATIONS = 5;

/**
 * Run Benchmark
 */
async function run() {
    const benchmark = new BWeaveBenchmark();

    console.log('🚀 BWeave Benchmark Suite\n');
    console.log(`Iterations per test: ${ITERATIONS}\n`);

    for (const size of SIZES) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📦 Data size: ${size} bytes (${(size / 1024).toFixed(1)} KB)`);
        console.log(`${'='.repeat(60)}`);

        const datasets = [
            { name: '📝 Text (JSON)', data: generateTextData(size) },
            { name: '🔄 Repetitive (pattern)', data: generateRepetitiveData(size) },
            { name: '📈 Monotonic (delta)', data: generateMonotonicData(size) },
            { name: '🎲 Random', data: generateRandomData(size) },
        ];

        for (const { name, data } of datasets) {
            console.log(`\n▶ ${name}`);
            const results = await benchmark.runAll(data, ITERATIONS);
            console.table(results.map(r => ({
                'Library/Mode': `${r.library}${r.mode ? ` (${r.mode})` : ''}`,
                'Ratio': r.ratio.toFixed(2),
                'Compress (ms)': r.compressTimeMs.toFixed(2),
                'Decompress (ms)': r.decompressTimeMs.toFixed(2),
                'Compressed (bytes)': r.compressedSize,
            })));
        }
    }
}

run().catch(console.error);