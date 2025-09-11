# seeded-shuffle

A pseudo-random array shuffling library using Permuted Congruential Generator (PCG) for high-quality randomness.

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

This library uses a Permuted Congruential Generator (PCG) algorithm for high-quality randomness:
- **Period**: 2^64 (effectively unlimited for practical purposes)
- **Performance**: Fast generation suitable for high-volume applications

> [!WARNING]
> This is not suitable for cryptographic purposes.

## License

MIT License - see [LICENSE](LICENSE) file for details.
