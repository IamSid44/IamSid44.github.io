// Sticky header: brand, section links with a scroll spy, CV link, theme toggle, mobile menu.
import { html, mount } from "../lib/dom.js";
import { icons } from "../lib/icons.js";

const LINKS = [
  ["about", "About"],
  ["research", "Research"],
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["contact", "Contact"],
];

const THEME_COLORS = { dark: "#131416", light: "#f3f2ee" };

function applyTheme(theme, button) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  const next = theme === "dark" ? "light" : "dark";
  button.setAttribute("aria-label", `Switch to ${next} theme`);
  button.title = `Switch to ${next} theme`;
}

export function renderNav(el, data) {
  const { person } = data;
  mount(
    el,
    html`
      <div class="wrap nav-bar">
        <a class="nav-brand" href="#top" aria-label="${person.name}, back to top">
          <span class="nav-mark">${icons.bars}</span>
          <span class="nav-name">${person.name}</span>
          <span class="nav-initials" aria-hidden="true">${person.initials}</span>
        </a>
        <nav class="nav-links" id="nav-links" aria-label="Sections">
          ${LINKS.map(([id, label]) => html`<a href="#${id}" data-nav="${id}">${label}</a>`)}
        </nav>
        <div class="nav-tools">
          <a class="btn btn-sm" href="${person.links.cv_pdf}" target="_blank" rel="noopener">CV ${icons.download}</a>
          <button class="icon-btn" type="button" data-theme-toggle>
            <span class="theme-icon theme-icon-sun">${icons.sun}</span>
            <span class="theme-icon theme-icon-moon">${icons.moon}</span>
          </button>
          <button class="icon-btn nav-menu" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu">
            ${icons.menu}
          </button>
        </div>
      </div>
      <span class="nav-progress" aria-hidden="true"></span>
    `
  );

  // Theme toggle
  const themeButton = el.querySelector("[data-theme-toggle]");
  applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark", themeButton);
  themeButton.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next, themeButton);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable: the choice lasts for this visit only */
    }
  });

  // Mobile menu
  const menuButton = el.querySelector(".nav-menu");
  const links = el.querySelector(".nav-links");
  const setMenu = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    links.dataset.open = String(open);
  };
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  // Scroll spy: mark the link whose section crosses the middle of the viewport.
  const byId = new Map([...el.querySelectorAll("[data-nav]")].map((a) => [a.dataset.nav, a]));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          byId.forEach((a, id) => {
            if (id === entry.target.id) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        }
      },
      { rootMargin: "-45% 0px -54% 0px" }
    );
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
    // Above the first section nothing is current.
    const top = document.getElementById("top");
    if (top) {
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) byId.forEach((a) => a.removeAttribute("aria-current"));
        },
        { rootMargin: "-45% 0px -54% 0px" }
      ).observe(top);
    }
  }

  // Once the page has scrolled, a hairline appears under the header and a brass
  // line along it shows how far down the page the reader is.
  const progress = el.querySelector(".nav-progress");
  let frame = 0;
  const update = () => {
    frame = 0;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    el.classList.toggle("is-scrolled", window.scrollY > 8);
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, window.scrollY / range).toFixed(4) : 0})`;
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}
