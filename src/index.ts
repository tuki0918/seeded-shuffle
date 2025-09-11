export class SeededRandom {
  // PCG (Permuted Congruential Generator) constants for better distribution and longer period
  // Period: 2^64 (effectively unlimited for practical purposes)
  // Suitable for high-quality statistical applications and large-scale simulations
  private static readonly PCG_MULTIPLIER = 6364136223846793005n;

  private state: bigint;
  private inc: bigint;

  constructor(seed: number | string) {
    const numericSeed = typeof seed === "string" ? hashString(seed) : seed;
    if (!Number.isFinite(numericSeed)) {
      throw new Error("Seed must be a finite number or valid string");
    }

    const seedValue = BigInt(Math.abs(Math.floor(numericSeed)));
    this.state = seedValue;
    this.inc = (seedValue << 1n) | 1n; // Must be odd for PCG
  }

  // PCG (Permuted Congruential Generator) implementation
  // Provides excellent statistical properties with 2^64 period
  // Much faster than Mersenne Twister while maintaining high quality
  next(): number {
    const oldstate = this.state;
    // PCG advance step
    this.state =
      (oldstate * SeededRandom.PCG_MULTIPLIER + this.inc) & 0xffffffffffffffffn;

    // PCG output function
    const xorshifted = Number((oldstate >> 18n) ^ oldstate) >>> 0;
    const rot = Number(oldstate >> 59n);
    const result = ((xorshifted >>> rot) | (xorshifted << (-rot & 31))) >>> 0;

    return result / 0x100000000;
  }

  shuffle<T>(array: T[]): T[] {
    if (!Array.isArray(array)) {
      throw new Error("Input must be an array");
    }
    if (array.length <= 1) {
      return this.safeCopy(array);
    }

    const result = this.safeCopy(array);
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  safeCopy<T>(array: T[]): T[] {
    const result = new Array(array.length);
    for (let i = 0; i < array.length; i++) {
      result[i] = array[i];
    }
    return result;
  }

  static generateSeed(): number {
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Get a random integer between min and max (inclusive)
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer
   */
  randInt(min: number, max: number): number {
    if (min > max) {
      throw new Error("min must be less than or equal to max");
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Get a random element from an array
   * @param array - Array to pick from
   * @returns Random element
   */
  choice<T>(array: T[]): T {
    if (!Array.isArray(array)) {
      throw new Error("Input must be an array");
    }
    if (array.length === 0) {
      throw new Error("Array cannot be empty");
    }
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }

  /**
   * Get multiple random elements from an array
   * @param array - Array to pick from
   * @param count - Number of elements to pick
   * @param options - Configuration options
   * @param options.unique - Whether to ensure all elements are unique (no duplicates). Default: false
   * @returns Array of random elements
   */
  choices<T>(
    array: T[],
    count: number,
    options: { unique?: boolean } = {},
  ): T[] {
    if (!Array.isArray(array)) {
      throw new Error("Input must be an array");
    }
    if (array.length === 0) {
      throw new Error("Array cannot be empty");
    }
    if (count < 0) {
      throw new Error("Count must be non-negative");
    }

    const unique = options.unique ?? false;

    if (unique && count > array.length) {
      throw new Error(
        "Count cannot be greater than array length when unique is true",
      );
    }

    const result: T[] = [];

    if (!unique) {
      // With replacement (duplicates allowed)
      for (let i = 0; i < count; i++) {
        result.push(this.choice(array));
      }
    } else {
      // Without replacement (no duplicates)
      const availableItems = this.safeCopy(array);
      for (let i = 0; i < count; i++) {
        const index = Math.floor(this.next() * availableItems.length);
        result.push(availableItems[index]);
        availableItems.splice(index, 1);
      }
    }

    return result;
  }

  /**
   * Reset the random number generator with a new seed
   * @param seed - New seed value
   */
  reset(seed: number | string): void {
    const numericSeed = typeof seed === "string" ? hashString(seed) : seed;
    if (!Number.isFinite(numericSeed)) {
      throw new Error("Seed must be a finite number or valid string");
    }

    const seedValue = BigInt(Math.abs(Math.floor(numericSeed)));
    this.state = seedValue;
    this.inc = (seedValue << 1n) | 1n; // Must be odd for PCG
  }

  /**
   * Generate a shuffled index array for a given length
   * @param length - Length of the array
   * @returns Array of shuffled indices
   */
  generateShuffleIndices(length: number): number[] {
    if (!Number.isFinite(length) || length < 0 || !Number.isInteger(length)) {
      throw new Error("Length must be a non-negative integer");
    }
    const indices = Array.from({ length }, (_, i) => i);
    return this.shuffle(indices);
  }

  /**
   * Apply a shuffle order to an array using indices
   * @param array - Array to shuffle
   * @param indices - Shuffle indices
   * @returns Shuffled array
   */
  applyShuffleByIndices<T>(array: T[], indices: number[]): T[] {
    if (array.length !== indices.length) {
      throw new Error("Array and indices must have the same length");
    }
    return indices.map((i) => array[i]);
  }

  /**
   * Restore original order of an array using shuffle indices
   * @param shuffledArray - Shuffled array
   * @param indices - Shuffle indices used for shuffling
   * @returns Array in original order
   */
  unshuffleByIndices<T>(shuffledArray: T[], indices: number[]): T[] {
    if (shuffledArray.length !== indices.length) {
      throw new Error("Array and indices must have the same length");
    }
    const result: T[] = new Array(shuffledArray.length);
    for (let i = 0; i < indices.length; i++) {
      result[indices[i]] = shuffledArray[i];
    }
    return result;
  }
}

/**
 * Shuffle an array using a seeded random number generator
 * @param array - The array to shuffle
 * @param seed - The seed for random number generation (number or string)
 * @returns A new shuffled array
 */
export function shuffle<T>(array: T[], seed: number | string): T[] {
  const random = new SeededRandom(seed);
  return random.shuffle(array);
}

/**
 * Unshuffle an array using the same seed that was used for shuffling
 * @param shuffledArray - Previously shuffled array
 * @param seed - Same seed used for original shuffling
 * @returns Array restored to original order
 */
export function unshuffle<T>(shuffledArray: T[], seed: number | string): T[] {
  const random = new SeededRandom(seed);
  const indices = random.generateShuffleIndices(shuffledArray.length);
  return random.unshuffleByIndices(shuffledArray, indices);
}

/**
 * Simple hash function to convert string to number
 * @param str - String to hash
 * @returns Hash value as number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000000;
}
