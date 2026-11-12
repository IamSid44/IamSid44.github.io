// Project index: search box, domain filter, and rows that expand in place.
import { html, mount, reducedMotion } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

function projectRow(project, index) {
  const id = `project-${project.id}`;
  const extra = project.repo_readme_extension;
  return html`
    <li class="project" id="${id}" data-project="${project.id}" data-reveal style="--i:${Math.min(index, 5)}">
      <h3 class="project-h">
        <button class="project-head" type="button" data-toggle aria-expanded="false" aria-controls="${id}-panel">
          <span class="project-title">${project.title}</span>
          <span class="project-one">${project.one_liner}</span>
          <span class="project-domain label">${project.domain}</span>
          <span class="project-icon">${icons.plus}</span>
        </button>
      </h3>
      <div class="collapse" id="${id}-panel" data-open="false">
        <div class="collapse-inner">
          <div class="project-detail">
            <div class="project-main">
              <p class="label">${project.kind}${project.context ? html` · ${project.context}` : ""}</p>
              <ul class="bullets">${project.bullets.map((b) => html`<li>${b}</li>`)}</ul>
              ${extra
                ? html`
                    <div class="project-extra">
                      <p class="label">Since the course project</p>
                      <p>${extra.summary}</p>
                      <ul class="bullets">${extra.done.map((d) => html`<li>${d}</li>`)}</ul>
                      ${extra.next?.length ? html`<p class="project-next"><span class="label">Next</span> ${extra.next.join(", ")}</p>` : ""}
                    </div>
                  `
                : ""}
            </div>
            <div class="project-side">
              ${project.key_numbers?.length
                ? html`
                    <dl class="keynums keynums-stack">
                      ${project.key_numbers.map((k) => html`<div><dt>${k.label}</dt><dd class="mono">${k.value}</dd></div>`)}
                    </dl>
                  `
                : ""}
              <a class="btn btn-sm" href="${project.repo}" target="_blank" rel="noopener">Repository ${icons.external}</a>
            </div>
          </div>
        </div>
      </div>
    </li>
  `;
}

export function renderProjects(el, data) {
  const { projects, filters } = data;

  const domains = filters.domain.filter((d) => projects.some((p) => p.domain === d));
  const domainCount = (d) => projects.filter((p) => p.domain === d).length;

  mount(
    el,
    html`
      <div class="filters" data-reveal>
        <div class="filter-top">
          <label class="search">
            ${icons.search}
            <span class="sr-only">Search projects</span>
            <input type="search" id="project-search" placeholder="Search, e.g. gRPC or pipeline" autocomplete="off" spellcheck="false" />
          </label>
          <p class="filter-count mono" aria-live="polite"><span data-count>${projects.length}</span> of ${projects.length} projects</p>
          <button class="btn btn-sm btn-quiet filter-clear" type="button" data-clear disabled>Clear</button>
        </div>

        <div class="filter-row">
          <span class="label">Domain</span>
          <div class="chip-row" role="group" aria-label="Filter by domain">
            <button class="chip" type="button" data-domain="all" aria-pressed="true">All <span class="count">${projects.length}</span></button>
            ${domains.map(
              (d) => html`<button class="chip" type="button" data-domain="${d}" aria-pressed="false">${d} <span class="count">${domainCount(d)}</span></button>`
            )}
          </div>
        </div>
      </div>

      <ul class="project-list">${projects.map(projectRow)}</ul>
      <p class="project-empty" hidden>No projects match these filters.</p>
    `
  );

  const state = { domain: "all", query: "" };
  const rows = new Map(projects.map((p) => [p.id, el.querySelector(`[data-project="${p.id}"]`)]));
  const haystack = new Map(
    projects.map((p) => [p.id, [p.title, p.one_liner, p.domain, p.kind, p.context, ...p.stack, ...p.bullets].join(" ").toLowerCase()])
  );
  const countEl = el.querySelector("[data-count]");
  const clearButton = el.querySelector("[data-clear]");
  const emptyEl = el.querySelector(".project-empty");
  const searchInput = el.querySelector("#project-search");

  const matches = (p) =>
    (state.domain === "all" || p.domain === state.domain) &&
    (state.query === "" || state.query.split(/\s+/).every((word) => haystack.get(p.id).includes(word)));

  const paint = () => {
    let shown = 0;
    projects.forEach((p) => {
      const visible = matches(p);
      rows.get(p.id).hidden = !visible;
      if (visible) {
        shown += 1;
        rows.get(p.id).classList.add("is-in");
      }
    });
    countEl.textContent = shown;
    emptyEl.hidden = shown !== 0;
    clearButton.disabled = state.domain === "all" && state.query === "";
    el.querySelectorAll("[data-domain]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.domain === state.domain)));
  };

  // Cross-fade the list where the browser supports view transitions.
  const update = () => {
    if (document.startViewTransition && !reducedMotion()) {
      // A second filter click before the fade ends skips the first fade; that is fine.
      document.startViewTransition(paint).ready.catch(() => {});
    } else paint();
  };

  el.addEventListener("click", (event) => {
    const domain = event.target.closest("[data-domain]");
    if (domain) {
      state.domain = domain.dataset.domain;
    } else if (event.target.closest("[data-clear]")) {
      state.domain = "all";
      state.query = "";
      searchInput.value = "";
    } else {
      return;
    }
    update();
  });

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim().toLowerCase();
    paint();
  });
}
