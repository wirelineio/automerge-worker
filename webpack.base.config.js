//
// Copyright 2018 Wireline, Inc.
//

const path = require('path');

module.exports = {
  target: 'web',

  mode: process.env.NODE_ENV ? process.env.NODE_ENV : 'development',

  stats: 'errors-only',

  devtool: process.env.NODE_ENV !== 'production' && '#source-map',

  resolve: {
    extensions: ['.js'],
    modules: ['node_modules']
  },

  entry: {
    'automerge.worker': ['./src/automerge.worker']
  },

  module: {
    rules: [
      // js/mjs
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },

      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
    ]
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  }
};
