export class SeededRandom {
  // Linear Congruential Generator (LCG) constants
  // These are classic parameters often used in simple LCG implementations, such as in old BASIC languages
  //
  // IMPORTANT LIMITATIONS:
  // - Period length: 233,280 (after this many calls to next(), the sequence repeats)
  // - For applications requiring > 200,000 random numbers, consider using a different algorithm
  // - Not suitable for cryptographic purposes or high-quality statistical applications
  private static readonly LCG_MULTIPLIER = 9301;
  private static readonly LCG_INCREMENT = 49297;
  private static readonly LCG_MODULUS = 233280;

  private seed: number;

  constructor(seed: number | string) {
    const numericSeed = typeof seed === "string" ? hashString(seed) : seed;
    if (!Number.isFinite(numericSeed)) {
      throw new Error("Seed must be a finite number or valid string");
    }
    this.seed = Math.abs(Math.floor(numericSeed)) % 1000000;
  }

  // This method uses a Linear Congruential Generator (LCG) to produce pseudo-random numbers.
  // The constants provide a reasonable period and distribution for non-cryptographic purposes,
  // but are not suitable for cryptographic use.
  //
  // WARNING: This LCG has a period of 233,280. If you call this method more than ~200,000 times
  // with the same seed, the sequence will start repeating. For applications requiring more
  // random numbers, consider resetting with a new seed or using a different algorithm.
  next(): number {
    this.seed =
      (this.seed * SeededRandom.LCG_MULTIPLIER + SeededRandom.LCG_INCREMENT) %
      SeededRandom.LCG_MODULUS;
    return this.seed / SeededRandom.LCG_MODULUS;
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
    this.seed = Math.abs(Math.floor(numericSeed)) % 1000000;
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
