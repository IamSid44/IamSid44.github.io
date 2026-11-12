// "Column current" sandbox. A toy model of the idea behind ProbSplat:
// each column stores one Gaussian, and its current is the likelihood of the probe
// point under that Gaussian. The sum over columns is the mixture likelihood.
// Everything here is ideal maths in arbitrary units, not circuit simulation.
import { html, mount, raw } from "../lib/dom.js";
import { makeColumns, current, mixture, quantize } from "../lib/gmm.js";

const N = 24;
const X_MIN = -15;
const X_MAX = 15;
const Y_MAX = 2.6; // fixed vertical scale of the density plot, so curves do not rescale while dragging
const SAMPLES = 180;
const TOP_H = 190;
const BARS_H = 132;
const PAD = { left: 10, right: 10, top: 14, bottom: 24 };
const SVG_NS = "http://www.w3.org/2000/svg";

const freshColumns = () => makeColumns(N, { seed: 7, min: -13, max: 13, sigma: [0.5, 1.35], weight: [0.45, 1], jitter: 0.4 });

function svgEl(tag, attrs, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  if (parent) parent.appendChild(node);
  return node;
}

export function renderSandbox(el) {
  mount(
    el,
    html`
      <div class="sandbox" data-reveal>
        <div class="sb-plots">
          <figure class="sb-figure">
            <figcaption class="label">Scene density along x: the sum of all ${N} columns</figcaption>
            <div class="sb-plot sb-plot-top" data-plot="top" title="Drag to move the probe"></div>
          </figure>
          <figure class="sb-figure">
            <figcaption class="label">Current in each column at the probe</figcaption>
            <div class="sb-plot" data-plot="bars"></div>
          </figure>
          <dl class="sb-readouts mono">
            <div><dt>Probe</dt><dd data-out="x"></dd></div>
            <div><dt>Max-likelihood column</dt><dd data-out="max"></dd></div>
            <div><dt>Sum of currents</dt><dd data-out="sum"></dd></div>
          </dl>
        </div>

        <form class="sb-controls" autocomplete="off">
          <div class="field">
            <label for="sb-x">Probe position <output data-val="x"></output></label>
            <input type="range" id="sb-x" min="${X_MIN}" max="${X_MAX}" step="0.1" />
          </div>

          <div class="sb-program" role="group" aria-labelledby="sb-program-label">
            <p class="label" id="sb-program-label">Program a column</p>
            <div class="field">
              <label for="sb-k">Column <output data-val="k"></output></label>
              <input type="range" id="sb-k" min="1" max="${N}" step="1" />
            </div>
            <div class="field">
              <label for="sb-mu">Mean μ <output data-val="mu"></output></label>
              <input type="range" id="sb-mu" min="-14" max="14" step="0.1" />
              <p class="hint">${raw("V<sub>Tn</sub> + Δ and |V<sub>Tp</sub>| − Δ")}</p>
            </div>
            <div class="field">
              <label for="sb-sigma">Variance σ² <output data-val="sigma"></output></label>
              <input type="range" id="sb-sigma" min="0.3" max="2.5" step="0.05" />
              <p class="hint">${raw("V<sub>Tn</sub> and |V<sub>Tp</sub>| shifted together")}</p>
            </div>
          </div>

          <div class="field">
            <span class="label" id="sb-bits-label">ADC readout</span>
            <div class="chip-row" role="group" aria-labelledby="sb-bits-label">
              <button class="chip" type="button" data-bits="4" aria-pressed="true">4-bit</button>
              <button class="chip" type="button" data-bits="8" aria-pressed="false">8-bit</button>
              <button class="chip" type="button" data-bits="0" aria-pressed="false">Ideal</button>
            </div>
          </div>

          <button class="btn btn-sm btn-quiet" type="button" data-reset>Reset</button>
        </form>

        <p class="sb-note">
          Toy model with ideal Gaussians in arbitrary units. In ProbSplat the mean and variance of each Gaussian are set by
          programming the threshold voltages of a floating-gate inverter column, and the column current is read by an ADC.
          Circuit results are in the <a href="#pub-probsplat" data-open="pub-probsplat">paper</a>.
        </p>
      </div>
    `
  );

  const topHost = el.querySelector('[data-plot="top"]');
  const barsHost = el.querySelector('[data-plot="bars"]');
  const out = (name) => el.querySelector(`[data-out="${name}"]`);
  const val = (name) => el.querySelector(`[data-val="${name}"]`);
  const input = (id) => el.querySelector(`#sb-${id}`);

  let columns = freshColumns();
  const state = { x: 3.2, k: 0, bits: 4 };
  const nearest = () => columns.reduce((best, c, i) => (current(c, state.x) > current(columns[best], state.x) ? i : best), 0);
  state.k = nearest();

  // ---- build the two SVGs once; geometry is set in layout() ----
  const top = svgEl("svg", { class: "sb-svg", role: "img", "aria-label": "Mixture density with a draggable probe" }, topHost);
  const clipId = "sb-clip";
  const clipRect = svgEl("rect", {}, svgEl("clipPath", { id: clipId }, svgEl("defs", {}, top)));
  const ticks = [-15, -10, -5, 0, 5, 10, 15].map((value) => ({
    value,
    line: svgEl("line", { class: "sb-tick" }, top),
    text: svgEl("text", { class: "sb-axis-text", "text-anchor": "middle" }, top),
  }));
  const topBase = svgEl("line", { class: "sb-base" }, top);
  const curves = svgEl("g", { "clip-path": `url(#${clipId})` }, top);
  const componentPaths = columns.map(() => svgEl("path", { class: "sb-comp" }, curves));
  const mixArea = svgEl("path", { class: "sb-mix-area" }, curves);
  const mixPath = svgEl("path", { class: "sb-mix" }, curves);
  const selectedPath = svgEl("path", { class: "sb-selected" }, curves);
  const probeLine = svgEl("line", { class: "sb-probe" }, top);
  const probeHandle = svgEl("rect", { class: "sb-probe-handle", width: 9, height: 9 }, top);

  const bars = svgEl("svg", { class: "sb-svg", role: "img", "aria-label": "Current in each column" }, barsHost);
  const barsBase = svgEl("line", { class: "sb-base" }, bars);
  const barRects = columns.map(() => svgEl("rect", { class: "sb-bar" }, bars));
  const barLabels = [1, 6, 12, 18, 24].map((n) => ({ n, text: svgEl("text", { class: "sb-axis-text", "text-anchor": "middle" }, bars) }));
  const hitRects = columns.map((_, i) => svgEl("rect", { class: "sb-hit", "data-k": i }, bars));

  let width = 0;
  const sx = (x) => PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (width - PAD.left - PAD.right);
  const topFloor = TOP_H - PAD.bottom;
  const sy = (v) => topFloor - (v / Y_MAX) * (topFloor - PAD.top);
  const barsFloor = BARS_H - PAD.bottom;

  function pathFor(fn, closed) {
    let d = "";
    for (let i = 0; i <= SAMPLES; i++) {
      const x = X_MIN + (i / SAMPLES) * (X_MAX - X_MIN);
      d += `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(fn(x)).toFixed(1)}`;
    }
    if (closed) d += `L${sx(X_MAX).toFixed(1)} ${topFloor}L${sx(X_MIN).toFixed(1)} ${topFloor}Z`;
    return d;
  }

  function layout() {
    width = Math.max(240, Math.round(topHost.clientWidth));
    for (const [svg, height] of [[top, TOP_H], [bars, BARS_H]]) {
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
    for (const [name, value] of Object.entries({ x: 0, y: 0, width, height: topFloor })) clipRect.setAttribute(name, value);
    for (const line of [topBase]) {
      line.setAttribute("x1", PAD.left);
      line.setAttribute("x2", width - PAD.right);
      line.setAttribute("y1", topFloor);
      line.setAttribute("y2", topFloor);
    }
    barsBase.setAttribute("x1", PAD.left);
    barsBase.setAttribute("x2", width - PAD.right);
    barsBase.setAttribute("y1", barsFloor);
    barsBase.setAttribute("y2", barsFloor);

    const sparse = width < 420;
    ticks.forEach(({ value, line, text }) => {
      const x = sx(value);
      line.setAttribute("x1", x);
      line.setAttribute("x2", x);
      line.setAttribute("y1", topFloor);
      line.setAttribute("y2", topFloor + 4);
      text.setAttribute("x", x);
      text.setAttribute("y", topFloor + 17);
      text.textContent = sparse && Math.abs(value) % 10 === 5 ? "" : value;
    });

    const slot = (width - PAD.left - PAD.right) / N;
    const barWidth = Math.max(2, slot - Math.min(4, slot * 0.3));
    barRects.forEach((rect, i) => {
      rect.setAttribute("x", (PAD.left + i * slot + (slot - barWidth) / 2).toFixed(1));
      rect.setAttribute("width", barWidth.toFixed(1));
    });
    hitRects.forEach((rect, i) => {
      rect.setAttribute("x", (PAD.left + i * slot).toFixed(1));
      rect.setAttribute("width", slot.toFixed(1));
      rect.setAttribute("y", 0);
      rect.setAttribute("height", barsFloor);
    });
    barLabels.forEach(({ n, text }) => {
      text.setAttribute("x", (PAD.left + (n - 0.5) * slot).toFixed(1));
      text.setAttribute("y", barsFloor + 17);
      text.textContent = n;
    });

    componentPaths.forEach((path, i) => path.setAttribute("d", pathFor((x) => current(columns[i], x))));
    drawCurves();
    drawProbe();
  }

  // Curves change when a column is reprogrammed or a different column is selected.
  function drawCurves() {
    const selected = columns[state.k];
    componentPaths[state.k].setAttribute("d", pathFor((x) => current(selected, x)));
    selectedPath.setAttribute("d", pathFor((x) => current(selected, x)));
    const mix = (x) => mixture(columns, x);
    mixPath.setAttribute("d", pathFor(mix));
    mixArea.setAttribute("d", pathFor(mix, true));
  }

  // The probe, bars and readouts change on every interaction.
  function drawProbe() {
    const px = sx(state.x);
    probeLine.setAttribute("x1", px);
    probeLine.setAttribute("x2", px);
    probeLine.setAttribute("y1", PAD.top - 4);
    probeLine.setAttribute("y2", topFloor);
    probeHandle.setAttribute("x", px - 4.5);
    probeHandle.setAttribute("y", PAD.top - 12);

    const values = columns.map((c) => quantize(Math.min(1, current(c, state.x)), state.bits));
    let maxIndex = 0;
    let sum = 0;
    values.forEach((v, i) => {
      sum += v;
      if (v > values[maxIndex]) maxIndex = i;
    });
    const span = barsFloor - PAD.top;
    barRects.forEach((rect, i) => {
      const h = Math.max(1, values[i] * span);
      rect.setAttribute("y", (barsFloor - h).toFixed(1));
      rect.setAttribute("height", h.toFixed(1));
      rect.classList.toggle("is-max", i === maxIndex && values[i] > 0);
      rect.classList.toggle("is-selected", i === state.k);
    });

    const selected = columns[state.k];
    out("x").textContent = `x = ${state.x.toFixed(1)}`;
    out("max").textContent = values[maxIndex] > 0 ? `#${maxIndex + 1}  (I = ${values[maxIndex].toFixed(2)})` : "none";
    out("sum").textContent = `${sum.toFixed(2)}${state.bits ? `  at ${state.bits}-bit` : ""}`;
    val("x").textContent = state.x.toFixed(1);
    val("k").textContent = `#${state.k + 1}`;
    val("mu").textContent = selected.mu.toFixed(1);
    val("sigma").textContent = (selected.sigma * selected.sigma).toFixed(2);
  }

  function syncInputs() {
    const selected = columns[state.k];
    input("x").value = state.x;
    input("k").value = state.k + 1;
    input("mu").value = selected.mu;
    input("sigma").value = selected.sigma;
  }

  let frame = 0;
  let curvesDirty = false;
  function schedule(redrawCurves) {
    curvesDirty = curvesDirty || redrawCurves;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (curvesDirty) drawCurves();
      curvesDirty = false;
      drawProbe();
    });
  }

  // ---- controls ----
  input("x").addEventListener("input", (e) => {
    state.x = Number(e.target.value);
    schedule(false);
  });
  input("k").addEventListener("input", (e) => selectColumn(Number(e.target.value) - 1));
  input("mu").addEventListener("input", (e) => {
    columns[state.k].mu = Number(e.target.value);
    schedule(true);
  });
  input("sigma").addEventListener("input", (e) => {
    columns[state.k].sigma = Number(e.target.value);
    schedule(true);
  });

  function selectColumn(k) {
    state.k = Math.min(N - 1, Math.max(0, k));
    syncInputs();
    schedule(true);
  }

  el.addEventListener("click", (event) => {
    const bitsButton = event.target.closest("[data-bits]");
    if (bitsButton) {
      state.bits = Number(bitsButton.dataset.bits);
      el.querySelectorAll("[data-bits]").forEach((b) => b.setAttribute("aria-pressed", String(b === bitsButton)));
      schedule(false);
      return;
    }
    if (event.target.closest("[data-reset]")) {
      columns = freshColumns();
      state.x = 3.2;
      state.bits = 4;
      state.k = nearest();
      el.querySelectorAll("[data-bits]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bits === "4")));
      syncInputs();
      layout();
      return;
    }
    const hit = event.target.closest(".sb-hit");
    if (hit) selectColumn(Number(hit.dataset.k));
  });

  // Drag the probe directly on the density plot.
  const probeFromEvent = (event) => {
    const rect = top.getBoundingClientRect();
    const t = (event.clientX - rect.left - PAD.left) / (rect.width - PAD.left - PAD.right);
    state.x = Math.round((X_MIN + Math.min(1, Math.max(0, t)) * (X_MAX - X_MIN)) * 10) / 10;
    input("x").value = state.x;
    schedule(false);
  };
  top.addEventListener("pointerdown", (event) => {
    top.setPointerCapture(event.pointerId);
    probeFromEvent(event);
  });
  top.addEventListener("pointermove", (event) => {
    if (top.hasPointerCapture(event.pointerId)) probeFromEvent(event);
  });

  syncInputs();
  layout();
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (Math.round(topHost.clientWidth) !== width) layout();
    }).observe(topHost);
  }
}
