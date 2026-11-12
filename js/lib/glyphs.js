// Computer-architecture block diagrams for the page backdrop.
//
// Each glyph is drawn in lattice units (1 = one dot pitch) from a few primitives:
//   ["r", x, y, w, h]        rectangle
//   ["l", x1, y1, x2, y2…]   open polyline
//   ["p", x1, y1, x2, y2…]   closed polygon
//   ["c", x, y, radius]      circle
//   ["t", x, y, "text"]      centred label
// `base` is always drawn. `steps` are the parts that light up one after another as the
// glyph is clocked: pipeline stages, cache levels, memory cells and so on.
// With `quiet`, a step is only drawn while it is the active one.

const range = (n) => Array.from({ length: n }, (_, i) => i);

const STAGES = ["IF", "ID", "EX", "MEM", "WB"];
const pipeline = {
  w: 9.5,
  h: 1,
  base: range(4).map((i) => ["l", i * 2 + 1.5, 0.5, i * 2 + 2, 0.5]),
  steps: STAGES.map((name, i) => [
    ["r", i * 2, 0, 1.5, 1],
    ["t", i * 2 + 0.75, 0.5, name],
  ]),
};

const LEVELS = [
  ["L1", 2, 2],
  ["L2", 1.25, 3.5],
  ["L3", 0.5, 5],
  ["DRAM", 0, 6],
];
const cache = {
  w: 6,
  h: 3.75,
  base: range(3).map((i) => ["l", 3, i + 0.75, 3, i + 1]),
  steps: LEVELS.map(([name, x, w], i) => [
    ["r", x, i, w, 0.75],
    ["t", 3, i + 0.375, name],
  ]),
};

const sram = {
  w: 5,
  h: 3.75,
  quiet: true,
  base: [
    ["r", 1, 0, 4, 3],
    ...range(3).map((i) => ["l", i + 2, 0, i + 2, 3]),
    ...range(2).map((j) => ["l", 1, j + 1, 5, j + 1]),
    ["r", 0, 0, 0.5, 3],
    ...range(3).map((j) => ["l", 0.5, j + 0.5, 1, j + 0.5]),
    ["t", 3, 3.5, "SRAM"],
  ],
  // The address scans the array row by row.
  steps: range(12).map((k) => [["r", 1.25 + (k % 4), 0.25 + Math.floor(k / 4), 0.5, 0.5]]),
};

const mac = {
  w: 7,
  h: 2.25,
  base: [
    ["l", 0, 0.5, 0.75, 0.5, 1.1, 0.7],
    ["l", 0, 1.5, 0.75, 1.5, 1.1, 1.3],
    ["l", 2, 1, 3, 1],
    ["l", 4, 1, 5, 1],
    ["l", 6.25, 1, 7, 1, 7, 2.25, 3.5, 2.25, 3.5, 1.5],
  ],
  steps: [
    [
      ["c", 1.5, 1, 0.5],
      ["l", 1.3, 0.8, 1.7, 1.2],
      ["l", 1.7, 0.8, 1.3, 1.2],
    ],
    [
      ["c", 3.5, 1, 0.5],
      ["l", 3.25, 1, 3.75, 1],
      ["l", 3.5, 0.75, 3.5, 1.25],
    ],
    [
      ["r", 5, 0.5, 1.25, 1],
      ["t", 5.625, 1, "ACC"],
    ],
  ],
};

const alu = {
  w: 4.5,
  h: 4,
  base: [],
  steps: [
    [
      ["l", 0, 0.75, 1, 0.75],
      ["l", 0, 3.25, 1, 3.25],
    ],
    [
      ["p", 1, 0, 3.25, 1, 3.25, 3, 1, 4, 1, 2.5, 1.75, 2, 1, 1.5],
      ["t", 2.5, 2, "ALU"],
    ],
    [["l", 3.25, 2, 4.5, 2]],
  ],
};

const chip = {
  w: 4,
  h: 4,
  base: [
    ["r", 0.5, 0.5, 3, 3],
    ["r", 1.25, 1.25, 1.5, 1.5],
    ["t", 2, 2, "ASIC"],
  ],
  // Pins light up side by side, clockwise.
  steps: [
    range(3).map((i) => ["l", i + 1, 0, i + 1, 0.5]),
    range(3).map((i) => ["l", 3.5, i + 1, 4, i + 1]),
    range(3).map((i) => ["l", i + 1, 3.5, i + 1, 4]),
    range(3).map((i) => ["l", 0, i + 1, 0.5, i + 1]),
  ],
};

// A 3×3 systolic array: the wavefront moves along the anti-diagonals.
const systolic = {
  w: 5,
  h: 5,
  base: [
    ...range(6).map((k) => ["l", (k % 2) * 2 + 1, Math.floor(k / 2) * 2 + 0.5, (k % 2) * 2 + 2, Math.floor(k / 2) * 2 + 0.5]),
    ...range(6).map((k) => ["l", Math.floor(k / 2) * 2 + 0.5, (k % 2) * 2 + 1, Math.floor(k / 2) * 2 + 0.5, (k % 2) * 2 + 2]),
  ],
  steps: range(5).map((d) =>
    range(9)
      .filter((k) => (k % 3) + Math.floor(k / 3) === d)
      .map((k) => ["r", (k % 3) * 2, Math.floor(k / 3) * 2, 1, 1])
  ),
};

const mux = {
  w: 3,
  h: 3.5,
  base: [
    ["p", 1, 0, 2, 0.5, 2, 2.5, 1, 3],
    ["l", 2, 1.5, 3, 1.5],
    ["l", 1.5, 3.5, 1.5, 2.75],
  ],
  steps: [[["l", 0, 0.75, 1, 0.75]], [["l", 0, 2.25, 1, 2.25]]],
};

export const GLYPHS = [pipeline, cache, sram, mac, alu, chip, systolic, mux].map((glyph) => ({
  ...glyph,
  rest: glyph.quiet ? glyph.base : [...glyph.base, ...glyph.steps.flat()],
}));

/** Strokes a list of primitives with the context's current colours. */
export function trace(ctx, prims, ox, oy, u) {
  for (const prim of prims) {
    const kind = prim[0];
    if (kind === "t") {
      ctx.fillText(prim[3], ox + prim[1] * u, oy + prim[2] * u);
      continue;
    }
    ctx.beginPath();
    if (kind === "r") {
      ctx.rect(ox + prim[1] * u, oy + prim[2] * u, prim[3] * u, prim[4] * u);
    } else if (kind === "c") {
      ctx.arc(ox + prim[1] * u, oy + prim[2] * u, prim[3] * u, 0, Math.PI * 2);
    } else {
      ctx.moveTo(ox + prim[1] * u, oy + prim[2] * u);
      for (let i = 3; i < prim.length; i += 2) ctx.lineTo(ox + prim[i] * u, oy + prim[i + 1] * u);
      if (kind === "p") ctx.closePath();
    }
    ctx.stroke();
  }
}
