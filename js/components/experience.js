// Experience: each role is an accordion row.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

const KIND_LABELS = { research: "Research", industry: "Industry" };

function role(item) {
  const id = `exp-${item.id}`;
  const open = item.open === true;
  return html`
    <li class="tl-item tl-role" data-reveal>
      <p class="tl-date mono">${item.date_label}</p>
      <span class="tl-node" aria-hidden="true"></span>
      <div class="tl-body">
        <h3 class="tl-h">
          <button class="tl-head" type="button" data-toggle aria-expanded="${String(open)}" aria-controls="${id}-panel">
            <span class="tl-label">${item.role}</span>
            <span class="label tl-kind">${KIND_LABELS[item.kind] ?? item.kind}</span>
            <span class="tl-icon">${icons.plus}</span>
          </button>
        </h3>
        <p class="tl-detail">${item.org} · ${item.location}</p>
        <div class="collapse" id="${id}-panel" data-open="${String(open)}">
          <div class="collapse-inner">
            <div class="tl-panel">
              ${item.detail ? html`<p class="tl-advisor">${item.detail}</p>` : ""}
              <ul class="bullets">${item.bullets.map((b) => html`<li>${b}</li>`)}</ul>
              <div class="chip-row">${item.tags.map((t) => html`<span class="chip">${t}</span>`)}</div>
            </div>
          </div>
        </div>
      </div>
    </li>
  `;
}

export function renderExperience(el, data) {
  mount(el, html`<ol class="timeline">${data.experience.map(role)}</ol>`);
}
