import { dynamicTemplateKeysPlugin } from '../src/i18nextCliDynamicPlugin.js';

export default {
  locales: ['en-US'],
  extract: {
    input: ['fixtures/src/i18n-usage-sample.tsx'],
    output: 'fixtures/.cli-output/{{language}}/{{namespace}}.json',
    defaultNS: 'translation',
    keySeparator: '.',
    sort: true,
  },
  plugins: [dynamicTemplateKeysPlugin()],
};
