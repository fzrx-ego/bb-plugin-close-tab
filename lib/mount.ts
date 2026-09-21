// Gesture wiring for the document tab strip.
//
// BB itself closes a tab with the × and with a middle click on the pill.
// This plugin adds: double click, a context menu (close / others / to the
// right), Control+W, and the palette command registered in app.tsx. A middle
// click is still handled here because the macOS three-finger emulation can
// deliver the event with `target` on <body>, which the host handler misses.

import { openMenu, closeExisting } from "./menu";
import {
  activeCloseButtonIn,
  labelFor,
  siblingsOf,
  targetAt,
  type TabTarget,
} from "./pills";

interface MountContext {
  signal: AbortSignal;
}

function pointOf(event: MouseEvent): { x: number; y: number } | null {
  if (event.clientX === 0 && event.clientY === 0) return null;
  return { x: event.clientX, y: event.clientY };
}

function resolve(event: MouseEvent, doc: Document): TabTarget | null {
  return targetAt(event.target as Element | null, pointOf(event), (x, y) =>
    doc.elementFromPoint(x, y),
  );
}

/** Clicks close buttons right to left so earlier clicks cannot re-index later ones. */
function closeAll(buttons: HTMLElement[]): void {
  for (const button of [...buttons].reverse()) {
    if (button.isConnected) button.click();
  }
}

/** The tab strip the user is working in: the one under the pointer, else the only one. */
function activeTarget(doc: Document): HTMLElement | null {
  const strips = Array.from(
    doc.querySelectorAll('[data-testid="secondary-panel-tab-strip"]'),
  );
  for (const strip of strips) {
    const active = activeCloseButtonIn(strip);
    if (active !== null) return active;
  }
  return null;
}

export function mountCloseTab({ signal }: MountContext): () => void {
  const doc = document;
  closeExisting(doc);

  const onDoubleClick = (event: MouseEvent) => {
    const target = resolve(event, doc);
    if (target === null) return;
    event.preventDefault();
    event.stopPropagation();
    target.button.click();
  };

  const onAuxClick = (event: MouseEvent) => {
    if (event.button !== 1) return;
    const target = resolve(event, doc);
    if (target === null) return;
    event.preventDefault();
    event.stopPropagation();
    target.button.click();
  };

  // Some macOS trackpad drivers emit the middle button as mousedown only.
  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 1) return;
    const target = resolve(event, doc);
    if (target === null) return;
    event.preventDefault();
  };

  const onContextMenu = (event: MouseEvent) => {
    const target = resolve(event, doc);
    if (target === null) return;
    event.preventDefault();
    event.stopPropagation();
    const others = siblingsOf(target, "others");
    const right = siblingsOf(target, "right");
    openMenu(
      { x: event.clientX, y: event.clientY },
      [
        {
          label: `Close "${labelFor(target.button)}"`,
          run: () => target.button.click(),
        },
        {
          label: "Close others",
          disabled: others.length === 0,
          run: () => closeAll(others),
        },
        {
          label: "Close tabs to the right",
          disabled: right.length === 0,
          run: () => closeAll(right),
        },
      ],
      doc,
    );
  };

  // macOS: Command+W is the app/browser window shortcut, so the tab uses
  // Control+W. Elsewhere Control+W is free as well.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== "w") return;
    if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
      return;
    const active = activeTarget(doc);
    if (active === null) return;
    event.preventDefault();
    event.stopPropagation();
    active.click();
  };

  const options = { capture: true, signal } as const;
  doc.addEventListener("dblclick", onDoubleClick, options);
  doc.addEventListener("auxclick", onAuxClick, options);
  doc.addEventListener("mousedown", onMouseDown, options);
  doc.addEventListener("contextmenu", onContextMenu, options);
  doc.addEventListener("keydown", onKeyDown, options);

  return () => {
    doc.removeEventListener("dblclick", onDoubleClick, options);
    doc.removeEventListener("auxclick", onAuxClick, options);
    doc.removeEventListener("mousedown", onMouseDown, options);
    doc.removeEventListener("contextmenu", onContextMenu, options);
    doc.removeEventListener("keydown", onKeyDown, options);
    closeExisting(doc);
  };
}

/** Closes the active document tab; used by the palette command. */
export function closeActiveTab(doc: Document = document): boolean {
  const active = activeTarget(doc);
  if (active === null) return false;
  active.click();
  return true;
}
