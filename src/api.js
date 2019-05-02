//
// Copyright 2019 Wireline, Inc.
//

const { createWorker } = require('./create-worker');

// TODO(burdon): Comment.
const createAutomergeWorker = () => {

  const worker = createWorker();

  worker.setChangeFunction = async (key, updateFunction, initFunction) => worker.execute('setChangeFunction', [key, updateFunction.toString(), initFunction ? initFunction.toString() : null]);

  worker.createDocument = async (changeFunctionKey, actorId, documentId) => worker.execute('createDocument', [changeFunctionKey, actorId, documentId]);

  worker.createDocumentFromChanges = async (changeFunctionKey, actorId, documentId, changes) => worker.execute('createDocumentFromChanges', [changeFunctionKey, actorId, documentId, changes]);

  worker.getDocumentState = async documentId => worker.execute('getDocumentState', [documentId]);

  worker.getDocumentContent = async (documentId, getContent) => worker.execute('getDocumentContent', [documentId, getContent ? getContent.toString() : null]);

  worker.getActorId = async documentId => worker.execute('getActorId', [documentId]);

  worker.applyChanges = async (documentId, changes) => worker.execute('applyChanges', [documentId, changes]);

  worker.applyChangesFromOps = async (documentId, operations) => worker.execute('applyChangesFromOps', [documentId, operations]);

  return worker;
};

module.exports = {
  createAutomergeWorker
};
