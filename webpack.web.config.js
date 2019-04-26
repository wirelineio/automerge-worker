//
// Copyright 2018 Wireline, Inc.
//

const path = require('path');
const webpack = require('webpack');

const base = require('./webpack.base.config');

module.exports = [

  // Library
  {
    ...base,

    entry: {
      index: ['./src/index']
    },

    output: {
      path: path.resolve(__dirname, 'dist/umd'),
      filename: '[name].js',
      libraryTarget: 'commonjs'
    },

    plugins: [
      new webpack.NormalModuleReplacementPlugin(
        /create-worker/,
        './create-webworker.js'
      )
    ]
  },

  // Web worker
  {
    ...base,

    output: {
      path: path.resolve(__dirname, 'dist/umd'),
      filename: '[name].js',
    },

    plugins: [
      new webpack.NormalModuleReplacementPlugin(
        /create-worker/,
        './create-webworker.js'
      )
    ]
  }
];
