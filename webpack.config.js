const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.firebaserc$/,
        loader: 'json-loader'
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyPlugin([
      { from: 'index.html', to: 'index.html' },
      { from: 'style.css', to: 'style.css' }
    ])
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  }
};
