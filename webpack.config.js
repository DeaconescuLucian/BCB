const path = require('path');

module.exports = {
  entry: './src/index.jsx', // Entry point of your React application
  output: {
    filename: 'bundle.js', // Output bundle file
    path: path.resolve(__dirname, 'public') // Output directory to `public`
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Apply babel-loader to .js files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.less$/, // Apply loaders to .less files
        use: [
          'style-loader', // Injects styles into the DOM
          'css-loader',   // Translates CSS into CommonJS
          'less-loader'   // Compiles LESS to CSS
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'] // Resolve these extensions
  },
  mode: 'development' // Set mode to 'development' or 'production'
};
