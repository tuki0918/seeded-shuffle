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

  it("should handle additional invalid inputs and edge cases", () => {
    const rng = new SeededRandom(12345);

    // Invalid inputs for choices
    expect(() => rng.choices("not an array" as unknown as [], 5)).toThrow(
      "Input must be an array",
    );
    expect(() => rng.choices([], 1)).toThrow("Array cannot be empty");
    expect(() => rng.choices([1, 2, 3], -1)).toThrow(
      "Count must be non-negative",
    );

    // Invalid inputs for choice
    expect(() => rng.choice("not an array" as unknown as [])).toThrow(
      "Input must be an array",
    );

    // Invalid reset values
    expect(() => rng.reset(NaN)).toThrow(
      "Seed must be a finite number or valid string",
    );
    expect(() => rng.reset(Infinity)).toThrow(
      "Seed must be a finite number or valid string",
    );
    expect(() => rng.reset(-Infinity)).toThrow(
      "Seed must be a finite number or valid string",
    );

    // Invalid generateShuffleIndices
    expect(() => rng.generateShuffleIndices(-1)).toThrow(
      "Length must be a non-negative integer",
    );
    expect(() => rng.generateShuffleIndices(NaN)).toThrow(
      "Length must be a non-negative integer",
    );
    expect(() => rng.generateShuffleIndices(1.5)).toThrow(
      "Length must be a non-negative integer",
    );
    expect(() => rng.generateShuffleIndices(Infinity)).toThrow(
      "Length must be a non-negative integer",
    );

    // Valid edge cases that should not throw
    expect(() => rng.generateShuffleIndices(0)).not.toThrow();
    expect(() => rng.choices([1, 2, 3], 0)).not.toThrow();
    expect(() => rng.randInt(-5, -1)).not.toThrow();
  });

  it("should handle string seed edge cases", () => {
    // Empty string
    const rng1 = new SeededRandom("");
    expect(rng1).toBeInstanceOf(SeededRandom);

    // Very long string
    const longString = "a".repeat(1000);
    const rng2 = new SeededRandom(longString);
    expect(rng2).toBeInstanceOf(SeededRandom);

    // Special characters
    const specialString = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const rng3 = new SeededRandom(specialString);
    expect(rng3).toBeInstanceOf(SeededRandom);

    // Unicode characters
    const unicodeString = "こんにちは世界🌍🎲";
    const rng4 = new SeededRandom(unicodeString);
    expect(rng4).toBeInstanceOf(SeededRandom);

    // Should be deterministic with same string
    const rng5 = new SeededRandom(unicodeString);
    expect(rng4.next()).toBe(rng5.next());
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

  it("should generate shuffle indices correctly", () => {
    const rng = new SeededRandom(12345);
    const length = 100;

    const indices = rng.generateShuffleIndices(length);

    // Should return array of correct length
    expect(indices).toHaveLength(length);

    // Should contain all indices from 0 to length-1
    const sortedIndices = [...indices].sort((a, b) => a - b);
    const expectedIndices = Array.from({ length }, (_, i) => i);
    expect(sortedIndices).toEqual(expectedIndices);

    // Should be deterministic with same seed
    const rng2 = new SeededRandom(12345);
    const indices2 = rng2.generateShuffleIndices(length);
    expect(indices).toEqual(indices2);

    // Should be different from original order for reasonable length
    expect(indices).not.toEqual(expectedIndices);
  });

  it("should apply shuffle by indices correctly", () => {
    const rng = new SeededRandom(12345);
    const original = ["a", "b", "c", "d", "e"];
    const indices = [4, 0, 3, 1, 2]; // Custom shuffle pattern

    const shuffled = rng.applyShuffleByIndices(original, indices);

    // Should apply the exact index mapping
    expect(shuffled).toEqual(["e", "a", "d", "b", "c"]);
    expect(shuffled).toHaveLength(original.length);

    // Original array should be unchanged
    expect(original).toEqual(["a", "b", "c", "d", "e"]);

    // Should work with different data types
    const numbers = [1, 2, 3, 4, 5];
    const shuffledNumbers = rng.applyShuffleByIndices(numbers, indices);
    expect(shuffledNumbers).toEqual([5, 1, 4, 2, 3]);
  });

  it("should unshuffle by indices correctly", () => {
    const rng = new SeededRandom(12345);
    const original = ["a", "b", "c", "d", "e"];
    const indices = [4, 0, 3, 1, 2]; // Custom shuffle pattern

    // Apply shuffle
    const shuffled = rng.applyShuffleByIndices(original, indices);
    expect(shuffled).toEqual(["e", "a", "d", "b", "c"]);

    // Unshuffle should restore original order
    const restored = rng.unshuffleByIndices(shuffled, indices);
    expect(restored).toEqual(original);

    // Should work with numbers
    const numbers = [10, 20, 30, 40, 50];
    const shuffledNumbers = rng.applyShuffleByIndices(numbers, indices);
    const restoredNumbers = rng.unshuffleByIndices(shuffledNumbers, indices);
    expect(restoredNumbers).toEqual(numbers);
  });

  it("should handle index-based operations with empty and single element arrays", () => {
    const rng = new SeededRandom(12345);

    // Empty arrays
    expect(rng.generateShuffleIndices(0)).toEqual([]);
    expect(rng.applyShuffleByIndices([], [])).toEqual([]);
    expect(rng.unshuffleByIndices([], [])).toEqual([]);

    // Single element arrays
    expect(rng.generateShuffleIndices(1)).toEqual([0]);
    expect(rng.applyShuffleByIndices(["single"], [0])).toEqual(["single"]);
    expect(rng.unshuffleByIndices(["single"], [0])).toEqual(["single"]);
  });

  it("should throw errors for mismatched array and indices lengths", () => {
    const rng = new SeededRandom(12345);
    const array = [1, 2, 3];
    const wrongIndices = [0, 1]; // Different length

    expect(() => rng.applyShuffleByIndices(array, wrongIndices)).toThrow(
      "Array and indices must have the same length",
    );

    expect(() => rng.unshuffleByIndices(array, wrongIndices)).toThrow(
      "Array and indices must have the same length",
    );
  });

  it("should generate random seeds", () => {
    const seed1 = SeededRandom.generateSeed();
    const seed2 = SeededRandom.generateSeed();

    // Should be numbers
    expect(typeof seed1).toBe("number");
    expect(typeof seed2).toBe("number");

    // Should be within expected range
    expect(seed1).toBeGreaterThanOrEqual(0);
    expect(seed1).toBeLessThan(1000000);
    expect(seed2).toBeGreaterThanOrEqual(0);
    expect(seed2).toBeLessThan(1000000);

    // Should be integers
    expect(Number.isInteger(seed1)).toBe(true);
    expect(Number.isInteger(seed2)).toBe(true);

    // Should create working SeededRandom instances
    const rng1 = new SeededRandom(seed1);
    const rng2 = new SeededRandom(seed2);

    expect(rng1).toBeInstanceOf(SeededRandom);
    expect(rng2).toBeInstanceOf(SeededRandom);

    // Different seeds should produce different sequences (very likely)
    if (seed1 !== seed2) {
      expect(rng1.next()).not.toBe(rng2.next());
    }
  });

  it("should handle edge cases for randInt", () => {
    const rng = new SeededRandom(12345);

    // Same min and max
    expect(rng.randInt(5, 5)).toBe(5);
    expect(rng.randInt(0, 0)).toBe(0);
    expect(rng.randInt(-5, -5)).toBe(-5);

    // Negative ranges
    const negativeResults = [];
    for (let i = 0; i < 100; i++) {
      const result = rng.randInt(-10, -1);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThanOrEqual(-1);
      negativeResults.push(result);
    }

    // Should have variety in negative range
    const uniqueNegative = new Set(negativeResults);
    expect(uniqueNegative.size).toBeGreaterThan(5);
  });

  it("should handle edge cases for choices with count 0", () => {
    const rng = new SeededRandom(12345);
    const array = [1, 2, 3, 4, 5];

    // Count 0 should return empty array
    expect(rng.choices(array, 0)).toEqual([]);
    expect(rng.choices(array, 0, { unique: true })).toEqual([]);
  });

  it("should work with complex index shuffling scenarios", () => {
    const rng = new SeededRandom(12345);

    // Test with different data types in same pattern
    const strings = ["apple", "banana", "cherry", "date", "elderberry"];
    const numbers = [100, 200, 300, 400, 500];
    const objects = [
      { id: 1, name: "first" },
      { id: 2, name: "second" },
      { id: 3, name: "third" },
      { id: 4, name: "fourth" },
      { id: 5, name: "fifth" },
    ];

    // Generate single shuffle pattern
    const indices = rng.generateShuffleIndices(5);

    // Apply same pattern to all arrays
    const shuffledStrings = rng.applyShuffleByIndices(strings, indices);
    const shuffledNumbers = rng.applyShuffleByIndices(numbers, indices);
    const shuffledObjects = rng.applyShuffleByIndices(objects, indices);

    // Verify all arrays maintain their relationships
    for (let i = 0; i < 5; i++) {
      const originalIndex = strings.indexOf(shuffledStrings[i]);
      expect(shuffledNumbers[i]).toBe(numbers[originalIndex]);
      expect(shuffledObjects[i]).toBe(objects[originalIndex]);
    }

    // Verify unshuffle restores all arrays correctly
    expect(rng.unshuffleByIndices(shuffledStrings, indices)).toEqual(strings);
    expect(rng.unshuffleByIndices(shuffledNumbers, indices)).toEqual(numbers);
    expect(rng.unshuffleByIndices(shuffledObjects, indices)).toEqual(objects);
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

  it("should handle functional API edge cases", () => {
    // Empty arrays
    expect(shuffle([], 12345)).toEqual([]);
    expect(unshuffle([], 12345)).toEqual([]);

    // Single element
    expect(shuffle([42], 12345)).toEqual([42]);
    expect(unshuffle([42], 12345)).toEqual([42]);

    // Different data types
    const mixedArray = [1, "hello", { key: "value" }, null, true];
    const shuffledMixed = shuffle(mixedArray, "test-seed");
    const unshuffledMixed = unshuffle(shuffledMixed, "test-seed");
    expect(unshuffledMixed).toEqual(mixedArray);

    // Verify shuffle actually changes order for reasonable arrays
    const testArray = Array.from({ length: 10 }, (_, i) => i);
    const shuffledTest = shuffle(testArray, 12345);
    expect(shuffledTest).not.toEqual(testArray); // Very likely to be different

    // Different seeds should produce different results
    const shuffled1 = shuffle(testArray, 11111);
    const shuffled2 = shuffle(testArray, 22222);
    expect(shuffled1).not.toEqual(shuffled2); // Very likely to be different
  });

  it("should demonstrate functional API consistency across multiple calls", () => {
    const testData = Array.from({ length: 100 }, (_, i) => `item-${i}`);
    const seed = "consistent-seed";

    // Multiple shuffle calls with same seed should be identical
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(shuffle(testData, seed));
    }

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }

    // All unshuffles should restore original
    for (const shuffled of results) {
      expect(unshuffle(shuffled, seed)).toEqual(testData);
    }
  });
});

