import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTranslationMatrix } from '../src/buildTranslationMatrix.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('buildTranslationMatrix keeps nested row format and all language columns', () => {
  const base = path.resolve(__dirname, '..', 'fixtures', 'locales');
  const matrix = buildTranslationMatrix({
    'en-US': path.join(base, 'en-US', 'translation.json'),
    'ro-RO': path.join(base, 'ro-RO', 'translation.json'),
    'ru-RU': path.join(base, 'ru-RU', 'translation.json'),
  });

  assert.deepEqual(matrix['auth.login.title'], {
    'en-US': 'Login EN',
    'ro-RO': 'Autentificare RO',
    'ru-RU': 'Вход RU',
  });
});
