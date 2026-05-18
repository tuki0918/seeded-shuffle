import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const isCi = process.argv.includes("--ci");

const REVISIONS = [
  {
    label: process.env.BENCH_BASE_LABEL ?? "1.0.1",
    ref: process.env.BENCH_BASE_REF ?? "v1.0.1",
  },
  {
    label: process.env.BENCH_CANDIDATE_LABEL ?? "candidate",
    ref: process.env.BENCH_CANDIDATE_REF ?? "WORKTREE",
  },
];

const SAMPLE_COUNT = Number.parseInt(
  process.env.BENCH_SAMPLES ?? (isCi ? "5" : "15"),
  10,
);
const WARMUP_COUNT = Number.parseInt(
  process.env.BENCH_WARMUPS ?? (isCi ? "2" : "5"),
  10,
);

const tmp = mkdtempSync(join(tmpdir(), "seeded-shuffle-bench-"));
const modules = await Promise.all(
  REVISIONS.map(async (revision) => ({
    ...revision,
    mod: await loadRevision(revision),
  })),
);

let sink = 0;

const smallArray = Array.from({ length: 1_000 }, (_, i) => i);
const mediumArray = Array.from({ length: 10_000 }, (_, i) => i);
const largeArray = Array.from({ length: 100_000 }, (_, i) => i);

const benchmarks = [
  {
    name: "next() x 100,000",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      let total = 0;
      for (let i = 0; i < 100_000; i++) {
        total += rng.next();
      }
      return total;
    },
  },
  {
    name: "randInt(1, 1e9) x 100,000",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      let total = 0;
      for (let i = 0; i < 100_000; i++) {
        total += rng.randInt(1, 1_000_000_000);
      }
      return total;
    },
  },
  {
    name: "choice(array 100,000) x 100,000",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      let total = 0;
      for (let i = 0; i < 100_000; i++) {
        total += rng.choice(largeArray);
      }
      return total;
    },
  },
  {
    name: "shuffle(array 10,000)",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      const result = rng.shuffle(mediumArray);
      return result[0] + result[result.length - 1];
    },
  },
  {
    name: "unshuffle(array 10,000)",
    prepare: ({ shuffle }) => shuffle(mediumArray, 12345),
    run: ({ unshuffle }, shuffled) => {
      const result = unshuffle(shuffled, 12345);
      return result[0] + result[result.length - 1];
    },
  },
  {
    name: "unshuffle(array 100,000)",
    samples: Math.min(SAMPLE_COUNT, 5),
    warmups: Math.min(WARMUP_COUNT, 2),
    prepare: ({ shuffle }) => shuffle(largeArray, 12345),
    run: ({ unshuffle }, shuffled) => {
      const result = unshuffle(shuffled, 12345);
      return result[0] + result[result.length - 1];
    },
  },
  {
    name: "generateShuffleIndices(10,000)",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      const result = rng.generateShuffleIndices(10_000);
      return result[0] + result[result.length - 1];
    },
  },
  {
    name: "choices non-unique(array 100,000, count 50,000)",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      const result = rng.choices(largeArray, 50_000);
      return result[0] + result[result.length - 1];
    },
  },
  {
    name: "choices unique(array 1,000, count 500)",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      const result = rng.choices(smallArray, 500, { unique: true });
      return result[0] + result[result.length - 1];
    },
  },
  {
    name: "choices unique(array 100,000, count 5,000)",
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      const result = rng.choices(largeArray, 5_000, { unique: true });
      return result[0] + result[result.length - 1];
    },
  },
  {
    name: "choices unique(array 100,000, count 50,000)",
    samples: Math.min(SAMPLE_COUNT, 5),
    warmups: Math.min(WARMUP_COUNT, 2),
    run: ({ SeededRandom }) => {
      const rng = new SeededRandom(12345);
      const result = rng.choices(largeArray, 50_000, { unique: true });
      return result[0] + result[result.length - 1];
    },
  },
];

console.log(`Node: ${process.version}`);
console.log(`Samples: ${SAMPLE_COUNT}, warmups: ${WARMUP_COUNT}`);
console.log(
  `Comparing ${REVISIONS.map((revision) => revision.ref).join(" vs ")}\n`,
);

for (const benchmark of benchmarks) {
  const result = new Map();
  for (const revision of modules) {
    const warmups = benchmark.warmups ?? WARMUP_COUNT;
    const samples = benchmark.samples ?? SAMPLE_COUNT;
    const context = benchmark.prepare?.(revision.mod);
    result.set(
      revision.label,
      measure(
        (mod) => benchmark.run(mod, context),
        revision.mod,
        warmups,
        samples,
      ),
    );
  }

  const baseline = result.get(REVISIONS[0].label);
  const candidate = result.get(REVISIONS[1].label);
  const ratio = baseline.median / candidate.median;
  const change = ((baseline.median - candidate.median) / baseline.median) * 100;

  console.log(benchmark.name);
  for (const revision of REVISIONS) {
    const stats = result.get(revision.label);
    console.log(
      `  ${revision.label.padEnd(15)} median ${formatMs(stats.median)}  mean ${formatMs(
        stats.mean,
      )}  min ${formatMs(stats.min)}  max ${formatMs(stats.max)}  sd ${formatMs(
        stats.stdev,
      )}`,
    );
  }
  console.log(
    `  change          ${change >= 0 ? "faster" : "slower"} ${Math.abs(
      change,
    ).toFixed(1)}%  (${ratio.toFixed(2)}x)\n`,
  );
}

console.log(`checksum: ${sink.toFixed(3)}`);

async function loadRevision({ label, ref }) {
  const source =
    ref === "WORKTREE"
      ? readFileSync("src/index.ts", "utf8")
      : execFileSync("git", ["show", `${ref}:src/index.ts`], {
          encoding: "utf8",
        });
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      strict: true,
    },
  }).outputText;
  const file = join(tmp, `${label}.mjs`);
  writeFileSync(file, output);
  return import(pathToFileURL(file).href);
}

function measure(run, mod, warmups, samples) {
  for (let i = 0; i < warmups; i++) {
    sink += Number(run(mod)) || 0;
  }

  const times = [];
  for (let i = 0; i < samples; i++) {
    globalThis.gc?.();
    const start = performance.now();
    sink += Number(run(mod)) || 0;
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
  const variance =
    times.reduce((sum, time) => sum + (time - mean) ** 2, 0) / times.length;

  return {
    median: percentile(times, 0.5),
    mean,
    min: times[0],
    max: times[times.length - 1],
    stdev: Math.sqrt(variance),
  };
}

function percentile(sorted, percentileValue) {
  const index = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function formatMs(value) {
  return `${value.toFixed(3)}ms`;
}
