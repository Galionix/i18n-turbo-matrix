import fs from 'node:fs';
import path from 'node:path';

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const flattenObject = (value, prefix = '', acc = {}) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextPrefix = prefix ? `${prefix}.${index}` : String(index);
      flattenObject(item, nextPrefix, acc);
    });
    return acc;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, nested]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flattenObject(nested, nextPrefix, acc);
    });
    return acc;
  }

  if (prefix) {
    acc[prefix] = value == null ? '' : String(value);
  }
  return acc;
};

export const buildTranslationMatrix = (filesByLanguage) => {
  const matrix = {};
  const langs = Object.keys(filesByLanguage);

  Object.entries(filesByLanguage).forEach(([lang, file]) => {
    const filePath = path.resolve(file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const flattened = flattenObject(parsed);

    Object.entries(flattened).forEach(([key, value]) => {
      if (!matrix[key]) matrix[key] = {};
      matrix[key][lang] = value;
    });
  });

  Object.values(matrix).forEach((row) => {
    langs.forEach((lang) => {
      if (!(lang in row)) row[lang] = '';
    });
  });

  return matrix;
};

export const saveTranslationMatrix = (outputPath, filesByLanguage) => {
  const matrix = buildTranslationMatrix(filesByLanguage);
  const absoluteOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, JSON.stringify(matrix, null, 2), 'utf8');
  return matrix;
};
