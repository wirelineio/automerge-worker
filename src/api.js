//
// Copyright 2019 Wireline, Inc.
//

const { createWorker } = require('./create-worker');

// TODO(burdon): Comment.
const createAutomergeWorker = () => {

  const worker = createWorker();

  worker.createDocument = async (actorId, documentId, initialState) => worker.execute('createDocument', [actorId, documentId, initialState]);

  worker.createDocumentFromChanges = async (actorId, documentId, changes) => worker.execute('createDocumentFromChanges', [actorId, documentId, changes]);

  worker.getDocumentState = async documentId => worker.execute('getDocumentState', [documentId]);

  worker.getDocumentContent = async documentId => worker.execute('getDocumentContent', [documentId]);

  worker.getActorId = async documentId => worker.execute('getActorId', [documentId]);

  worker.applyChanges = async (documentId, changes) => worker.execute('applyChanges', [documentId, changes]);

  worker.applyChangesFromOps = async (documentId, operations) => worker.execute('applyChangesFromOps', [documentId, operations]);

  return worker;
};

module.exports = {
  createAutomergeWorker
};
