module.exports = {
  entry: {
    contentscript: `${__dirname}/src/scripts/contentscript.js`,
    popup: `${__dirname}/src/scripts/popup.js`
  },
  output: {
    path: `${__dirname}/app/scripts`,
    filename: '[name].js'
  },
  resolve: {
    modulesDirectories: ['src/scripts', 'src/styles'],
    extensions: ['', '.js', '.css']
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: '/node_modules/',
        loader: 'babel-loader'
      },
      {
          test: /\.css$/,
          loader: 'style-loader!css-loader'
      }
    ]
  },
  devtools: 'source-map'
};
