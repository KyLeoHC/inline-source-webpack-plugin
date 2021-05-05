const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineSourceWebpackPlugin = require('../index');

module.exports = {
  entry: {
    index: './demo/src/index.js',
    bundle: './demo/src/bundle.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/inline-source-webpack-plugin/demo/dist/',
    filename: '[name].[contenthash].js'
  },
  optimization: {
    runtimeChunk: 'single'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './demo/src/index.html',
      inject: 'body',
      chunks: ['runtime', 'index']
    }),
    new InlineSourceWebpackPlugin({
      compress: true,
      rootpath: './demo/src',
      noAssetMatch: 'warn'
    })
  ],
  mode: 'production'
};
