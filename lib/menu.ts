// A small DOM context menu for tab pills.
//
// The host owns no menu for document tabs, so this plugin renders its own.
// It is plain DOM (no React root inside a content script) styled from the
// host theme tokens, and every node, listener, and timer it creates is
// removed by the returned disposer.

export interface MenuItem {
  label: string;
  disabled?: boolean;
  run: () => void;
}

export interface OpenMenu {
  close: () => void;
}

const MENU_CLASS = "close-tab-plugin-menu";

export function openMenu(
  point: { x: number; y: number },
  items: MenuItem[],
  doc: Document = document,
): OpenMenu {
  closeExisting(doc);

  const menu = doc.createElement("div");
  menu.className = MENU_CLASS;
  menu.setAttribute("role", "menu");
  Object.assign(menu.style, {
    position: "fixed",
    zIndex: "2147483000",
    minWidth: "180px",
    padding: "4px",
    borderRadius: "8px",
    border: "1px solid var(--border, rgba(127,127,127,0.3))",
    background: "var(--popover, var(--background, #1c1c1c))",
    color: "var(--popover-foreground, var(--foreground, #eee))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    font: "13px/1.4 var(--font-sans, system-ui, sans-serif)",
    left: `${point.x}px`,
    top: `${point.y}px`,
  });

  for (const item of items) {
    const row = doc.createElement("button");
    row.type = "button";
    row.setAttribute("role", "menuitem");
    row.textContent = item.label;
    row.disabled = item.disabled === true;
    Object.assign(row.style, {
      display: "block",
      width: "100%",
      padding: "6px 10px",
      textAlign: "left",
      border: "none",
      borderRadius: "6px",
      background: "transparent",
      color: "inherit",
      cursor: item.disabled === true ? "default" : "pointer",
      opacity: item.disabled === true ? "0.5" : "1",
    });
    row.addEventListener("mouseenter", () => {
      if (item.disabled !== true) {
        row.style.background = "var(--accent, rgba(127,127,127,0.2))";
      }
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "transparent";
    });
    row.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
      item.run();
    });
    menu.appendChild(row);
  }

  doc.body.appendChild(menu);

  // Keep the menu inside the viewport now that it has a measured size.
  const rect = menu.getBoundingClientRect();
  const view = doc.defaultView;
  const maxX = (view?.innerWidth ?? rect.right) - rect.width - 8;
  const maxY = (view?.innerHeight ?? rect.bottom) - rect.height - 8;
  menu.style.left = `${Math.max(8, Math.min(point.x, maxX))}px`;
  menu.style.top = `${Math.max(8, Math.min(point.y, maxY))}px`;

  const onPointerDown = (event: Event) => {
    if (!menu.contains(event.target as Node)) dismiss();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") dismiss();
  };
  const onBlur = () => dismiss();

  let disposed = false;
  function dismiss() {
    if (disposed) return;
    disposed = true;
    doc.removeEventListener("pointerdown", onPointerDown, true);
    doc.removeEventListener("keydown", onKeyDown, true);
    doc.removeEventListener("scroll", onBlur, true);
    doc.defaultView?.removeEventListener("blur", onBlur);
    doc.defaultView?.removeEventListener("resize", onBlur);
    menu.remove();
  }

  doc.addEventListener("pointerdown", onPointerDown, true);
  doc.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("scroll", onBlur, true);
  doc.defaultView?.addEventListener("blur", onBlur);
  doc.defaultView?.addEventListener("resize", onBlur);

  return { close: dismiss };
}

/** Removes a menu left behind by a previous generation of this plugin. */
export function closeExisting(doc: Document = document): void {
  for (const stale of Array.from(doc.querySelectorAll(`.${MENU_CLASS}`))) {
    stale.remove();
  }
}
