// Page backdrop: a dot lattice that reacts to the pointer and to scrolling.
//
// The resting dots are a CSS background on .backdrop-grid, so they cost nothing to draw.
// This module only moves that layer (parallax) and paints the moving parts on a canvas:
//   - the lattice cell under the pointer is "addressed": its row and column light up
//     and the dots around it glow;
//   - bands of brighter dots sweep through while the page is scrolling;
//   - now and then a short signal runs from dot to dot along the lattice.
// The animation loop stops whenever nothing is moving.
import { reducedMotion } from "./dom.js";

const PARALLAX = 0.14; // lattice speed relative to the page
const GLOW_RADIUS = 190; // px around the pointer
const LINE_REACH = 280; // px, half length of the row and column lines
const SIGNAL_SPEED = 13; // lattice cells per second
const SIGNAL_TRAIL = 5; // cells that stay lit behind the head
const SIGNAL_GAP = [700, 2000]; // ms between signals

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

export function initBackdrop() {
  const root = document.querySelector(".backdrop");
  const grid = root?.querySelector(".backdrop-grid");
  const canvas = root?.querySelector("canvas");
  const ctx = canvas?.getContext("2d");
  if (!ctx || reducedMotion()) return; // the still lattice remains

  let pitch = 28;
  let width = 0;
  let height = 0;
  let colors = { accent: "#c2a56b", wave: "#a3a199" };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, glow: 0 };
  let lastScroll = window.scrollY;
  let energy = 0; // 0..1, how hard the page is being scrolled
  let signals = [];
  let running = false;
  let lastTime = 0;
  let spawnTimer = 0;

  // Lattice coordinates: column c and row r map to the screen through the parallax shift.
  const shift = () => window.scrollY * PARALLAX;
  const X = (c) => c * pitch + pitch / 2;
  const Y = (r, p) => r * pitch - pitch / 2 - p;

  function readStyle() {
    const style = getComputedStyle(root);
    pitch = parseFloat(style.getPropertyValue("--pitch")) || 28;
    colors = {
      accent: style.getPropertyValue("--accent").trim() || colors.accent,
      wave: style.getPropertyValue("--muted").trim() || colors.wave,
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = root.clientWidth;
    height = root.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readStyle();
    wake();
  }

  function newSignal(p) {
    const cols = Math.ceil(width / pitch);
    const rows = Math.ceil(height / pitch);
    const firstRow = Math.floor(p / pitch) + 1;
    let c = randInt(1, Math.max(1, cols - 2));
    let r = firstRow + randInt(1, Math.max(1, rows - 2));
    const horizontal = Math.random() < 0.5;
    const legs = [
      [horizontal ? (Math.random() < 0.5 ? 1 : -1) : 0, horizontal ? 0 : Math.random() < 0.5 ? 1 : -1, randInt(3, 9)],
    ];
    if (Math.random() < 0.6) {
      legs.push([horizontal ? 0 : Math.random() < 0.5 ? 1 : -1, horizontal ? (Math.random() < 0.5 ? 1 : -1) : 0, randInt(2, 7)]);
    }
    const nodes = [[c, r]];
    for (const [dc, dr, steps] of legs) {
      for (let i = 0; i < steps; i++) {
        c += dc;
        r += dr;
        nodes.push([c, r]);
      }
    }
    return { nodes, head: 0 };
  }

  function scheduleSignal() {
    clearTimeout(spawnTimer);
    if (document.hidden) return;
    spawnTimer = setTimeout(() => {
      const limit = width < 700 ? 2 : 4;
      if (signals.length < limit) signals.push(newSignal(shift()));
      wake();
      scheduleSignal();
    }, rand(...SIGNAL_GAP));
  }

  function drawWave(p) {
    const cols = Math.ceil(width / pitch);
    const firstRow = Math.floor(p / pitch);
    const rows = Math.ceil(height / pitch) + 2;
    const scroll = window.scrollY;
    ctx.fillStyle = colors.wave;
    for (let j = 0; j < rows; j++) {
      const y = Y(firstRow + j, p);
      for (let i = 0; i < cols; i++) {
        const x = X(i);
        const s = Math.sin((y + scroll * 0.5) * 0.014 + x * 0.005);
        if (s <= 0) continue;
        const alpha = energy * s * s * 0.6;
        if (alpha < 0.02) continue;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }

  function drawPointer(p) {
    const { x: px, y: py, glow } = pointer;

    // A faint pool of light under the pointer.
    const pool = ctx.createRadialGradient(px, py, 0, px, py, GLOW_RADIUS * 1.3);
    pool.addColorStop(0, colors.accent);
    pool.addColorStop(1, "transparent");
    ctx.globalAlpha = glow * 0.07;
    ctx.fillStyle = pool;
    ctx.fillRect(px - GLOW_RADIUS * 1.3, py - GLOW_RADIUS * 1.3, GLOW_RADIUS * 2.6, GLOW_RADIUS * 2.6);

    // Dots near the pointer glow and grow.
    ctx.fillStyle = colors.accent;
    const c0 = Math.floor((px - GLOW_RADIUS) / pitch);
    const c1 = Math.ceil((px + GLOW_RADIUS) / pitch);
    const r0 = Math.floor((py - GLOW_RADIUS + p) / pitch);
    const r1 = Math.ceil((py + GLOW_RADIUS + p) / pitch) + 1;
    for (let r = r0; r <= r1; r++) {
      const y = Y(r, p);
      for (let c = c0; c <= c1; c++) {
        const x = X(c);
        const d = Math.hypot(x - px, y - py);
        if (d >= GLOW_RADIUS) continue;
        const t = (1 - d / GLOW_RADIUS) ** 1.5;
        const size = 2 + 2.4 * t;
        ctx.globalAlpha = glow * Math.min(1, t * 1.15);
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }

    // The cell under the pointer is addressed like a memory cell: one row line, one column line.
    const cx = X(Math.round((px - pitch / 2) / pitch));
    const cy = Y(Math.round((py + p + pitch / 2) / pitch), p);
    ctx.globalAlpha = glow * 0.5;
    const horizontal = ctx.createLinearGradient(cx - LINE_REACH, 0, cx + LINE_REACH, 0);
    const vertical = ctx.createLinearGradient(0, cy - LINE_REACH, 0, cy + LINE_REACH);
    for (const gradient of [horizontal, vertical]) {
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.5, colors.accent);
      gradient.addColorStop(1, "transparent");
    }
    ctx.fillStyle = horizontal;
    ctx.fillRect(cx - LINE_REACH, cy - 0.5, LINE_REACH * 2, 1);
    ctx.fillStyle = vertical;
    ctx.fillRect(cx - 0.5, cy - LINE_REACH, 1, LINE_REACH * 2);

    ctx.globalAlpha = glow * 0.9;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 5.5, cy - 5.5, 11, 11);
  }

  function drawSignals(p, dt) {
    ctx.fillStyle = colors.accent;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    for (const signal of signals) {
      signal.head += SIGNAL_SPEED * dt;
      const last = Math.min(signal.nodes.length - 1, Math.floor(signal.head));
      for (let k = Math.max(0, Math.floor(signal.head - SIGNAL_TRAIL)); k <= last; k++) {
        const level = 1 - (signal.head - k) / SIGNAL_TRAIL;
        if (level <= 0) continue;
        const [c, r] = signal.nodes[k];
        const x = X(c);
        const y = Y(r, p);
        if (k > 0) {
          const [pc, pr] = signal.nodes[k - 1];
          ctx.globalAlpha = level * 0.3;
          ctx.beginPath();
          ctx.moveTo(X(pc), Y(pr, p));
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        const size = 2 + level;
        ctx.globalAlpha = level * 0.85;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
    signals = signals.filter((signal) => signal.head < signal.nodes.length - 1 + SIGNAL_TRAIL);
  }

  function frame(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000 || 0.016);
    lastTime = time;

    // Scrolling: shift the lattice and build up or release the wave energy.
    const scroll = window.scrollY;
    const speed = Math.min(1, Math.abs(scroll - lastScroll) / 14);
    lastScroll = scroll;
    energy += (speed - energy) * (speed > energy ? 0.25 : 0.06);
    const p = shift();
    grid.style.transform = `translate3d(0, ${-(p % pitch).toFixed(2)}px, 0)`;

    // Pointer: ease towards the real position and fade the glow in or out.
    pointer.x += (pointer.tx - pointer.x) * 0.22;
    pointer.y += (pointer.ty - pointer.y) * 0.22;
    pointer.glow += ((pointer.active ? 1 : 0) - pointer.glow) * 0.12;

    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    if (energy > 0.01) drawWave(p);
    if (pointer.glow > 0.01) drawPointer(p);
    if (signals.length) drawSignals(p, dt);

    const pointerMoving =
      Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.4 ||
      Math.abs((pointer.active ? 1 : 0) - pointer.glow) > 0.01;
    if (energy > 0.01 || pointerMoving || signals.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function wake() {
    if (running || document.hidden) return;
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(frame);
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      if (!pointer.active && pointer.glow < 0.02) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.active = true;
      wake();
    },
    { passive: true }
  );
  const release = () => {
    pointer.active = false;
    wake();
  };
  document.documentElement.addEventListener("pointerleave", release);
  window.addEventListener("blur", release);
  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(spawnTimer);
    else {
      scheduleSignal();
      wake();
    }
  });
  // Colours follow the theme toggle.
  new MutationObserver(() => {
    readStyle();
    wake();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
  scheduleSignal();
}
