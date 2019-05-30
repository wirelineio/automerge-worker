//
// Copyright 2019 Wireline, Inc.
//

const Automerge = require('automerge');

const { registerHandler } = require('./create-worker');

const { Backend, Frontend } = Automerge;

const docs = new Map();

const stateFromDoc = doc => Automerge.save(doc);

const docFromChanges = (changes, actorId) => {
  if (!actorId) {
    throw new RangeError('actorId is required in docFromChanges');
  }

  const doc = Frontend.init({ actorId, backend: Backend });
  const [state] = Backend.applyChanges(Backend.init(), changes);
  const patch = Backend.getPatch(state);
  patch.state = state;

  return Frontend.applyPatch(doc, patch);
};

const applyChanges = (doc, operations) => Automerge.change(doc, (currDoc) => {
  operations.forEach((op) => {
    if (op.type === 'delete') {
      currDoc.text.deleteAt(op.rangeOffset, op.rangeLength);
    } else {
      currDoc.text.insertAt(op.rangeOffset, ...op.text.split(''));
    }
  });
});

const initJob = (documentId, operations) => {
  // Current doc state
  const oldDoc = docs.get(documentId);

  return () => {
    const newDoc = applyChanges(oldDoc, operations);

    docs.set(documentId, newDoc);

    return Automerge.getChanges(oldDoc, newDoc);
  };
};

const initChangesJob = (documentId, changes) => {
  const oldDoc = docs.get(documentId);

  return () => {
    const newDoc = Automerge.applyChanges(oldDoc, changes);
    docs.set(documentId, newDoc);

    return Automerge.getChanges(oldDoc, newDoc);
  };
};

const api = {
  createDocument(actorId, documentId) {
    this.emit('status', { status: 'Creating document', actorId, documentId });

    const doc = Automerge.change(Automerge.init(actorId), (currDoc) => {
      // eslint-disable-next-line no-param-reassign
      currDoc.text = new Automerge.Text();
    });

    docs.set(documentId, doc);

    const state = api.getDocumentState(documentId);
    const changes = Automerge.getChanges(Automerge.init(), doc);

    this.emit('status', { status: 'Document created', actorId, documentId });

    return {
      documentId,
      state,
      changes
    };
  },

  createDocumentFromChanges(actorId, documentId, changes) {
    this.emit('status', { status: 'Creating document (from changes)', actorId, documentId });

    const doc = docFromChanges(changes, actorId);
    docs.set(documentId, doc);

    const state = api.getDocumentState(documentId);
    this.emit('status', { status: 'Document created (from changes)', actorId, documentId });
    return state;
  },

  getDocumentState(documentId) {
    if (!docs.has(documentId)) return undefined;

    return stateFromDoc(docs.get(documentId));
  },

  getDocumentContent(documentId) {
    return docs.get(documentId).text.join('');
  },

  getActorId(documentId) {
    return Automerge.getActorId(docs.get(documentId));
  },

  applyChanges(documentId, changes) {
    this.emit('status', { status: 'Applying changes', documentId });

    const job = initChangesJob(documentId, changes);
    const result = job();

    this.emit('status', { status: 'Changes applied', documentId });

    return result;
  },

  applyChangesFromOps(documentId, operations) {
    this.emit('status', { status: 'Applying changes (from operations)', documentId });

    const job = initJob(documentId, operations);
    const result = job();

    this.emit('status', { status: 'Applying changes (from operations)', documentId });

    return result;
  }
};

registerHandler(api);
