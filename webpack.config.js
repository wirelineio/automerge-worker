//
// Copyright 2018 Wireline, Inc.
//

const path = require('path');
const webpack = require('webpack');

const base = require('./webpack.base.config');

module.exports = {
  ...base,

  target: 'node',

  output: {
    path: path.resolve(__dirname, 'dist/cjs'),
    filename: '[name].js',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.browser': JSON.stringify(true)
    })
  ]
};
