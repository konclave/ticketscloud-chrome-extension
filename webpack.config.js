module.exports = {
  entry: {
    contentscript: `${__dirname}/src/scripts/contentscript.js`
  },
  output: {
    path: `${__dirname}/app/scripts`,
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: '/node_modules/',
        loader: 'babel-loader'
      }
    ]
  },
  devtools: 'source-map'
}
