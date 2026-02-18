import { dynamicTemplateKeysPlugin } from './src/i18nextCliDynamicPlugin.js';

export default {
  locales: ['en-US'],
  extract: {
    input: ['src/**/*.{ts,tsx,js,jsx}'],
    ignore: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      'src/test/**',
      'src/i18n/**',
      'dist/**',
      'node_modules/**'
    ],
    output: '.output/{{language}}/{{namespace}}.json',
    defaultNS: 'translation',
    keySeparator: '.',
    sort: true,
  },
  plugins: [dynamicTemplateKeysPlugin()],
};
