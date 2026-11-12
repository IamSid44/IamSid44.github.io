// Hero: name, a one-line introduction, actions, and a small "at a glance" card with the portrait.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

export function renderHero(el, data) {
  const { person, bio, experience, education } = data;
  const [first, ...rest] = person.name.split(" ");
  const now = experience.find((e) => !e.end) ?? experience[0];
  const previous = experience.find((e) => e.end);
  const degree = education[0];

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
              <a class="btn btn-primary" href="#projects">See the projects ${icons.down}</a>
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
              ${person.focus ? html`<div><dt>Focus</dt><dd>${person.focus}</dd></div>` : ""}
              <div><dt>Now</dt><dd>${now.role}, ${now.org}</dd></div>
              ${previous ? html`<div><dt>Before</dt><dd>${previous.role}, ${previous.org}</dd></div>` : ""}
              <div><dt>Degree</dt><dd>${degree.degree}, ${degree.start} – ${degree.end}</dd></div>
            </dl>
          </aside>
        </div>
      </div>
    `
  );
}
