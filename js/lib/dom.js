// Tiny templating helpers. `html` escapes every interpolated value unless it is
// itself the result of `html` or wrapped in `raw`, so manifest text can never inject markup.

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

class Raw {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export const raw = (value) => new Raw(String(value));

function render(value) {
  if (value == null || value === false || value === true) return "";
  if (Array.isArray(value)) return value.map(render).join("");
  if (value instanceof Raw) return value.value;
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => {
    out += render(value) + strings[i + 1];
  });
  return new Raw(out);
}

export function mount(el, template) {
  el.innerHTML = String(template);
  return el;
}

export const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
