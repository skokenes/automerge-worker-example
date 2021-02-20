import Automerge from "automerge";
import Worker from "web-worker:./worker";

// Initialize the worker
const worker = new Worker();

// Helper function for communicated with the worker.
// When sending a message with `messageBackend()`, a Promise will be returned with the response
let msgId = 0;
const messageBackend = (msg) => {
  // Grab the latest message id
  const id = msgId;
  msgId++;
  // Pass the message to the worker with the message id
  worker.postMessage({ ...msg, id });
  // Listen for a message back from the worker with the corresponding id. Return the data from that message.
  return new Promise((resolve) => {
    const handler = (evt) => {
      if (evt.data.id === id) {
        resolve(evt.data);
      }
      worker.removeEventListener("message", handler);
    };
    worker.addEventListener("message", handler);
  });
};

// Fetch initial document from somewhere...
const serializedDoc = `["~#iL",[["~#iM",["ops",["^0",[["^1",["action","set","obj","00000000-0000-0000-0000-000000000000","key","count","value",0,"datatype","counter"]]]],"actor","d47dd2d9-40c1-4410-be59-3b388abe0394","seq",1,"deps",["^1",[]],"message","Initialization","undoable",false]]]]`;

// Initialiaze a frontend doc
let doc = Automerge.Frontend.init();
// Ask web worker to load the serialized doc into the backend state; then sync with frontend and update UI
messageBackend({ type: "LOAD_DOC", payload: serializedDoc }).then((data) => {
  let newDoc = Automerge.Frontend.applyPatch(doc, data.result);
  doc = newDoc;
  updateCounter();
});

// Helper function for changing the doc locally, passing change to frontend, and keeping them synced
async function changeDoc(changeFn) {
  const [newDoc, change] = Automerge.Frontend.change(doc, changeFn);
  let latestDoc = newDoc;
  if (change) {
    const data = await messageBackend({
      type: "APPLY_LOCAL_CHANGE",
      payload: change,
    });
    latestDoc = Automerge.Frontend.applyPatch(doc, data.result);
  }
  doc = latestDoc;
  updateCounter();
}

// Update the counter in the DOM
function updateCounter() {
  document.getElementById("count").innerHTML = doc.count;
}

// Button event listeners for incrementing/decrementing the count
document.getElementById("dec").addEventListener("click", () => {
  changeDoc((d) => {
    d.count.decrement();
  });
});

document.getElementById("inc").addEventListener("click", () => {
  changeDoc((d) => {
    d.count.increment();
  });
});
