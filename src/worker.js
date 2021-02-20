import Automerge from "automerge";
import transit from "transit-immutable-js";

class DocBackend {
  constructor() {
    this.backend = Automerge.Backend.init();
  }

  load(serializedDoc) {
    const changes = transit.fromJSON(serializedDoc);
    const [state] = Automerge.Backend.applyChanges(this.backend, changes);
    const patch = Automerge.Backend.getPatch(state);
    this.backend = state;
    return patch;
  }

  // Changes from the front end
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

  // Changes from remote documents
  applyChanges(changes) {
    const [newState, patch] = Automerge.Backend.applyChanges(
      this.backend,
      changes
    );
    this.backend = newState;
    return patch;
  }
}

const docBackend = new DocBackend();

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
