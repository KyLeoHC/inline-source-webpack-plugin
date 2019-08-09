const path = require('path');
const rimraf = require('rimraf');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineSourceWebpackPlugin = require('../index.js');

const OUTPUT_DIR = path.resolve(__dirname, '../dist');
const defaultTemplateFilename = 'index.html';
const baseWebpackConfig = {
  entry: {
    index: path.join(__dirname, 'fixtures/index.js'),
    bundle: path.join(__dirname, 'fixtures/bundle.js')
  },
  output: {
    path: OUTPUT_DIR,
    publicPath: '/inline-source-webpack-plugin/dist/',
    filename: '[name].[contenthash].js'
  },
  optimization: {
    namedChunks: true,
    runtimeChunk: 'single'
  },
  mode: 'production'
};
const defaultWebpackConfig = Object.assign({}, baseWebpackConfig, {
  plugins: [
    new HtmlWebpackPlugin({
      filename: defaultTemplateFilename,
      template: path.join(__dirname, `fixtures/${defaultTemplateFilename}`),
      inject: 'body',
      chunks: ['runtime', 'index']
    }),
    new InlineSourceWebpackPlugin({
      compress: true,
      rootpath: './test/fixtures',
      noAssetMatch: 1
    })
  ]
});

function testInlineSourceWebpackPlugin(
  {
    webpackConfig = Object.assign({}, defaultWebpackConfig),
    outputFile = defaultTemplateFilename,
    done = () => {
    },
    expectOutputFiles,
    expectDeleteOutputFiles,
    expectResults,
    hasErrors,
    hasWarnings
  } = {}
) {
  webpack(webpackConfig, (error, stats) => {
    expect(error).toBeFalsy();
    const compilationErrors = (stats.compilation.errors || []).join('\n');
    if (hasErrors) {
      expect(compilationErrors).not.toBe('');
    } else {
      expect(compilationErrors).toBe('');
    }
    const compilationWarnings = (stats.compilation.warnings || []).join('\n');
    if (hasWarnings) {
      expect(compilationWarnings).not.toBe('');
    } else {
      expect(compilationWarnings).toBe('');
    }
    const assets = Object.keys(stats.compilation.assets);
    if (expectOutputFiles && expectOutputFiles.length) {
      // without 'inline-asset-delete' option
      expect(
        expectOutputFiles.every(fileRegExp => assets.some(item => fileRegExp.test(item)))
      ).toBeTruthy();
    }
    if (expectDeleteOutputFiles && expectDeleteOutputFiles.length) {
      // with 'inline-asset-delete' option
      expect(
        expectDeleteOutputFiles.every(fileRegExp => assets.every(item => !fileRegExp.test(item)))
      ).toBeTruthy();
    }
    if (expectResults && expectResults.length) {
      const content = stats.compilation.assets[outputFile].source();
      expect(
        expectResults.every(result => {
          if (result instanceof RegExp) {
            return result.test(content);
          } else {
            return content.indexOf(result) > -1;
          }
        })
      ).toBeTruthy();
    }
    done();
  });
}

describe('InlineSourceWebpackPlugin', () => {
  beforeEach(done => {
    rimraf(OUTPUT_DIR, done);
  });

  test('should embed target files and delete target assets', done => {
    testInlineSourceWebpackPlugin({
      done,
      expectOutputFiles: [/index\.html$/, /index\.\w+\.js$/],
      expectDeleteOutputFiles: [/runtime\.\w+\.js$/, /bundle\.\w+\.js$/],
      expectResults: [
        // inline.css
        `<style>.container{border:1px solid #ff2c58}</style>`,
        // inline.js
        `<script>function Person(){}Person.prototype.sayHello=function(){console.log("[inline]:","hello world!")},(new Person).sayHello();</script>`,
        // webpack runtime file
        `window.webpackJsonp=window.webpackJsonp||[]`,
        // bundle.js
        `console.log("This file is build by webpack.But InlineSourceWebpackPlugin will embed it into html file.")`,
        // appended by html-webpack-plugin
        /<script src="\/inline-source-webpack-plugin\/dist\/index\.\w+\.js"><\/script>/
      ]
    });
  });


  test('should ignore while "noAssetMatch" option is set to "0" or "none"', done => {
    const webpackConfig = Object.assign({}, baseWebpackConfig, {
      plugins: [
        new HtmlWebpackPlugin({
          filename: defaultTemplateFilename,
          template: path.join(__dirname, `fixtures/assetNotFound.html`),
          inject: 'body',
          chunks: ['runtime', 'index']
        }),
        new InlineSourceWebpackPlugin({
          compress: true,
          rootpath: './test/fixtures',
          noAssetMatch: 'none'
        })
      ]
    });
    testInlineSourceWebpackPlugin({
      webpackConfig,
      done,
      expectOutputFiles: [/index\.html$/, /index\.\w+\.js$/, /runtime\.\w+\.js$/, /bundle\.\w+\.js$/],
      expectResults: [`<script inline inline-asset="bundle-not-exist\\.\\w+\\.js$" inline-asset-delete></script>`]
    });
  });

  test('should throw warnings and replace target while "noAssetMatch" option is set to "1" or "warn"', done => {
    const webpackConfig = Object.assign({}, baseWebpackConfig, {
      plugins: [
        new HtmlWebpackPlugin({
          filename: defaultTemplateFilename,
          template: path.join(__dirname, `fixtures/assetNotFound.html`),
          inject: 'body',
          chunks: ['runtime', 'index']
        }),
        new InlineSourceWebpackPlugin({
          compress: true,
          rootpath: './test/fixtures',
          noAssetMatch: 'warn',
          noAssetMatchReplace: '<!--inline-source-webpack-plugin-->'
        })
      ]
    });
    testInlineSourceWebpackPlugin({
      webpackConfig,
      done,
      expectOutputFiles: [/index\.html$/, /index\.\w+\.js$/, /runtime\.\w+\.js$/, /bundle\.\w+\.js$/],
      expectResults: ['<!--inline-source-webpack-plugin-->'],
      hasWarnings: true
    });
  });

  test('should throw error and replace target while "noAssetMatch" option is set to "2" or "error"', done => {
    const webpackConfig = Object.assign({}, baseWebpackConfig, {
      plugins: [
        new HtmlWebpackPlugin({
          filename: defaultTemplateFilename,
          template: path.join(__dirname, `fixtures/assetNotFound.html`),
          inject: 'body',
          chunks: ['runtime', 'index']
        }),
        new InlineSourceWebpackPlugin({
          compress: true,
          rootpath: './test/fixtures',
          noAssetMatch: 'error',
          noAssetMatchReplace: '<!--inline-source-webpack-plugin-->'
        })
      ]
    });
    testInlineSourceWebpackPlugin({
      webpackConfig,
      done,
      expectOutputFiles: [/index\.html$/, /index\.\w+\.js$/, /runtime\.\w+\.js$/, /bundle\.\w+\.js$/],
      expectResults: ['<!--inline-source-webpack-plugin-->'],
      hasErrors: true
    });
  });
});
