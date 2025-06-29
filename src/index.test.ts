import { SeededRandom, shuffle, unshuffle } from ".";

describe("SeededRandom", () => {
  it("should generate consistent results with the same seed", () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it("should work with string seeds", () => {
    const rng1 = new SeededRandom("test");
    const rng2 = new SeededRandom("test");

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it("should shuffle arrays consistently with the same seed", () => {
    // Test with larger array (1000 elements instead of 5)
    const array = Array.from({ length: 1000 }, (_, i) => i + 1);
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const shuffled1 = rng1.shuffle(array);
    const shuffled2 = rng2.shuffle(array);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1).not.toEqual(array); // Should be different order

    // Verify all elements are preserved
    const sortedShuffled = [...shuffled1].sort((a, b) => a - b);
    expect(sortedShuffled).toEqual(array);
  });

  it("should handle edge cases", () => {
    const rng = new SeededRandom(12345);

    // Empty array
    expect(rng.shuffle([])).toEqual([]);

    // Single element array
    expect(rng.shuffle([1])).toEqual([1]);
  });

  it("should generate random integers in range with larger samples", () => {
    const rng = new SeededRandom(12345);
    const results = [];

    // Test with 1000 samples instead of 100
    for (let i = 0; i < 1000; i++) {
      const num = rng.randInt(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
      expect(Number.isInteger(num)).toBe(true);
      results.push(num);
    }

    // Check that all numbers appear at least once
    const unique = new Set(results);
    expect(unique.size).toBe(10); // All numbers from 1-10 should appear
  });

  it("should pick random elements with larger arrays", () => {
    const rng = new SeededRandom(12345);
    const array = Array.from({ length: 100 }, (_, i) => `item${i}`);

    const choice = rng.choice(array);
    expect(array).toContain(choice);

    // With duplicates (default) - test with larger count
    const choices = rng.choices(array, 200);
    expect(choices).toHaveLength(200);
    choices.forEach((item) => expect(array).toContain(item));

    // Unique elements only - test with larger arrays
    rng.reset(12345);
    const uniqueChoices = rng.choices(array, 50, { unique: true });
    expect(uniqueChoices).toHaveLength(50);
    expect(new Set(uniqueChoices).size).toBe(50); // All unique
    uniqueChoices.forEach((item) => expect(array).toContain(item));
  });

  it("should handle choices edge cases", () => {
    const rng = new SeededRandom(12345);
    const array = ["a", "b", "c"];

    // Should throw when count > array length and unique = true
    expect(() => rng.choices(array, 5, { unique: true })).toThrow();

    // Should work when count = array length and unique = true
    const allItems = rng.choices(array, 3, { unique: true });
    expect(allItems).toHaveLength(3);
    expect(new Set(allItems).size).toBe(3);
  });

  it("should reset seed correctly", () => {
    const rng = new SeededRandom(12345);
    const first1 = rng.next();
    const first2 = rng.next();

    rng.reset(12345);
    const reset1 = rng.next();
    const reset2 = rng.next();

    expect(reset1).toBe(first1);
    expect(reset2).toBe(first2);
  });

  it("should throw errors for invalid inputs", () => {
    expect(() => new SeededRandom(NaN)).toThrow();
    expect(() => new SeededRandom(Infinity)).toThrow();

    const rng = new SeededRandom(12345);
    expect(() => rng.shuffle("not an array" as unknown as [])).toThrow();
    expect(() => rng.choice([])).toThrow();
    expect(() => rng.randInt(10, 5)).toThrow();
  });

  it("should support index-based reversible shuffling with large arrays", () => {
    const original = Array.from({ length: 5000 }, (_, i) => i);

    // Test simple shuffle and unshuffle
    const shuffled = shuffle(original, 12345);
    const restored = unshuffle(shuffled, 12345);
    expect(restored).toEqual(original);

    // Should be deterministic
    const shuffled2 = shuffle(original, 12345);
    expect(shuffled).toEqual(shuffled2);

    // Verify all elements are preserved
    const sortedShuffled = [...shuffled].sort((a, b) => a - b);
    expect(sortedShuffled).toEqual(original);
  });
});

describe("Functional API", () => {
  it("should work with shuffle function on large arrays", () => {
    const array = Array.from({ length: 1000 }, (_, i) => i + 1);
    const shuffled1 = shuffle(array, 12345);
    const shuffled2 = shuffle(array, 12345);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1).not.toEqual(array);

    // Verify all elements are preserved
    const sortedShuffled = [...shuffled1].sort((a, b) => a - b);
    expect(sortedShuffled).toEqual(array);
  });

  it("should work with string seeds on large arrays", () => {
    const array = Array.from({ length: 500 }, (_, i) => `item${i}`);
    const shuffled1 = shuffle(array, "test");
    const shuffled2 = shuffle(array, "test");

    expect(shuffled1).toEqual(shuffled2);
  });

  it("should create seeded random instances with string seeds", () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom("test");

    expect(rng1).toBeInstanceOf(SeededRandom);
    expect(rng2).toBeInstanceOf(SeededRandom);
  });

  it("should work with functional reversible shuffle APIs on large arrays", () => {
    const original = Array.from({ length: 2000 }, (_, i) => i);
    const seed = 12345;

    // Test shuffle and unshuffle
    const shuffled = shuffle(original, seed);
    const unshuffled = unshuffle(shuffled, seed);
    expect(unshuffled).toEqual(original);

    // Should be deterministic
    const shuffled2 = shuffle(original, seed);
    expect(shuffled).toEqual(shuffled2);

    // Verify elements are preserved
    const sortedShuffled = [...shuffled].sort((a, b) => a - b);
    expect(sortedShuffled).toEqual(original);
  });
});

describe("Performance Tests", () => {
  it("should handle very large arrays efficiently", () => {
    const largeArray = Array.from({ length: 50000 }, (_, i) => i);

    const start = performance.now();
    const shuffled = shuffle(largeArray, 12345);
    const shuffleTime = performance.now() - start;

    const unshuffleStart = performance.now();
    const restored = unshuffle(shuffled, 12345);
    const unshuffleTime = performance.now() - unshuffleStart;

    // Should complete in reasonable time
    expect(shuffleTime).toBeLessThan(1000);
    expect(unshuffleTime).toBeLessThan(1000);

    // Should preserve all elements
    expect(restored).toEqual(largeArray);
  });

  it("should demonstrate randomness with large datasets", () => {
    const array = Array.from({ length: 10000 }, (_, i) => i);
    const rng = new SeededRandom(12345);

    const shuffled = rng.shuffle(array);

    // Check that most elements are not in their original position
    let samePosition = 0;
    for (let i = 0; i < array.length; i++) {
      if (shuffled[i] === array[i]) {
        samePosition++;
      }
    }

    // Less than 1% should be in same position for good shuffle
    expect(samePosition).toBeLessThan(array.length * 0.01);

    // All elements should be preserved
    const sortedShuffled = [...shuffled].sort((a, b) => a - b);
    expect(sortedShuffled).toEqual(array);
  });

  it("should handle stress testing of choices function", () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => `item${i}`);
    const rng = new SeededRandom(12345);

    // Test large number of choices with replacement
    const manyChoices = rng.choices(largeArray, 50000);
    expect(manyChoices).toHaveLength(50000);

    // All choices should be valid
    manyChoices.forEach((choice) => expect(largeArray).toContain(choice));

    // Test unique choices at scale
    rng.reset(12345);
    const uniqueChoices = rng.choices(largeArray, 5000, { unique: true });
    expect(uniqueChoices).toHaveLength(5000);
    expect(new Set(uniqueChoices).size).toBe(5000);
  });
});
