import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { buildTranslationMatrix } from './buildTranslationMatrix.js';
import { extractKeysFromCliJson } from './cliOutputAdapter.js';

export const runI18nPipeline = (options) => {
  const projectRoot = path.resolve(options.projectRoot);
  const cliConfigPath = path.resolve(options.cliConfigPath);
  const cliOutputFile = path.resolve(options.cliOutputFile);
  const outputMatrixFile = path.resolve(options.outputMatrixFile);
  const localeFilesByLanguage = Object.fromEntries(
    Object.entries(options.localeFilesByLanguage).map(([lang, file]) => [lang, path.resolve(file)]),
  );
  const languages = Object.keys(localeFilesByLanguage);

  execFileSync('npx', ['--yes', 'i18next-cli@latest', 'extract', '--config', cliConfigPath, '--quiet'], {
    cwd: projectRoot,
    stdio: 'pipe',
  });

  const raw = fs.readFileSync(cliOutputFile, 'utf8');
  const extractedKeys = extractKeysFromCliJson(JSON.parse(raw));
  const fullMatrix = buildTranslationMatrix(localeFilesByLanguage);

  const filteredMatrix = {};
  extractedKeys.forEach((key) => {
    const row = fullMatrix[key] ?? {};
    filteredMatrix[key] = {};
    languages.forEach((lang) => {
      filteredMatrix[key][lang] = row[lang] ?? '';
    });
  });

  fs.mkdirSync(path.dirname(outputMatrixFile), { recursive: true });
  fs.writeFileSync(outputMatrixFile, JSON.stringify(filteredMatrix, null, 2), 'utf8');

  return { extractedKeys, matrix: filteredMatrix, outputMatrixFile };
};
