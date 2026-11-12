// About: a few short paragraphs in the first person, then the interest tags.
import { html, mount } from "../lib/dom.js";

export function renderAbout(el, data) {
  const { bio } = data;
  mount(
    el,
    html`
      <div class="prose" data-reveal>${bio.about.map((p) => html`<p>${p}</p>`)}</div>
      <div class="interest-row" data-reveal>
        <span class="label">Interests</span>
        <div class="chip-row">${bio.research_interests.map((i) => html`<span class="chip">${i}</span>`)}</div>
      </div>
    `
  );
}
