//
// Copyright 2019 Wireline, Inc.
//

// eslint-disable-next-line import/no-unresolved
const { Worker, parentPort } = require('worker_threads');
const uuid = require('uuid/v4');

// TODO(burdon): Comment.
const workerOnEvent = (event, workerContext, cb) => {
  workerContext.on(event, cb);
};

// TODO(burdon): Comment.
const registerHandler = (api) => {
  const context = parentPort;

  // Messages to worker
  workerOnEvent('message', context, async (data) => {
    // TODO(esteban): Resolve this conflict with webpack load config
    if (data.type && data.type.startsWith('webpack')) return;

    const { id, event: mainThreadEvent, method, params = null } = data;
    // eslint-disable-next-line prefer-spread
    const result = await api[method].apply(api, params);

    // to main thread
    context.postMessage({ id, event: mainThreadEvent, result });
  });

  // eslint-disable-next-line no-param-reassign
  api.emit = (event, data) => {
    context.postMessage({ event, data });
  };
};

const bindExecute = worker => (method, params) => {
  const id = uuid();

  return new Promise((resolve) => {
    worker.listeners.set(id, (result) => {
      resolve(result);
    });

    worker.postMessage({
      id,
      method,
      params
    });
  });
};

const bindOn = worker => (event, cb) => {
  const currentListeners = worker.listeners.get(event) || [];

  currentListeners.push(cb);

  worker.listeners.set(event, currentListeners);
};

const createWorker = () => {

  const workerPath = `${process.env.AUTOMERGE_WORKER_PATH || '.'}/automerge.worker.js`;
  const worker = new Worker(workerPath);

  worker.listeners = new Map();

  // Messages from worker
  workerOnEvent('message', worker, (data) => {
    // data.id = Response to a custom function
    if (data.id) {
      worker.listeners.get(data.id).apply(null, [data.result]);
      worker.listeners.delete(data.id);
      return;
    }

    // data.event = Response to a event listener from main thread
    (worker.listeners.get(data.event) || []).forEach(fn => fn.apply(null, [data.data]));
  });

  worker.execute = bindExecute(worker);
  worker.on = bindOn(worker);

  return worker;
};

module.exports = {
  createWorker,
  registerHandler
};
