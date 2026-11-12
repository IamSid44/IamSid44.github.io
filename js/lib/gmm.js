// A small Gaussian-mixture model shared by the hero strip and the sandbox.
// Each "column" holds one Gaussian. Its current at a probe point x is the
// (unnormalised) likelihood of x under that Gaussian. Units are arbitrary.

// Deterministic PRNG so the layout is the same on every visit.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// n columns with means spread across [min, max] and jittered, so neighbours overlap unevenly.
export function makeColumns(n, { seed = 1, min = -1, max = 1, sigma = [0.5, 1], weight = [0.5, 1], jitter = 0.35 } = {}) {
  const rand = mulberry32(seed);
  const step = (max - min) / (n - 1);
  const columns = [];
  for (let i = 0; i < n; i++) {
    columns.push({
      mu: min + i * step + (rand() - 0.5) * 2 * jitter * step,
      sigma: sigma[0] + rand() * (sigma[1] - sigma[0]),
      w: weight[0] + rand() * (weight[1] - weight[0]),
    });
  }
  return columns;
}

export function current(column, x) {
  const d = x - column.mu;
  return column.w * Math.exp(-(d * d) / (2 * column.sigma * column.sigma));
}

export function mixture(columns, x) {
  let sum = 0;
  for (let i = 0; i < columns.length; i++) sum += current(columns[i], x);
  return sum;
}

// Round a value in [0, 1] to 2^bits levels. bits = 0 means no quantisation.
export function quantize(value, bits) {
  if (!bits) return value;
  const levels = 2 ** bits - 1;
  return Math.round(value * levels) / levels;
}
