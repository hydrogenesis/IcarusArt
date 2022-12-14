const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',

  devtool: 'inline-source-map',

  module: {
    rules: [
      {
        test: /\.scss$/,
        include: /src/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          },
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true
              }
            }
          }
        ]
      },
      {
        test: /\.(css)$/,
        include: /node_modules/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },

  devServer: {
    inline: true,
    historyApiFallback: true,
    contentBase: './public',
    hot: true,
    overlay: {
      warnings: true,
      errors: true
    },
    port: 8044,
    proxy: {
      '/ai': {
        target: 'http://223.94.61.114:58080',
        pathRewrite: { '^/ai': '' },
        changeOrigin: true,
        secure: false
      },
      '/wallet': {
        target: 'https://cerebro.cortexlabs.ai/wallet',
        pathRewrite: { '^/wallet': '' },
        changeOrigin: true,
        secure: false
      },
      '/Creat': {
        target: 'http://223.94.61.114:50080',
        pathRewrite: { '^/Creat': '' },
        changeOrigin: true,
        secure: false
      }
    }
  }
});
