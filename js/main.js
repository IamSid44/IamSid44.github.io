// Entry point: load the content manifest, render each section into its slot,
// then wire the page-wide interactions and the backdrop.
import { renderNav } from "./components/nav.js";
import { renderHero } from "./components/hero.js";
import { renderAbout } from "./components/about.js";
import { renderResearch } from "./components/research.js";
import { renderProjects } from "./components/projects.js";
import { renderExperience } from "./components/experience.js";
import { renderBackground } from "./components/background.js";
import { renderFooter } from "./components/footer.js";
import { initToggles, initCopy, initReveal, initOpenLinks, initSectionPulse } from "./lib/interactions.js";
import { initBackdrop } from "./lib/backdrop.js";

const SECTIONS = {
  nav: renderNav,
  hero: renderHero,
  about: renderAbout,
  research: renderResearch,
  projects: renderProjects,
  experience: renderExperience,
  background: renderBackground,
  footer: renderFooter,
};

async function start() {
  initBackdrop(); // does not depend on the content

  let data;
  try {
    const response = await fetch("content-manifest.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.error("Could not load content-manifest.json", error);
    document.documentElement.classList.remove("js"); // show whatever static content exists
    const main = document.getElementById("main");
    const note = document.createElement("p");
    note.className = "wrap noscript";
    note.textContent = "The page content could not be loaded. Please refresh, or open the page from a web server rather than as a local file.";
    main.prepend(note);
    return;
  }

  for (const [slot, render] of Object.entries(SECTIONS)) {
    const el = document.querySelector(`[data-slot="${slot}"]`);
    if (!el) continue;
    try {
      render(el, data);
    } catch (error) {
      console.error(`Section "${slot}" failed to render`, error);
    }
  }

  initToggles();
  initCopy();
  initOpenLinks();
  initReveal();
  initSectionPulse();
  document.documentElement.classList.add("is-ready");
}

start();
