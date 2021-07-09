//
// Copyright 2019 Wireline, Inc.
//

const Automerge = require('automerge');

const { registerHandler } = require('./create-worker');

const { Backend, Frontend } = Automerge;

const docs = new Map();
const changeFunctions = new Map();
const docsUpdateFunction = new Map();
const cacheFunctions = new Map();

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

const initJob = (documentId, operations) => {
  // Current doc state
  const oldDoc = docs.get(documentId);
  const updateFunction = docsUpdateFunction.get(documentId);

  return () => {
    const newDoc = Automerge.change(oldDoc, (currDoc) => {
      updateFunction(currDoc, operations, Automerge);
    });

    docs.set(documentId, newDoc);

    return Automerge.getChanges(oldDoc, newDoc);
  };
};

const getFunction = (funcStr) => {
  if (!funcStr) {
    return null;
  }

  if (cacheFunctions.has(funcStr)) {
    return cacheFunctions.get(funcStr);
  }

  let argName = '';
  let funcBody = '';

  if (funcStr.indexOf('(') === 0) {
    argName = funcStr.substring(funcStr.indexOf('(') + 1, funcStr.indexOf(')'));
  }

  if (funcStr.includes('=>')) {
    if (funcStr.indexOf('(') !== 0) {
      argName = funcStr.substring(0, funcStr.indexOf('=>'));
    }
    funcBody = funcStr.substring(funcStr.indexOf('=>') + 2);
  }

  argName = argName.trim();
  funcBody = funcBody.trim();

  if (funcBody.indexOf('{') === 0) {
    funcBody = funcStr.substring(funcStr.indexOf('{') + 1, funcStr.lastIndexOf('}'));
  } else {
    funcBody = `return ${funcBody}`;
  }

  // eslint-disable-next-line no-new-func
  const func = new Function(argName, funcBody);
  func.bind(Automerge);

  cacheFunctions.set(funcStr, func);

  return func;
};

const api = {
  setChangeFunction(key, updateFunction, initFunction) {
    changeFunctions.set(key, {
      update: getFunction(updateFunction),
      init: getFunction(initFunction)
    });
    return true;
  },

  createDocument(changeFunctionKey, actorId, documentId) {
    this.emit('status', { status: 'Creating document', actorId, documentId });

    const changeFunction = changeFunctions.get(changeFunctionKey);

    const doc = Automerge.change(Automerge.init(actorId), (currDoc) => {
      // eslint-disable-next-line no-param-reassign
      if (changeFunction.init) {
        changeFunction.init(currDoc, Automerge);
      }
    });

    docs.set(documentId, doc);

    docsUpdateFunction.set(documentId, changeFunction.update);

    const state = api.getDocumentState(documentId);
    const changes = Automerge.getChanges(Automerge.init(), doc);

    this.emit('status', { status: 'Document created', actorId, documentId });

    return {
      documentId,
      state,
      changes
    };
  },

  createDocumentFromChanges(changeFunctionKey, actorId, documentId, changes) {
    this.emit('status', { status: 'Creating document (from changes)', actorId, documentId });

    const doc = docFromChanges(changes, actorId);

    const changeFunction = changeFunctions.get(changeFunctionKey);

    docs.set(documentId, doc);

    docsUpdateFunction.set(documentId, changeFunction.update);

    const state = api.getDocumentState(documentId);
    this.emit('status', { status: 'Document created (from changes)', actorId, documentId });
    return state;
  },

  getDocumentState(documentId) {
    if (!docs.has(documentId)) return undefined;

    return stateFromDoc(docs.get(documentId));
  },

  getDocumentContent(documentId, getContent) {
    const func = getFunction(getContent);

    if (func) {
      return func(docs.get(documentId));
    }

    return JSON.stringify(docs.get(documentId));
  },

  getActorId(documentId) {
    return Automerge.getActorId(docs.get(documentId));
  },

  applyChanges(documentId, changes) {
    this.emit('status', { status: 'Applying changes', documentId });

    const oldDoc = docs.get(documentId);
    const newDoc = Automerge.applyChanges(oldDoc, changes);

    docs.set(documentId, newDoc);

    const changesMade = Automerge.getChanges(oldDoc, newDoc);
    this.emit('status', { status: 'Changes applied', documentId });
    return changesMade;
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
