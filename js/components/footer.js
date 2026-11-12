// Footer and contact: email with a copy button, profile links, and a closing line.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

export function renderFooter(el, data) {
  const { person, bio } = data;
  const { links } = person;
  const profiles = [
    ["GitHub", links.github],
    ["LinkedIn", links.linkedin],
    ["Codeforces", links.codeforces],
  ].filter(([, url]) => url);

  mount(
    el,
    html`
      <div class="wrap footer-grid">
        <div class="footer-main" data-reveal>
          <p class="label">Contact</p>
          <h2 class="footer-title">Email is the fastest way to reach me.</h2>
          <div class="footer-email">
            <a class="footer-address mono" href="mailto:${links.email}">${links.email}</a>
            <button class="btn btn-sm" type="button" data-copy="${links.email}">${icons.copy} <span data-copy-label>Copy</span></button>
          </div>
        </div>
        <ul class="footer-links" data-reveal>
          ${profiles.map(
            ([name, url]) => html`<li><a href="${url}" target="_blank" rel="noopener me"><span>${name}</span>${icons.external}</a></li>`
          )}
          <li><a href="${links.cv_pdf}" target="_blank" rel="noopener"><span>CV (PDF)</span>${icons.download}</a></li>
        </ul>
      </div>
      <div class="wrap footer-base">
        <p>© ${new Date().getFullYear()} ${person.name}</p>
        ${bio.off_the_clock ? html`<p class="footer-aside">Off the clock: ${bio.off_the_clock}</p>` : ""}
        <a href="#top">Back to top ${icons.up}</a>
      </div>
    `
  );
}
