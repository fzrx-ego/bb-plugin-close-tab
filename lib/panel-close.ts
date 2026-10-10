// A × at the right end of the secondary panel's top chrome that hides the
// whole panel, like the × on the neighbouring side panels.
//
// BB draws its own × there only in some layouts; in the desktop window it
// leaves hiding to the title-bar toggle ("Hide right panel"), which
// dispatches `panel.toggle`. The plugin has no API for that action, so the
// added × clicks that toggle. Without the toggle in the DOM the × is not
// shown.

const CHROME = '[data-testid="thread-secondary-panel-top-chrome"]';
const HIDE_PANEL = 'button[aria-label^="Hide right panel"]';
const MARK = "data-close-tab-panel-x";
const SVG_NS = "http://www.w3.org/2000/svg";

function hideToggle(doc: Document): HTMLButtonElement | null {
  return doc.querySelector<HTMLButtonElement>(HIDE_PANEL);
}

/** The control group at the right end of the chrome: it holds the full-screen button. */
function controlsOf(chrome: Element): HTMLElement | null {
  const last = chrome.lastElementChild;
  return last instanceof HTMLElement && last.querySelector("button") !== null ? last : null;
}

/** BB's own × on the "Close pane" buttons of side panes and thread headers. */
const BB_CLOSE_ICON = 'button[aria-label="Close pane"] svg';

function crossIcon(doc: Document): SVGElement {
  const bbIcon = doc.querySelector<SVGElement>(BB_CLOSE_ICON);
  if (bbIcon !== null) return bbIcon.cloneNode(true) as SVGElement;
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  const path = doc.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M18 6L6 18M6 6l12 12");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
}

function makeButton(doc: Document, template: HTMLButtonElement): HTMLButtonElement {
  const button = doc.createElement("button");
  button.type = "button";
  button.setAttribute(MARK, "");
  button.className = template.className;
  button.setAttribute("aria-label", "Hide panel");
  button.title = "Hide panel";
  button.appendChild(crossIcon(doc));
  button.addEventListener("click", () => hideToggle(doc)?.click());
  return button;
}

function sync(doc: Document): void {
  const canHide = hideToggle(doc) !== null;
  for (const chrome of Array.from(doc.querySelectorAll(CHROME))) {
    const controls = controlsOf(chrome);
    const existing = chrome.querySelector(`[${MARK}]`);
    // BB's own × carries the same label; with it in place nothing is added.
    if (!canHide || controls === null || controls.querySelector(HIDE_PANEL) !== null) {
      existing?.remove();
      continue;
    }
    if (existing !== null && existing.parentElement === controls && controls.lastElementChild === existing) continue;
    existing?.remove();
    const template = controls.querySelector<HTMLButtonElement>(`button:not([${MARK}])`);
    if (template === null) continue;
    controls.appendChild(makeButton(doc, template));
  }
}

export function mountPanelClose({ signal }: { signal: AbortSignal }): () => void {
  const doc = document;
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (!signal.aborted) sync(doc);
    });
  };
  sync(doc);
  const observer = new MutationObserver(schedule);
  observer.observe(doc.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    doc.querySelectorAll(`[${MARK}]`).forEach((node) => node.remove());
  };
}
