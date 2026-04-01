const { contextBridge } = require('electron');

/*
TODO(Sentinel): Preload bridge plan
- Expose typed, minimal IPC APIs for proxy intercept controls.
- Expose history query APIs (search/filter/pagination).
- Expose repeater, intruder, scanner, OOB, sequencer, and decoder API calls.
- Expose target map and scope management APIs.
- Expose extension host safe APIs for third-party tools.
*/

contextBridge.exposeInMainWorld('electronInfo', {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
