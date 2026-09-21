# Close Tab

A [BB](https://getbb.app) plugin that closes document tabs in the preview panel without aiming at the ×.

## Install

```
bb plugin install git:https://github.com/fzrx-ego/bb-plugin-close-tab.git@semver:^0.2.0
```

- **Double click** a tab
- **Middle click** a tab (including the macOS three-finger click, which can
  arrive with `target` on `<body>` — the plugin resolves the tab by cursor
  position)
- **Right click** → Close / Close others / Close tabs to the right
- **Control+W** closes the active tab (⌘W is taken: the browser closes its own
  tab, the desktop app closes the panel)
- **Palette** (Mod+Shift+P) → "Close Tab: close the active document tab"

## How it works

BB exposes no API for closing a preview tab, so the plugin clicks the pill's
own close button (`[data-tab-pill-close]`). `lib/pills.ts` resolves a gesture
to a tab, `lib/menu.ts` draws the context menu, `lib/mount.ts` wires the
listeners in a content script. Everything is removed on dispose.

If BB renames that attribute, every gesture stops at once; nothing else
breaks. Check `lib/pills.ts` first when that happens.

## Develop

```
bb plugin dev .        # rebuild + reload on save
bb plugin build .
bb plugin install .
```

Source lives in `~/.bb/user-plugins/` on purpose: a plugin installed from a
thread workspace disappears when that environment is retired.
