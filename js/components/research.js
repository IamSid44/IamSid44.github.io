// Publications: each row shows venue, title, authors, summary and key numbers,
// with an expandable abstract and a copyable BibTeX entry when the manifest has them.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

function authorLine(pub, selfName) {
  if (!pub.authors?.length) return "";
  return html`
    <p class="pub-authors">
      ${pub.authors.map((name, i) => html`${i ? ", " : ""}${name === selfName ? html`<strong>${name}</strong>` : name}`)}
    </p>
  `;
}

function publication(pub, selfName) {
  const id = `pub-${pub.id}`;
  const hasDetail = Boolean(pub.abstract || pub.bibtex);
  return html`
    <li class="pub" id="${id}" data-reveal>
      <p class="pub-meta">
        <span class="label pub-venue">${pub.venue_short}</span>
        <span class="label">${pub.type}</span>
        <span class="label">${pub.role}</span>
      </p>
      <h3 class="pub-title">${pub.title}</h3>
      ${authorLine(pub, selfName)}
      ${pub.summary ? html`<p class="pub-summary">${pub.summary}</p>` : ""}
      ${pub.award ? html`<p class="pub-award"><span class="chip chip-accent">Award</span> ${pub.award}</p>` : ""}

      ${pub.key_numbers?.length
        ? html`
            <dl class="keynums">
              ${pub.key_numbers.map((k) => html`<div><dt>${k.label}</dt><dd class="mono">${k.value}</dd></div>`)}
            </dl>
          `
        : ""}

      <div class="pub-actions">
        <a class="btn btn-sm btn-primary" href="${pub.links.paper}" target="_blank" rel="noopener">Paper ${icons.external}</a>
        ${pub.abstract
          ? html`
              <button class="btn btn-sm" type="button" data-toggle aria-expanded="false" aria-controls="${id}-detail">
                Abstract <span class="chev">${icons.chevron}</span>
              </button>
            `
          : ""}
        ${pub.bibtex
          ? html`
              <button class="btn btn-sm" type="button" data-copy="#${id}-bibtex">
                ${icons.copy} <span data-copy-label>Copy BibTeX</span>
              </button>
            `
          : ""}
        ${pub.id === "probsplat" ? html`<a class="btn btn-sm btn-quiet" href="#demo">Try the idea ${icons.down}</a>` : ""}
      </div>

      ${hasDetail
        ? html`
            <div class="collapse" id="${id}-detail" data-open="false">
              <div class="collapse-inner">
                <div class="pub-detail">
                  ${pub.abstract ? html`<p class="label">Abstract</p><p class="pub-abstract">${pub.abstract}</p>` : ""}
                  ${pub.keywords?.length
                    ? html`<div class="chip-row">${pub.keywords.map((k) => html`<span class="chip">${k}</span>`)}</div>`
                    : ""}
                  ${pub.bibtex ? html`<p class="label">BibTeX</p><pre class="bibtex" id="${id}-bibtex" tabindex="0">${pub.bibtex}</pre>` : ""}
                </div>
              </div>
            </div>
          `
        : ""}
    </li>
  `;
}

export function renderResearch(el, data) {
  const { bio, publications, person } = data;
  mount(
    el,
    html`
      <div class="prose" data-reveal>${bio.long.map((p) => html`<p>${p}</p>`)}</div>
      <div class="interest-row" data-reveal>
        <span class="label">Interests</span>
        <div class="chip-row">${bio.research_interests.map((i) => html`<span class="chip">${i}</span>`)}</div>
      </div>
      <ol class="pub-list">${publications.map((pub) => publication(pub, person.name))}</ol>
    `
  );
}
