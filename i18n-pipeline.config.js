import path from 'node:path';

const uiRoot = path.resolve('/absolute/path/to/ui-project');

export default {
  projectRoot: uiRoot,
  cliConfigPath: path.resolve('./i18next-cli.config.js'),
  cliOutputFile: path.resolve('./.output/en-US/translation.json'),
  outputMatrixFile: path.resolve('./.output/matrix.json'),
  localeFilesByLanguage: {
    'en-US': path.join(uiRoot, 'public/locales/en-US/translation.json'),
    'ro-RO': path.join(uiRoot, 'public/locales/ro-RO/translation.json'),
    'ru-RU': path.join(uiRoot, 'public/locales/ru-RU/translation.json'),
  },
};
