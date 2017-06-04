const CopyWebpackPlugin = require('copy-webpack-plugin')
import * as webpack from 'webpack'
const DefinePlugin = require('webpack/lib/DefinePlugin')

const Merge = require('webpack-merge');
const CommonConfig = require('./webpack.common.ts');

function hasProcessFlag(flag) {
  return process.argv.join('').indexOf(flag) > -1
}

const coreBundles = {
  bootstrap: [
    'aurelia-bootstrapper-webpack',
    'aurelia-polyfills',
    'aurelia-pal',
    'aurelia-pal-browser',
    'bluebird'
  ],
  // these will be included in the 'aurelia' bundle (except for the above bootstrap packages)
  aurelia: [
    'aurelia-bootstrapper-webpack',
    'aurelia-binding',
    'aurelia-dependency-injection',
    'aurelia-event-aggregator',
    'aurelia-framework',
    'aurelia-history',
    'aurelia-history-browser',
    'aurelia-loader',
    'aurelia-loader-webpack',
    'aurelia-logging',
    'aurelia-logging-console',
    'aurelia-metadata',
    'aurelia-pal',
    'aurelia-pal-browser',
    'aurelia-path',
    'aurelia-polyfills',
    'aurelia-route-recognizer',
    'aurelia-router',
    'aurelia-task-queue',
    'aurelia-templating',
    'aurelia-templating-binding',
    'aurelia-templating-router',
    'aurelia-templating-resources'
  ]
}

module.exports = function(env) {
  return Merge(
    CommonConfig,
    {
      devtool: 'cheap-module-inline-source-map',
      output: {
        filename: '[name].bundle.js', // DevOrProd ?  : '[name].[chunkhash].bundle.js',
        sourceMapFilename: '[name].bundle.map', // DevOrProd ?  : '[name].[chunkhash].bundle.map',
        chunkFilename: '[id].chunk.js' //DevOrProd ?  : '[id].[chunkhash].chunk.js'
      },
      devServer: {
        port: parseInt(process.env.WEBPACK_PORT) || 9000,
        host: process.env.WEBPACK_HOST || 'localhost',
        historyApiFallback: true,
        watchOptions: {
          aggregateTimeout: 300,
          poll: 1000
        }
      },
      plugins: [
        new DefinePlugin({
          '__DEV__': true,
          'ENV': JSON.stringify(process.env.NODE_ENV || process.env.ENV || 'development'),
          'HMR': hasProcessFlag('hot') || !!process.env.WEBPACK_HMR,
          'process.env': {
            'ENV': JSON.stringify(process.env.NODE_ENV || process.env.ENV || 'development'),
            'NODE_ENV': JSON.stringify(process.env.NODE_ENV || process.env.ENV || 'development'),
            'HMR': hasProcessFlag('hot') || !!process.env.WEBPACK_HMR,
            'WEBPACK_HOST': JSON.stringify(parseInt(process.env.WEBPACK_PORT) || 9000),
            'WEBPACK_PORT': JSON.stringify(process.env.WEBPACK_HOST || 'localhost')
          }
        }),
        new webpack.optimize.CommonsChunkPlugin(
          {
            name: [
              //firstChunk,
              'aurelia-bootstrap',
              ...Object.keys({
                'app': ['./src/main' /* this is filled by the aurelia-webpack-plugin */],
                'aurelia-bootstrap': coreBundles.bootstrap,
                'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
              } || {}).filter(entry => entry !== /*appChunkName*/'app' && entry !== /*firstChunk*/'aurelia-bootstrap')
            ].reverse()
          }
        ),
        new CopyWebpackPlugin([{ from: 'favicon.ico', to: 'favicon.ico' }], {}),
      ]
    }
  )
}
