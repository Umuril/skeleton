/// <reference path="./node_modules/@types/node/index.d.ts" />
/**
 * To learn more about how to use Easy Webpack
 * Take a look at the README here: https://github.com/easy-webpack/core
 **/
import { generateConfig, get, stripMetadata, EasyWebpackConfig } from '@easy-webpack/core';
import * as path from 'path';

import * as envProd from '@easy-webpack/config-env-production';
import * as envDev from '@easy-webpack/config-env-development';
import * as aurelia from '@easy-webpack/config-aurelia';
import * as typescript from '@easy-webpack/config-typescript';
import * as html from '@easy-webpack/config-html';
import * as css from '@easy-webpack/config-css';
import * as fontAndImages from '@easy-webpack/config-fonts-and-images';
import * as globalBluebird from '@easy-webpack/config-global-bluebird';
import * as globalJquery from '@easy-webpack/config-global-jquery';
import * as generateIndexHtml from '@easy-webpack/config-generate-index-html';
import * as commonChunksOptimize from '@easy-webpack/config-common-chunks-simple';
import * as copyFiles from '@easy-webpack/config-copy-files';
import * as uglify from '@easy-webpack/config-uglify';
import * as generateCoverage from '@easy-webpack/config-test-coverage-istanbul';

import * as AureliaWebpackPlugin from 'aurelia-webpack-plugin';
import { TsConfigPathsPlugin, CheckerPlugin } from 'awesome-typescript-loader';
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackMd5Hash = require('webpack-md5-hash')
const DefinePlugin = require('webpack/lib/DefinePlugin')
import * as webpack from 'webpack'
const CopyWebpackPlugin = require('copy-webpack-plugin')

const ENV: 'development' | 'production' | 'test' = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() || (process.env.NODE_ENV = 'development');

// basic configuration:
const title = 'Aurelia Navigation Skeleton';
const baseUrl = '/';
const rootDir = path.resolve();
const srcDir = path.resolve('src');
const outDir = path.resolve('dist');

const allOptions = { root: rootDir, src: srcDir, title: title, baseUrl: baseUrl };
const options = ENV !== 'test' ? {} : { options: { doTypeCheck: false, sourceMap: false, inlineSourceMap: true, inlineSources: true } };

function hasProcessFlag(flag) {
  return process.argv.join('').indexOf(flag) > -1
}


let filename = 'styles.css', allChunks = true, sourceMap = false;
let extractText: any = undefined, resolveRelativeUrl = undefined, additionalLoaders = [], test = /\.css$/i
const loaders = ['style-loader', `css-loader${sourceMap ? '?sourceMap' : ''}`]

if (resolveRelativeUrl) {
  loaders.push(`resolve-url-loader${sourceMap ? '?sourceMap' : ''}`)
  sourceMap = true // source maps need to be on for this
}

if (additionalLoaders) {
  loaders.push(...additionalLoaders)
}

const extractCss = extractText !== false
const providedInstance = extractText instanceof ExtractTextPlugin
const extractTextInstances: Map<string, any> = new Map()

if (!providedInstance) {
  if (extractCss) {
    extractText = extractTextInstances.get(filename)
    if (!extractText) {
      extractText = new ExtractTextPlugin(extractText instanceof Object ? extractText : { filename, allChunks })
      extractTextInstances.set(filename, extractText)
    }
  } else {
    extractText = null
  }
}

let minify = ENV === 'production', overrideOptions = {};

const DefaultHtmlLoaderOptions = {
  htmlLoader: {
    minimize: true,
    removeAttributeQuotes: false,
    caseSensitive: true,
    // customAttrSurround: [
    //   [/#/, /(?:)/],
    //   [/\*/, /(?:)/],
    //   [/\[?\(?/, /(?:)/]
    // ],
    // customAttrAssign: [/\)?\]?=/]
  }
} as any

let DevOrProd = ENV === 'test' || ENV === 'development'

let DevOrTestDevTool = ENV !== 'test' ? 'cheap-module-inline-source-map' : 'inline-source-map';

let DevOrTest = ENV === 'production' || ENV === 'development';

let derupe = false, loaderOptions = {};

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

let metadata = {
  title,
  baseUrl,
  rootDir,
  srcDir,
  extractTextInstances,
  port: parseInt(process.env.WEBPACK_PORT) || 9000,
  host: process.env.WEBPACK_HOST || 'localhost',
  ENV: process.env.NODE_ENV || process.env.ENV || 'development',
  HMR: hasProcessFlag('hot') || !!process.env.WEBPACK_HMR,
}


// Need to solve undefined
let devServer = DevOrProd ? {
  port: metadata.port,
  host: metadata.host,
  historyApiFallback: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  }
} : undefined;

let appChunkName = 'app', firstChunk = 'aurelia-bootstrap';

