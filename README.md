# seeded-shuffle

A pseudo-random array shuffling library using Linear Congruential Generator (LCG).

## Features

- 🔀 **Shuffle**: Deterministic array shuffling using Fisher-Yates algorithm
- ↩️ **Unshuffle**: Restore original order using the same seed
- 🎲 **RandInt**: Generate random integers within specified ranges
- 🎯 **Choice**: Random element selection from arrays (with/without replacement)

## Installation

```bash
npm install seeded-shuffle
```

## Quick Start

### Simple Array Shuffling

```typescript
import { shuffle, unshuffle } from 'seeded-shuffle';

const array = [1, 2, 3, 4, 5];

// Using numeric seed
const shuffled1 = shuffle(array, 12345);
console.log(shuffled1); // [5, 4, 2, 1, 3] (deterministic)

// Using string seed
const shuffled2 = shuffle(array, "my-seed");
console.log(shuffled2); // [1, 3, 2, 4, 5] (deterministic)

// Same seed = same result
const shuffled3 = shuffle(array, 12345);
console.log(shuffled1 === shuffled3); // Arrays contain same elements in same order

// Unshuffle: restore original order using the same seed
const restored1 = unshuffle(shuffled1, 12345);
console.log(restored1); // [1, 2, 3, 4, 5] - back to original!

const restored2 = unshuffle(shuffled2, "my-seed");
console.log(restored2); // [1, 2, 3, 4, 5] - back to original!
```

## Algorithm

This library uses a Linear Congruential Generator (LCG) with parameters:
- Multiplier: 9301
- Increment: 49297  
- Modulus: 233280

These parameters provide good distribution for non-cryptographic use cases.

**Note**: This is not suitable for cryptographic purposes.

## ⚠️ Important Limitations

<details>
<summary>...</summary>

### Array Size Limitations
The maximum array size you can shuffle is influenced by several factors:

#### LCG Period Limitation
- **Theoretical limit**: ~233,000 elements per shuffle
- The `shuffle()` method calls `next()` exactly `n-1` times for an array of length `n`
- Arrays larger than 233,000 elements may not shuffle properly due to period repetition

#### Practical Limitations
```typescript
// ✅ Safe: Small to medium arrays (recommended)
const smallArray = new Array(1000).fill(0).map((_, i) => i);
const shuffled = shuffle(smallArray, 123); // Works perfectly

// ⚠️ Caution: Large arrays approaching the period limit
const largeArray = new Array(200000).fill(0).map((_, i) => i);
const shuffled = shuffle(largeArray, 123); // Still works, but close to limit

// ❌ Problematic: Arrays exceeding the period
const tooLargeArray = new Array(300000).fill(0).map((_, i) => i);
const shuffled = shuffle(tooLargeArray, 123); // May show patterns due to period repetition
```

#### Memory Limitations
- JavaScript array size is limited by available memory
- Modern browsers/Node.js can typically handle arrays with millions of elements
- The algorithm creates a copy of the array, so you need ~2x the memory

#### Recommended Approach for Large Datasets
```typescript
// For very large datasets, split into chunks
function shuffleLargeArray<T>(array: T[], seed: number | string): T[] {
  const CHUNK_SIZE = 100000; // Stay well under the period limit
  
  if (array.length <= CHUNK_SIZE) {
    return shuffle(array, seed);
  }
  
  const result: T[] = [];
  for (let i = 0; i < array.length; i += CHUNK_SIZE) {
    const chunk = array.slice(i, i + CHUNK_SIZE);
    const chunkSeed = typeof seed === 'string' ? `${seed}-${i}` : seed + i;
    result.push(...shuffle(chunk, chunkSeed));
  }
  
  // Final shuffle of the concatenated chunks
  return shuffle(result, seed);
}
```

### Period Length
The LCG algorithm has a **period of 233,280**, which means:
- After exactly 233,280 calls to `next()` with the same seed, the sequence **repeats from the beginning**
- The 233,281st call will return the exact same value as the 1st call
- The 233,282nd call will return the exact same value as the 2nd call, and so on
- For most typical use cases (shuffling arrays, games, etc.), this is sufficient
- If you need more than 200,000 random numbers, consider:
  - Resetting the generator with a new seed periodically
  - Using a different random number generator for high-volume applications

### What Happens After 233,280 Calls?
```typescript
const rng = new SeededRandom(123);

// Store first few values
const firstValues = [rng.next(), rng.next(), rng.next()];

// Skip to near the period end (this would be slow in practice)
for (let i = 3; i < 233280; i++) {
  rng.next();
}

// These will be identical to the first three values
const repeatedValues = [rng.next(), rng.next(), rng.next()];

console.log(firstValues);     // [0.123..., 0.456..., 0.789...]
console.log(repeatedValues);  // [0.123..., 0.456..., 0.789...] - Exact same!
```

### When This Might Be a Problem
```typescript
const rng = new SeededRandom(123);

// Problem: Long-running process that exceeds the period
for (let i = 0; i < 500000; i++) {
  const value = rng.next(); // ⚠️ Will start repeating after 233,280 iterations
  // After 233,280 calls, you get the exact same sequence again
}

// Better approach for large datasets:
const largeArray = new Array(500000).fill(0).map((_, i) => i);

// Option 1: Split into chunks with different seeds
const rng1 = new SeededRandom(123);
const chunk1 = rng1.shuffle(largeArray.slice(0, 100000));

const rng2 = new SeededRandom(124); // Different seed
const chunk2 = rng2.shuffle(largeArray.slice(100000, 200000));

// Option 2: Reset periodically
const rng = new SeededRandom(123);
for (let chunk = 0; chunk < 5; chunk++) {
  // Reset every 200,000 operations to stay well under the period
  if (chunk > 0) rng.reset(123 + chunk);
  
  for (let i = 0; i < 200000; i++) {
    const value = rng.next(); // Safe from repetition
  }
}
```
</details>


## License

MIT License - see [LICENSE](LICENSE) file for details.
