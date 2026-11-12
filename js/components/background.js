// Background: recognition and positions as label/value rows, then tools and coursework.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

const COURSE_GROUPS = {
  hardware: "Hardware",
  software_ml: "Software and ML",
  math_signals: "Mathematics and signals",
};

function rows(items) {
  return html`
    <ul class="kv-list">
      ${items.map(
        (item) => html`
          <li>
            <span class="kv-key">${item.label}</span>
            <span class="kv-value">
              ${item.text}
              ${item.link ? html` <a href="${item.link}" target="_blank" rel="noopener" class="kv-link">Profile ${icons.external}</a>` : ""}
            </span>
          </li>
        `
      )}
    </ul>
  `;
}

export function renderBackground(el, data) {
  const { achievements, skills, coursework } = data;
  const awards = achievements.filter((a) => a.group === "award");
  const positions = achievements.filter((a) => a.group === "position");

  mount(
    el,
    html`
      <div class="bg-block" data-reveal>
        <h3 class="label">Recognition</h3>
        ${rows(awards)}
      </div>
      <div class="bg-block" data-reveal>
        <h3 class="label">Positions</h3>
        ${rows(positions)}
      </div>
      <div class="bg-split">
        <div class="bg-block" data-reveal>
          <h3 class="label">Tools</h3>
          <dl class="group-list">
            ${Object.entries(skills).map(
              ([group, items]) => html`
                <div>
                  <dt>${group}</dt>
                  <dd class="chip-row">${items.map((s) => html`<span class="chip">${s}</span>`)}</dd>
                </div>
              `
            )}
          </dl>
        </div>
        <div class="bg-block" data-reveal>
          <h3 class="label">Coursework</h3>
          <dl class="group-list">
            ${Object.entries(COURSE_GROUPS).map(
              ([key, title]) => html`
                <div>
                  <dt>${title}</dt>
                  <dd>${(coursework[key] ?? []).join(" · ")}</dd>
                </div>
              `
            )}
          </dl>
          ${coursework.note ? html`<p class="bg-note">${coursework.note}</p>` : ""}
        </div>
      </div>
    `
  );
}
