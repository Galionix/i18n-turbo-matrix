# i18n Turbo Matrix

The i18n tool your spreadsheet loves and your deadline tolerates.

`i18n-turbo-matrix` is a CLI that:
1. extracts UI translation keys via `i18next-cli`
2. builds a language matrix in JSON format
3. exports that matrix to `.xls` for human-friendly translation workflows

No mystical dashboards. No enterprise wizardry. Just a focused pipeline that does the job.

## Why this package

- built for real-world i18n codebases with dynamic key patterns
- matrix format is predictable: `key.with.separator -> { langA, langB, ... }`
- missing translations are auto-filled with empty strings
- XLS export works with common spreadsheet tools
- can run in CI or locally with one command

## How it actually works (no magic, just scripts)

When you run the pipeline, it does this:

1. Calls `i18next-cli` to extract keys from code.
2. Reads extracted keys from generated JSON.
3. Reads your real locale JSON files (`en-US`, `ro-RO`, `ru-RU`, etc.).
4. Builds matrix: `dot.key -> { lang1: value, lang2: value }`.
5. Fills missing translations with empty strings.
6. Saves `matrix.json`.

Important detail: extraction currently runs via this runtime command:

```js
execFileSync('npx', ['--yes', 'i18next-cli@latest', 'extract', '--config', cliConfigPath, '--quiet'], {
  cwd: projectRoot,
  stdio: 'pipe',
});
```

So yes, this package depends on `npx` + network access for extraction.

## Runtime requirements

- Node.js (modern LTS recommended)
- `npx` available
- internet access (because `i18next-cli@latest` is fetched at runtime)

## Honest tradeoffs (a.k.a. where this can hurt)

- **Non-deterministic extraction version**  
  Using `@latest` means behavior can change between runs over time.
- **Needs network**  
  Offline environment = sad extractor.
- **Not “full AI parser”**  
  Very dynamic key construction can still be tricky.
- **Intermediate files are real files**  
  This pipeline writes artifacts to disk; it is not in-memory wizardry.

## Quick start (local repo mode)

```bash
cd i18n-pipeline
node ./bin/i18n-pipeline.js ./i18n-pipeline.config.js
```

Output:
`./.output/matrix.json`

If config file is missing, the CLI creates `i18n-pipeline.config.js` template and exits with a message telling you to edit it.

## Convert matrix JSON to XLS

```bash
cd i18n-pipeline
node ./bin/i18n-pipeline.js xls ./.output/matrix.json ./.output/translations.xls
```

Output:
`./.output/translations.xls`

## One-off run via npx

```bash
npx i18n-turbo-matrix ./i18n-pipeline.config.js
npx i18n-turbo-matrix xls ./matrix.json ./translations.xls
```

## Config contract

Your config should export:
- `projectRoot`
- `cliConfigPath`
- `cliOutputFile`
- `outputMatrixFile`
- `localeFilesByLanguage`

Example language map:

```js
localeFilesByLanguage: {
  'en-US': '/path/to/locales/en-US/translation.json',
  'ro-RO': '/path/to/locales/ro-RO/translation.json',
  'ru-RU': '/path/to/locales/ru-RU/translation.json',
}
```

## Humor-driven FAQ

Q: Why not add `i18next-cli` directly to dependencies and pin version?  
A: Great idea. Current mode favors convenience (`npx @latest`). Stability lovers should pin it.

Q: So this can break “by itself” one morning?  
A: In theory yes, if upstream changes. In practice: pin versions if your blood pressure matters.

Q: Does this guarantee 100% key extraction in all dynamic JS patterns?  
A: No tool can promise that without reading your mind. This package is pragmatic, not psychic.

Q: Why matrix first and XLS second?  
A: JSON matrix is diff-friendly and script-friendly. XLS is for humans and managers with color filters.

Q: Is it overkill for a tiny project with 12 keys?  
A: Absolutely. But it still works, and now your 12 keys have enterprise trauma.

Q: Can I run it offline?  
A: Not with current `npx @latest` extraction. For offline mode, pin and install extractor locally.

Q: Does it fix bad translations automatically?  
A: No. It is a pipeline, not a poet.

## Development

```bash
cd i18n-pipeline
npm test
```
