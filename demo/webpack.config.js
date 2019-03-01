const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineSourceWebpackPlugin = require('../index');

module.exports = {
  entry: {
    index: './src/index',
    bundle: './src/bundle'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/inline-source-webpack-plugin/demo/dist/',
    filename: '[name].[contenthash].js'
  },
  optimization: {
    namedChunks: true,
    runtimeChunk: 'single'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      inject: 'body',
      chunks: ['runtime', 'index']
    }),
    new InlineSourceWebpackPlugin({
      compress: true,
      rootpath: './src',
      noAssetMatch: 1
    })
  ],
  mode: 'production'
};
