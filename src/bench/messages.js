/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */

const randomWords = require('random-words');
const mutexify = require('mutexify');
const Automerge = require('automerge');

const lock = mutexify();

const automergeWorker = require('../api');

const CHANGES_MAX = 50;
const PEERS_MAX = 200;
const DELAY_MIN = 0;
const DELAY_MAX = 500;
const WORDS_MIN = 5;
const WORDS_MAX = 100;

Array.range = (start, end) => Array.from({ length: (end - start) }, (v, k) => k + start);

const makeARandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const insertText = (text, position, subText) => text.slice(0, position) + subText + text.slice(position);

const delay = time => new Promise(resolve => setTimeout(resolve, time));

let changesCount = 0;
let expectedContent = '';

const createMsgBench = async () => {
  const DOC_ID = 'doc';
  const owner = await automergeWorker.createAutomergeWorker();
  await owner.createDocument('main', DOC_ID);

  const peers = [];

  const log = (content) => {
    console.clear();
    console.log(`\nPEERS: ${peers.length + 1} (${peers.length} + Owner)
    \nCHANGES: ${changesCount}
    \nCONTENT LENGTH: ${content.length} chars
    \nCONTENT:\n${content}`);
  };


  const makeAChange = () => new Promise(async (resolve) => {
    await delay(makeARandom(DELAY_MIN, DELAY_MAX));

    lock(async (release) => {
      changesCount++;

      // const doc = Automerge.load(await owner.getDocumentState(DOC_ID), `peer-${peerIndex}`);
      const doc = Automerge.load(await owner.getDocumentState(DOC_ID));
      const content = doc.text.join('');

      const [text, rangeOffset] = [randomWords({ min: WORDS_MIN, max: WORDS_MAX }).join(' '), makeARandom(0, content.length)];

      const operation = {
        type: 'insert',
        rangeOffset,
        text
      };

      expectedContent = insertText(expectedContent, operation.rangeOffset, operation.text);

      const newDoc = Automerge.change(doc, (draftDoc) => {
        draftDoc.text.insertAt(operation.rangeOffset, ...operation.text);
      });

      const changes = Automerge.getChanges(doc, newDoc);

      await owner.applyChanges(DOC_ID, changes);

      log(expectedContent);

      release(resolve);
    });

  });

  return {
    owner,
    getContent: async () => owner.getDocumentContent(DOC_ID),
    makeAChange
  };
};

(async () => {
  console.time('Total time');

  const { getContent, makeAChange } = await createMsgBench();

  await Promise.all(Array.from({ length: CHANGES_MAX }).map(() => makeAChange(makeARandom(0, PEERS_MAX - 2))));

  const ownerNewContent = await getContent();

  if (ownerNewContent !== expectedContent) {
    console.error('\nChanges not applied correctly.');

    console.log({ ownerNewContent });
    console.log('\n');
    console.log({ expectedContent });

    process.exit(1);
  }

  console.log('\n');
  console.timeEnd('Total time');
  process.exit(-1);
})();
