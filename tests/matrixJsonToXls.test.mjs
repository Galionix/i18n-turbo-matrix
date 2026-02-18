import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { convertMatrixJsonToXls } from '../src/matrixJsonToXls.js';
import { saveTranslationMatrix } from '../src/buildTranslationMatrix.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('convertMatrixJsonToXls writes xls html file', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-pipeline-xls-'));
  const input = path.join(tempDir, 'matrix.json');
  const output = path.join(tempDir, 'translations.xls');
  const base = path.resolve(projectRoot, 'fixtures/locales');
  saveTranslationMatrix(input, {
    'en-US': path.join(base, 'en-US/translation.json'),
    'ro-RO': path.join(base, 'ro-RO/translation.json'),
    'ru-RU': path.join(base, 'ru-RU/translation.json'),
  });

  convertMatrixJsonToXls(input, output);
  assert.equal(fs.existsSync(output), true);
  const content = fs.readFileSync(output, 'utf8');
  assert.equal(content.includes('<table'), true);
  assert.equal(content.includes('settings.key1'), true);
});