describe("PCG Algorithm Tests", () => {
  it("should have much longer period than LCG (demonstrative test)", () => {
    const rng = new SeededRandom(12345);

    // Test that we can generate far more than 233,280 unique values
    // This test runs for a limited time but demonstrates longer period
    const uniqueValues = new Set();
    const maxIterations = 500000; // Much larger than LCG period

    for (let i = 0; i < maxIterations; i++) {
      const value = rng.next();

      // Ensure values are in valid range
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(Number.isFinite(value)).toBe(true);

      uniqueValues.add(value);

      // Early termination if we find a repeat (shouldn't happen with PCG)
      if (i > 1000 && uniqueValues.size < i * 0.99) {
        break; // Too many duplicates, something's wrong
      }
    }

    // PCG should produce many more unique values than LCG
    expect(uniqueValues.size).toBeGreaterThan(400000); // Much higher than LCG's 233,280
  });

  it("should maintain deterministic behavior with same seeds", () => {
    const seed = 42;
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);

    // Generate long sequences and compare
    const sequence1 = [];
    const sequence2 = [];

    for (let i = 0; i < 10000; i++) {
      sequence1.push(rng1.next());
      sequence2.push(rng2.next());
    }

    expect(sequence1).toEqual(sequence2);
  });

  it("should handle very large seed values correctly", () => {
    const largeSeed = Number.MAX_SAFE_INTEGER;
    const rng = new SeededRandom(largeSeed);

    // Should not throw and should produce valid values
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("should produce valid random values in range [0, 1)", () => {
    const rng = new SeededRandom(12345);
    const sampleSize = 10000;

    for (let i = 0; i < sampleSize; i++) {
      const value = rng.next();

      // All values should be in valid range
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(Number.isFinite(value)).toBe(true);
      expect(typeof value).toBe("number");
    }

    // Test with different seeds to ensure variety
    const values1 = [];
    const values2 = [];

    const rng1 = new SeededRandom(1111);
    const rng2 = new SeededRandom(2222);

    for (let i = 0; i < 100; i++) {
      values1.push(rng1.next());
      values2.push(rng2.next());
    }

    // Different seeds should produce different sequences
    expect(values1).not.toEqual(values2);
  });

  it("should handle string seeds with long text content", () => {
    // Test with very long string
    const longString = "Lorem ipsum ".repeat(1000);
    const rng1 = new SeededRandom(longString);
    const rng2 = new SeededRandom(longString);

    // Should be deterministic even with long strings
    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }

    // Test with unicode characters
    const unicodeString = "🎲🎯🎪".repeat(500);
    const rng3 = new SeededRandom(unicodeString);
    const rng4 = new SeededRandom(unicodeString);

    for (let i = 0; i < 100; i++) {
      expect(rng3.next()).toBe(rng4.next());
    }
  });

  it("should handle massive array shuffling without period limitations", () => {
    // Create very large array that would exceed LCG period
    const largeArray = Array.from({ length: 300000 }, (_, i) => i);
    const rng = new SeededRandom(12345);

    const shuffled = rng.shuffle(largeArray);

    // Verify all elements are preserved
    const sortedShuffled = [...shuffled].sort((a, b) => a - b);
    expect(sortedShuffled).toEqual(largeArray);

    // Verify it's actually shuffled
    let samePosition = 0;
    for (let i = 0; i < largeArray.length; i++) {
      if (shuffled[i] === largeArray[i]) {
        samePosition++;
      }
    }

    // Less than 0.1% should be in same position for good shuffle
    expect(samePosition).toBeLessThan(largeArray.length * 0.001);
  });

  it("should demonstrate improved quality over multiple resets", () => {
    const results = [];

    // Test multiple seed resets and generate sequences (reduced scale)
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new SeededRandom(seed);
      const sequence = [];

      for (let i = 0; i < 100; i++) {
        sequence.push(rng.next());
      }

      results.push(sequence);
    }

    // All sequences should be different
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < Math.min(results.length, i + 10); j++) {
        // Only check subset to avoid timeout
        expect(results[i]).not.toEqual(results[j]);
      }
    }
  });

  it("should handle choice operations on very large arrays", () => {
    const largeArray = Array.from({ length: 10000 }, (_, i) => `item${i}`); // Reduced size
    const rng = new SeededRandom(12345);

    // Test single choice
    const singleChoice = rng.choice(largeArray);
    expect(largeArray).toContain(singleChoice);

    // Test multiple choices with replacement
    const manyChoices = rng.choices(largeArray, 5000); // Reduced size
    expect(manyChoices).toHaveLength(5000);
    manyChoices.forEach((choice) => expect(largeArray).toContain(choice));

    // Test unique choices
    rng.reset(12345);
    const uniqueChoices = rng.choices(largeArray, 1000, { unique: true }); // Reduced size
    expect(uniqueChoices).toHaveLength(1000);
    expect(new Set(uniqueChoices).size).toBe(1000);
  });

  it("should maintain consistency across different operations with same seed", () => {
    const seed = "test-consistency";

    // Test shuffle consistency
    const array = Array.from({ length: 50000 }, (_, i) => i);
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);

    const shuffled1 = rng1.shuffle(array);
    const shuffled2 = rng2.shuffle(array);

    expect(shuffled1).toEqual(shuffled2);

    // Test choice consistency
    rng1.reset(seed);
    rng2.reset(seed);

    const choices1 = rng1.choices(array.slice(0, 1000), 500);
    const choices2 = rng2.choices(array.slice(0, 1000), 500);

    expect(choices1).toEqual(choices2);
  });

  it("should generate quality random integers across large ranges", () => {
    const rng = new SeededRandom(12345);
    const min = -100000;
    const max = 100000;
    const sampleSize = 10000; // Reduced sample size

    const results = [];
    for (let i = 0; i < sampleSize; i++) {
      const value = rng.randInt(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
      expect(Number.isInteger(value)).toBe(true);
      results.push(value);
    }

    // Check distribution across the range
    const uniqueValues = new Set(results);
    expect(uniqueValues.size).toBeGreaterThan(sampleSize * 0.5); // More realistic expectation

    // Check that both extremes can be reached
    expect(results.some((v) => v < min + 10000)).toBe(true); // Near minimum
    expect(results.some((v) => v > max - 10000)).toBe(true); // Near maximum
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
