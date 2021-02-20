# Automerge Worker Example
This repository contains an example of using a web worker to split out the frontend and backend of an Automerge document in the browser.

To run the example app,

```$ npm i```

```$ npm run dev```

Open a browser to localhost:5000 and try incrementing and decrementing the counter.

Splitting the frontend computations from the backend can be useful when dealing with heavy operations like loading large documents or apply lots of changes. If using a unified Automerge document in the main thread, the operations of updating the Automerge backend state can block the UI. By running the backend operations in a webworker, the UI can stay unblocked while state is updated.

When splitting the frontend from the backend, operations are generally passed to the backend to complete. When it is done, it returns patches that can be applied to the frontend to keep it in sync. With web workers, this sharing happens via event messaging.

The code in [src/index.js](./src/index.js) and [src/worker.js](./src/worker.js) shows operations like loading a document and applying a local change. Here is a simplified example of how loading a document works, removing the web worker communication bits and just showing how the frontend and backend would interact directly:

```javascript
import Automerge from "automerge";
import transit from "transit-immutable-js";

// Assume a separate doc for the frontend and backend state, created like so:
const frontend = Automerge.Frontend.init();
const backend = Automerge.Backend.init();

// Assum a variable `serializedDoc`, perhaps loaded from a server...
// Get the changes of the serialized doc
const changes = transit.fromJSON(serializedDoc);
// Apply those changes to the backend state
const [state] = Automerge.Backend.applyChanges(backend, changes);
// Get a patch from the new state
const patch = Automerge.Backend.getPatch(state);
// Overwrite the backend with the latest state
backend = state;
// Update the frontend with the patch from the backend
frontend = Automerge.Frontend.applyPatch(frontend, patch);
```