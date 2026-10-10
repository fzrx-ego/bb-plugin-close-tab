// bb-plugin-close-tab — frontend entry.
//
// No React surface: the plugin is a content script over BB's document tab
// strip plus one palette command. BB has no API for closing a preview tab,
// so every path here clicks the pill's own close button.

import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { closeActiveTab, mountCloseTab } from "./lib/mount";
import { mountPanelClose } from "./lib/panel-close";

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "tab-gestures",
    mount: mountCloseTab,
  });

  app.contentScripts.register({
    id: "panel-close",
    mount: mountPanelClose,
  });

  app.commands.register({
    id: "close-document-tab",
    title: "Close Tab: close the active document tab",
    run: () => {
      closeActiveTab();
    },
  });
});
