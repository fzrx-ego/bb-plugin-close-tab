// bb-plugin-close-tab — backend entry.
//
// The plugin lives in the app shell (see app.tsx). BB requires a server
// entry, so this one only records its lifecycle in the plugin log.

import type { BbPluginApi } from "@get-bb/plugin-sdk";

export default async function plugin(bb: BbPluginApi) {
  bb.log.info("loaded");
  return () => {
    bb.log.info("disposed");
  };
}
