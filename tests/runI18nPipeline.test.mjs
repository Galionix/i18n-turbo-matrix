import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runI18nPipeline } from '../src/runI18nPipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('runI18nPipeline extracts and writes matrix', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const outFile = path.resolve(projectRoot, 'fixtures/.cli-output/matrix.json');
  fs.rmSync(outFile, { force: true });

  const result = runI18nPipeline({
    projectRoot,
    cliConfigPath: path.resolve(projectRoot, 'fixtures/i18next-cli.fixture.config.js'),
    cliOutputFile: path.resolve(projectRoot, 'fixtures/.cli-output/en-US/translation.json'),
    outputMatrixFile: outFile,
    localeFilesByLanguage: {
      'en-US': path.resolve(projectRoot, 'fixtures/locales/en-US/translation.json'),
      'ro-RO': path.resolve(projectRoot, 'fixtures/locales/ro-RO/translation.json'),
      'ru-RU': path.resolve(projectRoot, 'fixtures/locales/ru-RU/translation.json'),
    },
  });

  assert.equal(fs.existsSync(outFile), true);
  assert.equal(result.extractedKeys.includes('settings.key1'), true);
  assert.equal(result.extractedKeys.includes('settings.key2'), true);
  assert.equal(result.extractedKeys.includes('user.value1'), true);

  const saved = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  assert.deepEqual(saved['settings.key1'], {
    'en-US': 'Settings key1 EN',
    'ro-RO': 'Setări key1 RO',
    'ru-RU': 'Настройки key1 RU',
  });
});
