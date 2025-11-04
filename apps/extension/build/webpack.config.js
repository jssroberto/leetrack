import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(__dirname, '../../..');

export default {
  mode: 'production',
  entry: {
    'background/service-worker': path.join(extDir, 'src/background/service-worker.ts'),
    'content/submission-tracker': path.join(extDir, 'src/content/submission-tracker.ts'),
    'popup/popup': path.join(extDir, 'src/popup/popup.ts'),
  },
  output: {
    path: path.join(extDir, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(extDir, 'manifest.json'), to: 'manifest.json' },
        { from: path.join(extDir, 'src/popup/popup.html'), to: 'popup/popup.html' },
        { from: path.join(extDir, 'src/assets'), to: 'assets' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.css'],
    alias: {
      '@extension': path.join(extDir, 'src'),
      '@leetrack/shared-types': path.join(rootDir, 'libs/shared/types/src'),
    },
  },
  devtool: 'source-map',
  target: 'web',
  performance: {
    hints: false,
  },
};
