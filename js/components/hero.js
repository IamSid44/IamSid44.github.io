// Hero: name, position, actions, a small "at a glance" card with the portrait,
// the column-current strip that follows the pointer, and four headline figures.
import { html, mount, reducedMotion } from "../lib/dom.js";
import { icons } from "../lib/icons.js";
import { makeColumns, current } from "../lib/gmm.js";

const COLUMNS = 48;
const REST_POSITION = 0.63;

export function renderHero(el, data) {
  const { person, bio, experience, education, publications } = data;
  const [first, ...rest] = person.name.split(" ");
  const now = experience.find((e) => !e.end) ?? experience[0];
  const previous = experience.find((e) => e.end);
  const degree = education[0];
  const lead = publications[0];

  mount(
    el,
    html`
      <div class="wrap">
        <div class="hero-grid">
          <div class="hero-main">
            <p class="label hero-eyebrow">${now.role} · ${now.org}</p>
            <h1 class="hero-name">${first}<br />${rest.join(" ")}</h1>
            <p class="hero-tagline" data-enter style="--i:1">${bio.tagline}</p>
            <p class="hero-lead" data-enter style="--i:2">${bio.summary}</p>
            <div class="hero-actions" data-enter style="--i:3">
              <a class="btn btn-primary" href="#research">Read the research ${icons.down}</a>
              <a class="btn" href="${person.links.cv_pdf}" target="_blank" rel="noopener">Download CV ${icons.download}</a>
              <a class="btn btn-quiet" href="${person.links.github}" target="_blank" rel="noopener">GitHub ${icons.external}</a>
            </div>
          </div>

          <aside class="id-card" aria-label="At a glance" data-enter style="--i:2">
            <div class="id-top">
              <picture>
                <source type="image/webp" srcset="${person.photo.webp}" />
                <img
                  class="id-photo"
                  src="${person.photo.jpg}"
                  srcset="${person.photo.jpg} 1x, ${person.photo.jpg2x} 2x"
                  width="72"
                  height="72"
                  alt="Portrait of ${person.name}"
                  decoding="async"
                />
              </picture>
              <div class="id-caption">
                <p class="id-place">${person.location}</p>
                <p class="label">@${person.handle}</p>
              </div>
            </div>
            <dl class="spec">
              <div><dt>Now</dt><dd>${now.role}, ${now.org}</dd></div>
              ${previous ? html`<div><dt>Before</dt><dd>${previous.role}, ${previous.org}</dd></div>` : ""}
              <div><dt>Degree</dt><dd>${degree.degree}, ${degree.start} – ${degree.end}</dd></div>
              <div><dt>Latest</dt><dd><a href="#pub-${lead.id}" data-open="pub-${lead.id}">${lead.venue_short}</a>, ${lead.role.toLowerCase()}</dd></div>
            </dl>
          </aside>
        </div>

        <div class="signal" data-enter style="--i:4">
          <div class="signal-bars" aria-hidden="true">${Array.from({ length: COLUMNS }, () => html`<span></span>`)}</div>
          <div class="signal-cap">
            <span>Column current · ${COLUMNS} columns</span>
            <span class="signal-readout" data-signal-readout></span>
            <a href="#demo">What is this? ${icons.down}</a>
          </div>
        </div>

        <dl class="stats" data-enter style="--i:5">
          ${bio.highlights.map(
            (h) => html`
              <div class="stat">
                <dt class="stat-label">${h.label}</dt>
                <dd class="stat-value">${h.value}</dd>
                <dd class="stat-detail">${h.detail}</dd>
              </div>
            `
          )}
        </dl>
      </div>
    `
  );

  initSignal(el);
}

// The strip shows the current in 48 Gaussian columns for a probe at the pointer's x position.
function initSignal(hero) {
  const bars = [...hero.querySelectorAll(".signal-bars span")];
  const strip = hero.querySelector(".signal-bars");
  const readout = hero.querySelector("[data-signal-readout]");
  const columns = makeColumns(COLUMNS, { seed: 11, min: 0, max: 1, sigma: [0.035, 0.085], weight: [0.4, 1], jitter: 0.3 });

  let position = REST_POSITION;
  let frame = 0;

  const draw = () => {
    frame = 0;
    let max = 0;
    let maxIndex = 0;
    const values = columns.map((column, i) => {
      const v = current(column, position);
      if (v > max) {
        max = v;
        maxIndex = i;
      }
      return v;
    });
    bars.forEach((bar, i) => {
      bar.style.setProperty("--v", Math.max(0.03, values[i]).toFixed(3));
      bar.classList.toggle("is-max", i === maxIndex);
      bar.classList.toggle("is-high", i !== maxIndex && values[i] > 0.4);
    });
    readout.textContent = `Max likelihood: column ${maxIndex + 1}`;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  draw();
  if (reducedMotion()) return;

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const rect = strip.getBoundingClientRect();
    position = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    schedule();
  });
  hero.addEventListener("pointerleave", () => {
    position = REST_POSITION;
    schedule();
  });
}
