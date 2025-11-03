import path from 'path';
import { fileURLToPath } from 'url';

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
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
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
