import Automerge from "automerge";
import transit from "transit-immutable-js";

// This class will handle keeping track of the backend state
class DocBackend {
  constructor() {
    this.backend = Automerge.Backend.init();
  }

  // Loading a serialized document
  load(serializedDoc) {
    const changes = transit.fromJSON(serializedDoc);
    const [state] = Automerge.Backend.applyChanges(this.backend, changes);
    const patch = Automerge.Backend.getPatch(state);
    this.backend = state;
    return patch;
  }

  // Apply changes from the front end
  applyLocalChange(change) {
    try {
      const [newState, patch] = Automerge.Backend.applyLocalChange(
        this.backend,
        change
      );
      this.backend = newState;
      return patch;
    } catch (err) {
      console.warn("Couldn't apply local change", err);
      return null;
    }
  }

  // Applying changes from remote documents
  applyChanges(changes) {
    const [newState, patch] = Automerge.Backend.applyChanges(
      this.backend,
      changes
    );
    this.backend = newState;
    return patch;
  }
}

// Create a new instance of the document backend for this worker instance
const docBackend = new DocBackend();

// Respond to messages from the frontend document
addEventListener("message", (evt) => {
  const type = evt.data.type;
  const payload = evt.data.payload;
  const id = evt.data.id;

  if (type === "LOAD_DOC") {
    const patch = docBackend.load(payload);
    postMessage({ id, result: patch });
  }

  if (type === "APPLY_LOCAL_CHANGE") {
    const patch = docBackend.applyLocalChange(payload);
    postMessage({ id, result: patch });
  }

  if (type === "APPLY_CHANGES") {
    const patch = docBackend.applyChanges(payload);
    postMessage({ id, result: patch });
  }
});
