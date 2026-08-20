const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    '01-auth-burst': path.resolve(__dirname, 'src/scenarios/01-auth-burst.test.ts'),
    '02-telegram-surge': path.resolve(__dirname, 'src/scenarios/02-telegram-surge.test.ts'),
    '03-crm-leads': path.resolve(__dirname, 'src/scenarios/03-crm-leads.test.ts'),
    '04-plan-limits': path.resolve(__dirname, 'src/scenarios/04-plan-limits.test.ts'),
    '05-massive-100node': path.resolve(__dirname, 'src/scenarios/05-massive-100node-flows.test.ts'),
    '06-broadcasts': path.resolve(__dirname, 'src/scenarios/06-broadcast-campaigns.test.ts'),
    '07-analytics': path.resolve(__dirname, 'src/scenarios/07-analytics-dashboards.test.ts'),
    '08-ai-generation': path.resolve(__dirname, 'src/scenarios/08-ai-generation-load.test.ts'),
    '09-support-chat': path.resolve(__dirname, 'src/scenarios/09-live-chat-support.test.ts'),
    '10-integrations': path.resolve(__dirname, 'src/scenarios/10-integrations-webhooks.test.ts'),
    'all-scenarios': path.resolve(__dirname, 'src/scenarios/all-scenarios.test.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@config': path.resolve(__dirname, 'src/config'),
      '@helpers': path.resolve(__dirname, 'src/helpers'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
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
  target: 'web',
  externals: /^(k6|https?\:\/\/.+)/,
  plugins: [
    new CleanWebpackPlugin(),
  ],
  stats: {
    colors: true,
  },
};
