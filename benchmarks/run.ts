/**
 * BWeave Compressor Benchmarks Runner
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
import {BenchmarkResult, BWeaveBenchmark} from './bench';
import {
    generateTextData,
    generateRepetitiveData,
    generateMonotonicData,
    generateRandomData, generateJSONData,
} from './data/generators';

// Data sizes
const SIZES = [1024, 10240, 65536]; // 1KB, 10KB, 64KB
const ITERATIONS = 5;

// Benchmark Winners Categories
type WinnerCategories = {
    bestSpeed: BenchmarkResult;
    bestRatio: BenchmarkResult;
    bestOverall: BenchmarkResult;
};

function findWinners(results: BenchmarkResult[]): WinnerCategories {
    let bestSpeed = results[0];
    let bestRatio = results[0];
    let bestOverall = results[0];

    for (const r of results) {
        if (r.compressTimeMs < bestSpeed.compressTimeMs) bestSpeed = r;
        if (r.ratio > bestRatio.ratio) bestRatio = r;
        const score = r.compressTimeMs / r.ratio;
        const bestScore = bestOverall.compressTimeMs / bestOverall.ratio;
        if (score < bestScore) bestOverall = r;
    }
    return { bestSpeed, bestRatio, bestOverall };
}

function formatWinnerMarker(winner: BenchmarkResult, current: BenchmarkResult): string {
    return winner === current ? '🏆' : '';
}

/**
 * Run Benchmark
 */
async function run() {
    const benchmark = new BWeaveBenchmark();

    console.log('🚀 BWeave Enhanced Benchmark Suite\n');
    console.log(`Iterations per test: ${ITERATIONS}\n`);

    for (const size of SIZES) {
        console.log(`\n${'='.repeat(100)}`);
        console.log(`📦 Data size: ${size} bytes (${(size / 1024).toFixed(1)} KB)`);
        console.log(`${'='.repeat(100)}`);

        const datasets = [
            { name: '📝 Text (JSON)', data: generateTextData(size) },
            { name: '🔄 Repetitive (pattern)', data: generateRepetitiveData(size) },
            { name: '📈 Monotonic (delta)', data: generateMonotonicData(size) },
            { name: '🎲 Random', data: generateRandomData(size) }
        ];

        for (const { name, data } of datasets) {
            console.log(`\n▶ ${name}`);
            const results = await benchmark.runAll(data, ITERATIONS);
            const winners = findWinners(results);

            const tableRows = results.map(r => ({
                'Library/Mode': `${r.library}${r.mode ? ` (${r.mode})` : ''}`,
                'Ratio': r.ratio.toFixed(2),
                'Compress (ms)': r.compressTimeMs.toFixed(2),
                'Decompress (ms)': r.decompressTimeMs.toFixed(2),
                'Compressed (bytes)': r.compressedSize,
                '🏆 Speed': formatWinnerMarker(winners.bestSpeed, r),
                '🏆 Ratio': formatWinnerMarker(winners.bestRatio, r),
                '🏆 Overall': formatWinnerMarker(winners.bestOverall, r),
            }));

            console.table(tableRows);
            console.log(`\n✨ Winners: Speed: ${winners.bestSpeed.library}${winners.bestSpeed.mode ? ` (${winners.bestSpeed.mode})` : ''} | Ratio: ${winners.bestRatio.library}${winners.bestRatio.mode ? ` (${winners.bestRatio.mode})` : ''} | Overall: ${winners.bestOverall.library}${winners.bestOverall.mode ? ` (${winners.bestOverall.mode})` : ''}`);
        }
    }
}

run().catch(console.error);