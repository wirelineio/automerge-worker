/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const automergeWorker = require('./api');

jest.setTimeout(60000);

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quam nunc, laoreet ornare nisl nec, fringilla egestas nibh. Nulla facilisis neque dui, nec tristique nibh maximus non. Sed rhoncus scelerisque lectus et gravida. Aenean libero mauris, accumsan ac mattis nec, accumsan vel nisl. Proin hendrerit sapien non lectus feugiat cursus. Donec dignissim lacus non purus convallis, tincidunt scelerisque sapien fermentum. Donec scelerisque imperdiet orci, et eleifend augue aliquam vitae. Integer gravida at augue id vestibulum. Duis eget sem at leo maximus imperdiet. Quisque molestie, leo vitae gravida semper, orci quam dictum felis, nec pulvinar urna urna id elit. Quisque sed molestie massa, in vestibulum ex. Mauris condimentum faucibus molestie.';

const TEXT_100 = LOREM.slice(0, 100);
const TEXT_200 = LOREM.slice(0, 200);
const TEXT_500 = LOREM.slice(0, 500);

Array.range = (start, end) => Array.from({ length: (end - start) }, (v, k) => k + start);

const runTest = (docId, peers, text) => {
  const workers = [];

  const createAutomergePeer = async (actorId, documentId, changes = null) => {
    const worker = await automergeWorker.createAutomergeWorker();

    if (!changes) {
      // Peer who created the document
      const { changes: initialChanges } = await worker.createDocument(actorId, documentId);
      return { worker, changes: initialChanges };
    }

    // Other peers
    await worker.createDocumentFromChanges(actorId, documentId, changes);
    return { worker };
  };

  const makeARandomChange = async () => {
    const workerIndex = Math.floor(Math.random() * workers.length);
    const worker = workers[workerIndex];

    const changes = await worker.applyChangesFromOps(docId, [{
      type: 'insert',
      rangeOffset: 0,
      text
    }]);

    return { changes, workerIndex };
  };

  const replicateChanges = async (fromWorkerIndex, changes) => {
    const otherWorkers = workers.filter((worker, index) => index !== fromWorkerIndex);

    for (const worker of otherWorkers) {
      worker.applyChanges(docId, changes);
    }
  };

  test.concurrent(`PEERS: ${peers}. TEXT LENGTH: ${text.length}`, async () => {
    const { worker: creatorWorker, changes: initialChanges } = await createAutomergePeer('actor-0', docId);

    workers.push(creatorWorker);

    for (const index of Array.range(1, peers)) {
      const { worker } = await createAutomergePeer(`actor-${index}`, docId, initialChanges);
      workers[index] = worker;
    }

    // Random change over one of the workers.
    const { changes, workerIndex } = await makeARandomChange();

    // Get the content of the worker who made the change.
    const content = await workers[workerIndex].getDocumentContent(docId);

    // Send changes to other peers.
    await replicateChanges(workerIndex, changes);

    for (const worker of workers) {
      const peerContent = await worker.getDocumentContent(docId);
      expect(content).toBe(peerContent);
    }
  });
};

describe('Collaboration', () => {
  runTest('test-doc-20-100', 20, TEXT_100);
  runTest('test-doc-20-200', 20, TEXT_200);
  runTest('test-doc-20-500', 20, TEXT_500);
});