let patterns = [{ from: 'favicon.ico', to: 'favicon.ico' }];

/**
 * Main Webpack Configuration
 */
let config = generateConfig(
  {
    devtool: DevOrProd ? DevOrTestDevTool : 'source-map',
    entry: {
      'app': ['./src/main' /* this is filled by the aurelia-webpack-plugin */],
      'aurelia-bootstrap': coreBundles.bootstrap,
      'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
    },
    output: {
      path: outDir,
      filename: DevOrProd ? '[name].bundle.js' : '[name].[chunkhash].bundle.js',
      sourceMapFilename: DevOrProd ? '[name].bundle.map' : '[name].[chunkhash].bundle.map',
      chunkFilename: DevOrProd ? '[id].chunk.js' : '[id].[chunkhash].chunk.js'
    },
    resolve: {
      modules: [
        srcDir,
        'node_modules'
      ],
      extensions: ['.js', '.tsx', '.ts']
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          loader: 'html-loader',
          exclude: null || (rootDir ? [path.join(rootDir, 'index.html')] : [])
        },
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader',
          exclude: null || (rootDir ? [path.join(rootDir, 'node_modules')] : []),
          options
        },
        {
          test,
          use: extractCss ?
            extractText.extract({ fallback: loaders[0], use: loaders.slice(1) }) :
            loaders
        },
        // embed small images and fonts as Data Urls and larger ones as files
        { test: /\.(png|gif|jpg|cur)$/, loader: 'url-loader', query: { limit: 8192 } },
        { test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader', query: { limit: 10000, mimetype: 'application/font-woff2' } },
        { test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader', query: { limit: 10000, mimetype: 'application/font-woff' } },
        { test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
        // ! DevOrTest config-test-coverage-istanbul
        /*{
          test: /\.(js|ts)$/,
          loader: 'sourcemap-istanbul-instrumenter-loader',
          query: {
            esModules: true
          },
          enforce: 'post',
          include: include || metadata.src,
          exclude: exclude || (metadata.root ? [path.join(metadata.root, 'node_modules')] : []),
        }*/
      ]
    },
    devServer,
    plugins: [
      new AureliaWebpackPlugin(allOptions),
      /*, Need to solve
      ...!DevOrProd && new WebpackMd5Hash(),
      ...!DevOrProd && new (webpack as any).LoaderOptionsPlugin({
        options: Object.assign({}, DefaultHtmlLoaderOptions, loaderOptions)
      }),*/
      new TsConfigPathsPlugin(options),
      new CheckerPlugin(),
      extractText,
      new HtmlWebpackPlugin(
        Object.assign(
          {
            template: 'index.html',
            chunksSortMode: 'dependency',
            minify: minify ? {
              removeComments: true,
              collapseWhitespace: true
            } : undefined,
            metadata: get(this, 'metadata', {})
          },
          overrideOptions
        )
      ),
      DevOrProd ? new DefinePlugin({
        '__DEV__': true,
        'ENV': JSON.stringify(metadata.ENV),
        'HMR': metadata.HMR,
        'process.env': {
          'ENV': JSON.stringify(metadata.ENV),
          'NODE_ENV': JSON.stringify(metadata.ENV),
          'HMR': metadata.HMR,
          'WEBPACK_HOST': JSON.stringify(metadata.host),
          'WEBPACK_PORT': JSON.stringify(metadata.port)
        }
      }) : new webpack.DefinePlugin({
        '__DEV__': false,
        'ENV': JSON.stringify(metadata.ENV),
        'HMR': metadata.HMR,
        'process.env': {
          'ENV': JSON.stringify(metadata.ENV),
          'NODE_ENV': JSON.stringify(metadata.ENV),
          'HMR': metadata.HMR,
        }
      }),
      // DevOrTest
      new webpack.optimize.CommonsChunkPlugin(
        {
          name: [
            firstChunk,
            ...Object.keys({
              'app': ['./src/main' /* this is filled by the aurelia-webpack-plugin */],
              'aurelia-bootstrap': coreBundles.bootstrap,
              'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
            } || {}).filter(entry => entry !== appChunkName && entry !== firstChunk)
          ].reverse()
        }
      ),
      // DevOrTest
      new CopyWebpackPlugin(patterns, {})
    ],
    metadata: {
      title,
      baseUrl,
      rootDir,
      srcDir,
      extractTextInstances
    }
  },

  /**
   * Don't be afraid, you can put bits of standard Webpack configuration here
   * (or at the end, after the last parameter, so it won't get overwritten by the presets)
   * Because that's all easy-webpack configs are - snippets of premade, maintained configuration parts!
   *
   * For Webpack docs, see: https://webpack.js.org/configuration/
   */

  ENV === 'production' ?
    uglify({ debug: false, mangle: { except: ['cb', '__webpack_require__'] } }) : {}
);

module.exports = stripMetadata(config);
