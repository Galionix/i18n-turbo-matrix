#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runI18nPipeline } from '../src/runI18nPipeline.js';
import { convertMatrixJsonToXls } from '../src/matrixJsonToXls.js';

if (process.argv[2] === 'xls') {
  const inputPath = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.resolve(process.cwd(), 'matrix.json');
  const outputPath = process.argv[4]
    ? path.resolve(process.argv[4])
    : path.resolve(process.cwd(), 'translations.xls');
  convertMatrixJsonToXls(inputPath, outputPath);
  process.stdout.write(`${outputPath}\n`);
  process.exit(0);
}

const configPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), 'i18n-pipeline.config.js');

if (!fs.existsSync(configPath)) {
  const template = `import path from 'node:path';

const projectRoot = path.resolve('/absolute/path/to/your-ui-project');

export default {
  projectRoot,
  cliConfigPath: path.resolve('./i18next-cli.config.js'),
  cliOutputFile: path.resolve('./.output/en-US/translation.json'),
  outputMatrixFile: path.resolve('./.output/matrix.json'),
  localeFilesByLanguage: {
    'en-US': path.join(projectRoot, 'public/locales/en-US/translation.json'),
    'ro-RO': path.join(projectRoot, 'public/locales/ro-RO/translation.json'),
    'ru-RU': path.join(projectRoot, 'public/locales/ru-RU/translation.json'),
  },
};
`;
  fs.writeFileSync(configPath, template, 'utf8');
  process.stderr.write(`Config template created: ${configPath}\n`);
  process.stderr.write('Edit this file with your project paths, then run the command again.\n');
  process.exit(1);
}

const mod = await import(pathToFileURL(configPath).href);
const config = mod.default ?? mod;
const result = runI18nPipeline(config);
process.stdout.write(`${result.outputMatrixFile}\n`);
