//
// Copyright 2019 Wireline, Inc.
//

const Automerge = require('automerge');

// TODO(burdon): Fix.
const automergeWorker = require('./api').createAutomergeWorker();

const shortLorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eleifend ex et nisl tincidunt eleifend. Quisque ullamcorper ligula risus, euismod tincidunt ante pharetra a. Sed ac est ac nisi viverra accumsan id et dolor. Mauris dictum elit id leo rutrum auctor sed et sapien. Morbi diam neque, facilisis et ligula a, semper gravida elit. Ut mollis nisi a erat volutpat vulputate. Integer fringilla accumsan tortor, in fringilla mi faucibus quis.';

describe('Automerge api', () => {
  test('Create document: Should get correct state', async () => {
    const { state } = await automergeWorker.createDocument('actor1', '1');

    const initialStateReg = /\["~#iL",\[\["~#iM",\["ops",\["\^0",\[\["\^1",\["action","makeText","obj","(.+)"\]\],\["\^1",\["action","link","obj","00000000-0000-0000-0000-000000000000","key","text","value","(.+)"\]\]\]\],"actor","actor1","seq",1,"deps",\["\^1",\[\]\]\]\]\]\]/;

    expect(state).toMatch(initialStateReg);
  });

  test('Create document: Should get correct changes', async () => {
    const { changes } = await automergeWorker.createDocument('actor1', '1');

    expect(changes.length).toBe(1);
    expect(changes[0].ops.length).toBe(2);
    expect(changes[0].seq).toBe(1);
    expect(changes[0].actor).toBe('actor1');
    expect(changes[0].deps).toEqual({});

    const [ firstOp, secOp ] = changes[0].ops;
    expect(firstOp.action).toBe('makeText');
    expect(secOp.action).toBe('link');
    expect(secOp.obj).toBe('00000000-0000-0000-0000-000000000000');
    expect(secOp.key).toBe('text');
    expect(secOp.value).toBe(firstOp.obj);
  });

  test('Create document from changes: should get correct changes', async () => {
    const [actor1, actor2, docId] = ['actor1', 'actor2', 'docId'];

    const { changes } = createDoc(actor2);

    const state = await automergeWorker.createDocumentFromChanges(actor1, docId, changes);

    const doc = Automerge.load(state);

    expect(doc.text.join('')).toBe(shortLorem);
  });

  test('Create document from changes: should get correct changes (long text)', async () => {
    const [actor1, actor2, docId] = ['actor1', 'actor2', 'docId'];

    const longLorem = Array.from({ length: 30 }).map(() => shortLorem).join('');

    const { changes } = createDoc(actor2, longLorem);

    const state = await automergeWorker.createDocumentFromChanges(actor1, docId, changes);

    const doc = Automerge.load(state);

    expect(doc.text.join('')).toBe(longLorem);
  });

});

afterAll(async () => {
  await automergeWorker.terminate();
});

const createDoc = (actorId, content = shortLorem) => {
  let doc = Automerge.init(actorId);

  doc = Automerge.change(doc, doc => {
    doc.text = new Automerge.Text();
    doc.text.insertAt(doc.text.length, ...content);
  });

  const changes = Automerge.getChanges(Automerge.init(), doc);

  return {
    doc,
    changes
  };
};
