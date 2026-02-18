import fs from 'node:fs';
import path from 'node:path';

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const toCell = (value) => `<td>${escapeHtml(value)}</td>`;

export const buildXlsHtmlFromMatrix = (matrix) => {
  const keys = Object.keys(matrix).sort();
  const langs = Array.from(new Set(keys.flatMap((key) => Object.keys(matrix[key] ?? {})))).sort();

  const header = `<tr>${toCell('key')}${langs.map((lang) => toCell(lang)).join('')}</tr>`;
  const rows = keys
    .map((key) => {
      const row = matrix[key] ?? {};
      const values = langs.map((lang) => toCell(row[lang] ?? '')).join('');
      return `<tr>${toCell(key)}${values}</tr>`;
    })
    .join('\n');

  return [
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '</head>',
    '<body>',
    '<table border="1">',
    header,
    rows,
    '</table>',
    '</body>',
    '</html>',
  ].join('\n');
};

export const convertMatrixJsonToXls = (inputPath, outputPath) => {
  const inFile = path.resolve(inputPath);
  const outFile = path.resolve(outputPath);
  const matrix = JSON.parse(fs.readFileSync(inFile, 'utf8'));
  const html = buildXlsHtmlFromMatrix(matrix);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, 'utf8');
};
