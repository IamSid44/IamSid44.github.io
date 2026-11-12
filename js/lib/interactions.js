// Page-wide behaviours, wired once by event delegation:
// collapsible panels, copy-to-clipboard buttons and scroll reveals.

export function setOpen(button, open) {
  const panel = document.getElementById(button.getAttribute("aria-controls"));
  button.setAttribute("aria-expanded", String(open));
  if (panel) panel.dataset.open = String(open);
}

// Any <button data-toggle aria-controls="id"> opens and closes the .collapse with that id.
export function initToggles(root = document) {
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toggle]");
    if (!button) return;
    setOpen(button, button.getAttribute("aria-expanded") !== "true");
  });
}

// Open the collapsible that belongs to an element, e.g. when a link jumps to it.
export function openWithin(id) {
  const target = document.getElementById(id);
  const button = target?.querySelector("[data-toggle]");
  if (button) setOpen(button, true);
  return target;
}

function announce(message) {
  const region = document.getElementById("live-region");
  if (!region) return;
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and insecure contexts: fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

// <button data-copy="#element-id"> copies that element's text;
// <button data-copy="literal text"> copies the text itself.
export function initCopy(root = document) {
  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button || button.dataset.copied === "true") return;
    const source = button.dataset.copy;
    const text = source.startsWith("#") ? document.querySelector(source)?.textContent ?? "" : source;
    const ok = await writeClipboard(text.trim());

    const label = button.querySelector("[data-copy-label]") ?? button;
    const original = label.textContent;
    button.style.minWidth = `${button.offsetWidth}px`; // keep the width when the label changes
    label.textContent = ok ? "Copied" : "Press Ctrl+C";
    button.dataset.copied = "true";
    announce(ok ? "Copied to clipboard" : "Copy failed");
    setTimeout(() => {
      label.textContent = original;
      delete button.dataset.copied;
    }, 1600);
  });
}

// Elements marked data-reveal fade up the first time they enter the viewport.
export function initReveal(root = document) {
  const targets = root.querySelectorAll("[data-reveal]:not(.is-in)");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
  );
  targets.forEach((el) => observer.observe(el));
}

// Sections get .is-entered while their top edge is on screen, which replays the
// pulse along the section rule each time the reader scrolls to a new section.
export function initSectionPulse(root = document) {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) entry.target.parentElement.classList.toggle("is-entered", entry.isIntersecting);
    },
    { rootMargin: "-56px 0px -10% 0px" }
  );
  root.querySelectorAll(".section").forEach((section) => {
    // Watch a zero-height marker at the section's top edge, not the whole section.
    const marker = document.createElement("span");
    marker.className = "section-edge";
    marker.setAttribute("aria-hidden", "true");
    section.prepend(marker);
    observer.observe(marker);
  });
}

// In-page links with data-open="element-id" expand their target before scrolling to it.
export function initOpenLinks(root = document) {
  root.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-open]");
    if (link) openWithin(link.dataset.open);
  });
  if (location.hash.length > 1) openWithin(decodeURIComponent(location.hash.slice(1)));
}
