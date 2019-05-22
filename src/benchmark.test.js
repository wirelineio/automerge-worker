/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const automergeWorker = require('./api');

jest.setTimeout(600000);

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quam nunc, laoreet ornare nisl nec, fringilla egestas nibh. Nulla facilisis neque dui, nec tristique nibh maximus non. Sed rhoncus scelerisque lectus et gravida. Aenean libero mauris, accumsan ac mattis nec, accumsan vel nisl. Proin hendrerit sapien non lectus feugiat cursus. Donec dignissim lacus non purus convallis, tincidunt scelerisque sapien fermentum. Donec scelerisque imperdiet orci, et eleifend augue aliquam vitae. Integer gravida at augue id vestibulum. Duis eget sem at leo maximus imperdiet. Quisque molestie, leo vitae gravida semper, orci quam dictum felis, nec pulvinar urna urna id elit. Quisque sed molestie massa, in vestibulum ex. Mauris condimentum faucibus molestie.';

Array.range = (start, end) => Array.from({ length: (end - start) }, (v, k) => k + start);

const runTest = (docId, text, changesCount) => {
  const createAutomergePeer = async (actorId, documentId) => {
    const worker = await automergeWorker.createAutomergeWorker();
    const { changes: initialChanges } = await worker.createDocument(actorId, documentId);
    return { worker, changes: initialChanges };
  };

  const makeARandomChange = async (worker) => {
    await worker.applyChangesFromOps(docId, [{
      type: 'insert',
      rangeOffset: 0,
      text
    }]);
  };

  test.concurrent(`CHANGES. TEXT LENGTH: ${text.length}. CHANGES: ${changesCount}`, async () => {
    const { worker } = await createAutomergePeer('actor-0', docId);

    for (const _ of Array.from({ length: changesCount })) {
      await makeARandomChange(worker);
    }

    const content = await worker.getDocumentContent(docId);

    const expectedContent = Array.from({ length: changesCount }).map(() => text).join('');

    expect(expectedContent).toBe(content);
  });
};

describe('Benchmark', () => {
  runTest('test-doc-100', LOREM.slice(0, 100), 10);
  runTest('test-doc-100', LOREM.slice(0, 100), 100);
  runTest('test-doc-100', LOREM.slice(0, 100), 1000);

  runTest('test-doc-100', LOREM.slice(0, 500), 10);
  runTest('test-doc-100', LOREM.slice(0, 500), 100);
});
