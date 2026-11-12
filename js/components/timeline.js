// Experience timeline. Entries are shown in the order given in the manifest.
// Entries that reference a role ("experience:<id>") open as accordions;
// the rest are markers, with a jump link when they reference a paper or project.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

const KIND_LABELS = {
  research: "Research",
  industry: "Industry",
  publication: "Publication",
  award: "Award",
  education: "Education",
  service: "Service",
};

function jumpLink(ref) {
  if (!ref) return "";
  const [type, id] = ref.split(":");
  if (type === "pub") return html`<a class="tl-link" href="#pub-${id}" data-open="pub-${id}">See the paper ${icons.up}</a>`;
  if (type === "project") return html`<a class="tl-link" href="#project-${id}" data-open="project-${id}">See the project ${icons.up}</a>`;
  return "";
}

function entry(item, index, experience) {
  const [refType, refId] = (item.ref ?? "").split(":");
  const role = refType === "experience" ? experience.find((e) => e.id === refId) : null;
  const kind = KIND_LABELS[item.kind] ?? item.kind;
  const id = `tl-${index}`;

  if (!role) {
    return html`
      <li class="tl-item" data-kind="${item.kind}" data-reveal>
        <p class="tl-date mono">${item.date_label}</p>
        <span class="tl-node" aria-hidden="true"></span>
        <div class="tl-body">
          <div class="tl-row">
            <h3 class="tl-label">${item.label}</h3>
            <span class="label tl-kind">${kind}</span>
          </div>
          <p class="tl-detail">${item.detail}</p>
          ${jumpLink(item.ref)}
        </div>
      </li>
    `;
  }

  const open = item.open === true;
  return html`
    <li class="tl-item tl-role" data-kind="${item.kind}" data-reveal>
      <p class="tl-date mono">${item.date_label}</p>
      <span class="tl-node" aria-hidden="true"></span>
      <div class="tl-body">
        <h3 class="tl-h">
          <button class="tl-head" type="button" data-toggle aria-expanded="${String(open)}" aria-controls="${id}-panel">
            <span class="tl-label">${role.role}</span>
            <span class="label tl-kind">${kind}</span>
            <span class="tl-icon">${icons.plus}</span>
          </button>
        </h3>
        <p class="tl-detail">${role.org} · ${role.location}</p>
        <div class="collapse" id="${id}-panel" data-open="${String(open)}">
          <div class="collapse-inner">
            <div class="tl-panel">
              ${role.detail ? html`<p class="tl-advisor">${role.detail}</p>` : ""}
              <ul class="bullets">${role.bullets.map((b) => html`<li>${b}</li>`)}</ul>
              <div class="chip-row">${role.tags.map((t) => html`<span class="chip">${t}</span>`)}</div>
            </div>
          </div>
        </div>
      </div>
    </li>
  `;
}

export function renderTimeline(el, data) {
  mount(el, html`<ol class="timeline">${data.timeline.map((item, i) => entry(item, i, data.experience))}</ol>`);
}
