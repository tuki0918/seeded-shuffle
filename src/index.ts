const UINT32_SIZE = 0x100000000;

export class SeededRandom {
  private state0: number;
  private state1: number;
  private state2: number;
  private state3: number;

  constructor(seed: number | string) {
    const state = createSeedState(seed);
    this.state0 = state[0];
    this.state1 = state[1];
    this.state2 = state[2];
    this.state3 = state[3];
  }

  // xoshiro128** implementation with 128-bit state and period 2^128 - 1.
  // This keeps seeded shuffling deterministic while avoiding BigInt on hot paths.
  next(): number {
    return this.nextUint32() / UINT32_SIZE;
  }

  private nextUint32(): number {
    const result = Math.imul(rotl(Math.imul(this.state1, 5) >>> 0, 7), 9) >>> 0;
    const t = (this.state1 << 9) >>> 0;

    this.state2 = (this.state2 ^ this.state0) >>> 0;
    this.state3 = (this.state3 ^ this.state1) >>> 0;
    this.state1 = (this.state1 ^ this.state2) >>> 0;
    this.state0 = (this.state0 ^ this.state3) >>> 0;
    this.state2 = (this.state2 ^ t) >>> 0;
    this.state3 = rotl(this.state3, 11);

    return result;
  }

  private randomIndex(upperExclusive: number): number {
    return Math.floor((this.nextUint32() / UINT32_SIZE) * upperExclusive);
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
      const j = this.randomIndex(i + 1);
      const value = result[i];
      result[i] = result[j];
      result[j] = value;
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
    return this.randomIndex(max - min + 1) + min;
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
    const index = this.randomIndex(array.length);
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

    const result: T[] = Number.isInteger(count) ? new Array(count) : [];

    if (!unique) {
      // With replacement (duplicates allowed)
      for (let i = 0; i < count; i++) {
        const index = this.randomIndex(array.length);
        result[i] = array[index];
      }
    } else {
      // Without replacement (no duplicates)
      const availableItems = this.safeCopy(array);
      let remaining = availableItems.length;
      for (let i = 0; i < count; i++) {
        const index = this.randomIndex(remaining);
        result[i] = availableItems[index];
        availableItems[index] = availableItems[remaining - 1];
        remaining--;
      }
    }

    return result;
  }

  /**
   * Reset the random number generator with a new seed
   * @param seed - New seed value
   */
  reset(seed: number | string): void {
    const state = createSeedState(seed);
    this.state0 = state[0];
    this.state1 = state[1];
    this.state2 = state[2];
    this.state3 = state[3];
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

  /**
   * Restore original order of an array using the same generator state sequence
   * used by shuffle.
   * @param shuffledArray - Previously shuffled array
   * @returns Array restored to original order
   */
  unshuffle<T>(shuffledArray: T[]): T[] {
    if (!Array.isArray(shuffledArray)) {
      throw new Error("Input must be an array");
    }
    if (shuffledArray.length <= 1) {
      return this.safeCopy(shuffledArray);
    }

    const swapIndices = new Array(shuffledArray.length);
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      swapIndices[i] = this.randomIndex(i + 1);
    }

    const result = this.safeCopy(shuffledArray);
    for (let i = 1; i < result.length; i++) {
      const j = swapIndices[i];
      const value = result[i];
      result[i] = result[j];
      result[j] = value;
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
  return random.unshuffle(shuffledArray);
}

/**
 * Generate four 32-bit state words from a number or string seed.
 */
function createSeedState(
  seed: number | string,
): [number, number, number, number] {
  if (typeof seed === "number" && !Number.isFinite(seed)) {
    throw new Error("Seed must be a finite number or valid string");
  }

  const seedText =
    typeof seed === "string" ? `s:${seed}` : `n:${Math.abs(Math.floor(seed))}`;
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let i = 0; i < seedText.length; i++) {
    const char = seedText.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ char, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ char, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ char, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ char, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  h1 = (h1 ^ h2 ^ h3 ^ h4) >>> 0;
  h2 = (h2 ^ h1) >>> 0;
  h3 = (h3 ^ h1) >>> 0;
  h4 = (h4 ^ h1) >>> 0;

  if ((h1 | h2 | h3 | h4) === 0) {
    return [0x6d2b79f5, 0x1b56c4e9, 0x85ebca6b, 0xc2b2ae35];
  }

  return [h1, h2, h3, h4];
}

function rotl(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}
