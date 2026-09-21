Closes document tabs in BB's preview without aiming at the ×.

## Who it is for

People who open files in the thread preview and then cannot close those tabs except by hitting a small close button.

Not a file manager. It only closes preview tabs.

## What you get

- Double-click a tab to close it
- Middle-click a tab (including the macOS three-finger click)
- Right-click → Close / Close others / Close tabs to the right
- Control+W closes the active tab (⌘W is taken by the window)
- Command palette: "Close Tab: close the active document tab"

## How it works

BB has no API for closing a preview tab. The plugin clicks the pill's own close button. If BB renames that control, the gestures stop; nothing else in BB breaks.

## First step

Open a file in the preview, then double-click its tab.
