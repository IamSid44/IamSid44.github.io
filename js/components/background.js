// Background: the degree, coursework in three columns, then recognition and teaching as label/value rows.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

const COURSE_GROUPS = {
  hardware: "Hardware",
  software_ml: "Software and ML",
  math_signals: "Mathematics and signals",
};

export function renderBackground(el, data) {
  const { education, achievements, coursework } = data;

  mount(
    el,
    html`
      <div class="bg-block" data-reveal>
        <h3 class="label">Education</h3>
        <ul class="kv-list">
          ${education.map(
            (item) => html`
              <li>
                <span class="kv-key">${item.degree}</span>
                <span class="kv-value">
                  ${item.institution}<br />
                  <span class="mono edu-meta">${[`${item.start} – ${item.end}`, item.grade].filter(Boolean).join(" · ")}</span>
                </span>
              </li>
            `
          )}
        </ul>
      </div>
      <div class="bg-block" data-reveal>
        <h3 class="label">Coursework</h3>
        <div class="course-grid">
          ${Object.entries(COURSE_GROUPS).map(
            ([key, title]) => html`
              <div class="course-group">
                <h4>${title}</h4>
                <ul>${(coursework[key] ?? []).map((course) => html`<li>${course}</li>`)}</ul>
              </div>
            `
          )}
        </div>
        ${coursework.note ? html`<p class="bg-note">${coursework.note}</p>` : ""}
      </div>
      <div class="bg-block" data-reveal>
        <h3 class="label">Recognition and teaching</h3>
        <ul class="kv-list">
          ${achievements.map(
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
      </div>
    `
  );
}
