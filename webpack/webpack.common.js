const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const  resourcesPaths = {
  'Heco': '/',
  'eth': '/eth/',
  'test': '/'
}

module.exports = {
  entry: [path.resolve(__dirname, '../src/')],

  output: {
    filename: 'static/scripts/[name].[hash:8].bundle.js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: resourcesPaths[process.env.NODE_ENV || 'test']
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-dom': '@hot-loader/react-dom',
      '@': path.resolve(__dirname, '../src/')
    }
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
      environment: process.env.NODE_ENV || 'test',
      publicPathUse: resourcesPaths[process.env.NODE_ENV || 'test'] + 'publicP.js'
    })
  ],

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      // {
      //   test: /\.jsx?$/,
      //   include: /src/,
      //   enforce: 'pre',
      //   loader: 'eslint-loader'
      // },
      {
        type: 'javascript/auto',
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 1000,
          name: 'static/images/[name].[hash:8].[ext]'
        }
      },
      {
        test: /\.(eot|ttf|woff)$/,
        loader: 'file-loader',
        options: {
          name: 'static/fonts/[name].[hash:8].[ext]'
        }
      }
    ]
  }
};
