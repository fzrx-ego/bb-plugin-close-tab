// DOM helpers for BB's document tab pills.
//
// BB renders each tab as a pill: a container element holding the select
// button and a close button marked `data-tab-pill-close`. There is no plugin
// API for closing a tab, so this plugin clicks the same close button the ×
// uses. Everything here is a pure function over a DOM node, so the behavior
// is testable without the app shell.

export const CLOSE_BUTTON_SELECTOR = "[data-tab-pill-close]";

const STRIP_SELECTORS = [
  '[data-testid="secondary-panel-tab-strip"]',
  '[data-testid="mobile-panel-tab-viewport"]',
] as const;

/** The close button of the pill that contains `node`, if any. */
export function closeButtonFor(node: Element | null): HTMLElement | null {
  let current: Element | null = node;
  while (current !== null) {
    if (current.matches(CLOSE_BUTTON_SELECTOR)) return current as HTMLElement;
    // Only a pill holds the close button as a direct child; searching
    // descendants of any ancestor would target an unrelated tab.
    for (const child of Array.from(current.children)) {
      if (child.matches(CLOSE_BUTTON_SELECTOR)) return child as HTMLElement;
    }
    current = current.parentElement;
  }
  return null;
}

/** The pill container that owns `closeButton`. */
export function pillFor(closeButton: Element): Element {
  return closeButton.parentElement ?? closeButton;
}

/** The tab strip that owns `node`, or null when `node` is outside one. */
export function stripFor(node: Element | null): Element | null {
  let current: Element | null = node;
  while (current !== null) {
    for (const selector of STRIP_SELECTORS) {
      if (current.matches(selector)) return current;
    }
    current = current.parentElement;
  }
  return null;
}

/** Every close button in `root`, in visual (document) order. */
export function closeButtonsIn(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(CLOSE_BUTTON_SELECTOR),
  );
}

/** The close button of the active pill inside `root`, if the strip has one. */
export function activeCloseButtonIn(root: ParentNode): HTMLElement | null {
  for (const button of closeButtonsIn(root)) {
    const pill = pillFor(button);
    if (pill.querySelector('[aria-pressed="true"]') !== null) return button;
  }
  return null;
}

export interface TabTarget {
  /** Close button of the tab the gesture addressed. */
  button: HTMLElement;
  /** Strip that owns it; null when the pill is not inside a known strip. */
  strip: Element | null;
}

/** Resolve the tab a pointer gesture addressed, by target then by position. */
export function targetAt(
  node: Element | null,
  point: { x: number; y: number } | null,
  elementFromPoint: (x: number, y: number) => Element | null,
): TabTarget | null {
  let button = closeButtonFor(node);
  // A three-finger middle click on macOS often arrives with `target` set to
  // <body>, so fall back to whatever sits under the cursor.
  if (button === null && point !== null) {
    button = closeButtonFor(elementFromPoint(point.x, point.y));
  }
  if (button === null) return null;
  return { button, strip: stripFor(button) };
}
