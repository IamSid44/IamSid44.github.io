// Inline SVG icons. All are 16x16, stroke-based and inherit the text colour.
import { raw } from "./dom.js";

const icon = (body) =>
  raw(
    `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true">${body}</svg>`
  );

export const icons = {
  external: icon('<path d="M5 11 11 5M6 5h5v5"/>'),
  down: icon('<path d="M8 3v10M4 9l4 4 4-4"/>'),
  up: icon('<path d="M8 13V3M4 7l4-4 4 4"/>'),
  chevron: icon('<path d="m4 6 4 4 4-4"/>'),
  plus: icon('<path d="M8 3v10M3 8h10"/>'),
  copy: icon('<path d="M6 6h7v7H6zM3 10V3h7"/>'),
  download: icon('<path d="M8 2v8M5 7l3 3 3-3M3 13h10"/>'),
  search: icon('<circle cx="7" cy="7" r="4"/><path d="m10 10 3.5 3.5"/>'),
  menu: icon('<path d="M2 5h12M2 11h12"/>'),
  sun: icon('<circle cx="8" cy="8" r="2.75"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>'),
  moon: icon('<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z"/>'),
  bars: raw(
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="1" y="8" width="2.5" height="6"/><rect x="5" y="4" width="2.5" height="10"/><rect x="9" y="1" width="2.5" height="13"/><rect x="13" y="6" width="2.5" height="8"/></svg>'
  ),
};
