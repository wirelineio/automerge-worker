# automerge-worker

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
