# seeded-shuffle

A deterministic reversible array shuffling library using seedable xoshiro128** randomness.

## Features

- 🔀 **Shuffle**: Deterministic array shuffling using Fisher-Yates algorithm
- ↩️ **Unshuffle**: Restore original order using the same seed
- 🎲 **RandInt**: Generate random integers within specified ranges
- 🎯 **Choice**: Random element selection from arrays (with/without replacement)

## Installation

```bash
npm i @tuki0918/seeded-shuffle
```

## Quick Start

### Simple Array Shuffling

```typescript
import { shuffle, unshuffle } from "@tuki0918/seeded-shuffle";

const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Using numeric seed
const shuffled1 = shuffle(array, 12345);
console.log(shuffled1); // [8, 6, 5, 2, 7, 10, 4, 9, 1, 3] (deterministic)

// Using string seed
const shuffled2 = shuffle(array, "my-seed");
console.log(shuffled2); // [5, 9, 7, 1, 3, 6, 4, 10, 8, 2] (deterministic)

// Same seed = same result
const shuffled3 = shuffle(array, 12345);
console.log(JSON.stringify(shuffled1) === JSON.stringify(shuffled3));

// Unshuffle: restore original order using the same seed
const restored1 = unshuffle(shuffled1, 12345);
console.log(restored1); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] - back to original!

const restored2 = unshuffle(shuffled2, "my-seed");
console.log(restored2); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] - back to original!
```

## Algorithm

This library uses xoshiro128** for deterministic pseudo-randomness:
- **State size**: 128-bit internal state derived from number or string seeds
- **Period**: 2^128 - 1 for non-zero generator states
- **Performance**: 32-bit integer operations only; no BigInt in hot paths
- **Reversibility**: Designed for large deterministic permutations such as
  pixel arrays, as long as the same seed and package major version are used

> [!NOTE]
> Version 2 changes the seeded output sequence. The same seed remains
> deterministic, but it will not produce the same shuffle order as version 1.

> [!WARNING]
> This is not suitable for cryptographic purposes.

## Benchmarks

Run the benchmark suite to compare the current implementation with the latest
stable baseline tag:

```bash
npm run benchmark
```

The benchmark uses `node:perf_hooks` and compares `v1.0.1` with the current
working tree by default. Override the comparison refs when needed:

```bash
BENCH_BASE_REF=v1.0.1 BENCH_CANDIDATE_REF=HEAD npm run benchmark
```

CI runs a shorter benchmark job with `npm run benchmark:ci` on Node.js 22. The
CI job is intended to keep the benchmark script operational and publish timing
logs; use local benchmark results for performance release notes.

## License

MIT License - see [LICENSE](LICENSE) file for details.
