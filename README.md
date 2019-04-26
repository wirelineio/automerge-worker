# automerge-worker

[![CircleCI](https://circleci.com/gh/wirelineio/automerge-worker.svg?style=svg&circle-token=e6fe46f7b046825c9cbf91d940d7093f889fdfc6)](https://circleci.com/gh/wirelineio/automerge-worker)
[![npm version](https://badge.fury.io/js/%40wirelineio%2Fautomerge-worker.svg)](https://badge.fury.io/js/%40wirelineio%2Fautomerge-worker)

## Usage

```js
const { createAutomergeWorker } = require('@wirelineio/automerge-worker');

// Create an instance of worker.
const worker = createAutomergeWorker();

// Use worker API.
const { changes } = await createDocument(feedKey, itemId);
const content = await getDocumentContent(itemId);
```

## Usage with Webpack

### Web

- Use the webpack plugin `CopyWebpackPlugin` to copy the `automerge.worker.js` from `dist/umd`:

```js
{
  plugins: [
    new CopyWebpackPlugin: ['../../node_modules/@wirelineio/automerge-worker/dist/umd/automerge.worker.js']
  ]
}

```

### Node

- Use the webpack plugin `CopyWebpackPlugin` to copy the `automerge.worker.js` from `dist/cjs`:

```js
{
  plugins: [
    new CopyWebpackPlugin: ['../../node_modules/@wirelineio/automerge-worker/dist/cjs/automerge.worker.js']
  ]
}

```

## Config AUTOMERGE_WORKER_PATH

The env variable `AUTOMERGE_WORKER_PATH` can be set to specify the path to the worker file copied in the previous step.
