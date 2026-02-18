import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const isScopeNode = (node) =>
  ts.isSourceFile(node) ||
  ts.isBlock(node) ||
  ts.isModuleBlock(node) ||
  ts.isCaseBlock(node) ||
  ts.isForStatement(node) ||
  ts.isForInStatement(node) ||
  ts.isForOfStatement(node) ||
  ts.isFunctionLike(node) ||
  ts.isCatchClause(node);

const stripQuotes = (value) => value.replace(/^['"]|['"]$/g, '');

const resolveImportPath = (fromFilePath, specifier) => {
  if (!specifier.startsWith('.')) return undefined;

  const basePath = path.resolve(path.dirname(fromFilePath), stripQuotes(specifier));
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
  ];

  return candidates.find((candidate) => {
    if (!fs.existsSync(candidate)) return false;
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
};

export const dynamicTemplateKeysPlugin = () => {
  const moduleCache = new Map();
  const exportCache = new Map();

  const parseModule = (modulePath) => {
    const normalizedPath = path.resolve(modulePath);
    const cached = moduleCache.get(normalizedPath);
    if (cached) return cached;

    if (!fs.existsSync(normalizedPath) || !fs.statSync(normalizedPath).isFile()) {
      return undefined;
    }

    const content = fs.readFileSync(normalizedPath, 'utf8');
    const extension = path.extname(normalizedPath);
    const kind =
      extension === '.tsx'
        ? ts.ScriptKind.TSX
        : extension === '.jsx'
          ? ts.ScriptKind.JSX
          : ts.ScriptKind.TS;

    const source = ts.createSourceFile(normalizedPath, content, ts.ScriptTarget.Latest, true, kind);
    moduleCache.set(normalizedPath, source);
    return source;
  };

  const getExportedConsts = (modulePath) => {
    const normalizedPath = path.resolve(modulePath);
    const cached = exportCache.get(normalizedPath);
    if (cached) return cached;

    const source = parseModule(normalizedPath);
    if (!source) {
      exportCache.set(normalizedPath, exports);
      return exports;
    }
    const exports = new Map();

    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      const hasExport = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
      if (!hasExport || !isConst) continue;

      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        exports.set(declaration.name.text, declaration.initializer);
      }
    }

    exportCache.set(normalizedPath, exports);
    return exports;
  };

  const extractKeysFromFile = (filePath) => {
    const sourceFile = parseModule(filePath);
    const scopes = [];
    const extractedKeys = new Set();

    const addBinding = (name, expression) => {
      scopes[scopes.length - 1].set(name, { expressions: [expression] });
    };

    const lookupBinding = (name) => {
      for (let i = scopes.length - 1; i >= 0; i -= 1) {
        const value = scopes[i].get(name);
        if (value) return value;
      }
      return undefined;
    };

    const merge = (...values) => Array.from(new Set(values.flat()));

    const combineTemplateParts = (parts) =>
      parts.reduce((acc, part) => {
        const next = [];
        for (const base of acc) {
          for (const suffix of part) {
            next.push(base + suffix);
          }
        }
        return Array.from(new Set(next));
      }, ['']);

    const resolveFromObjectProperty = (objectExpression, propertyName, seen) => {
      if (ts.isObjectLiteralExpression(objectExpression)) {
        for (const property of objectExpression.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const name = property.name;
          if (
            (ts.isIdentifier(name) && name.text === propertyName) ||
            (ts.isStringLiteral(name) && name.text === propertyName)
          ) {
            return resolveToStrings(property.initializer, seen);
          }
        }
        return [];
      }

      if (ts.isIdentifier(objectExpression)) {
        const binding = lookupBinding(objectExpression.text);
        if (!binding) return [];
        return merge(...binding.expressions.map((expr) => resolveFromObjectProperty(expr, propertyName, new Set(seen))));
      }

      return [];
    };

    const resolveToStrings = (expression, seen = new Set()) => {
      if (!expression) return [];

      if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
        return [expression.text];
      }

      if (ts.isParenthesizedExpression(expression)) {
        return resolveToStrings(expression.expression, seen);
      }

      if (
        ts.isAsExpression(expression) ||
        ts.isTypeAssertionExpression(expression) ||
        ts.isSatisfiesExpression(expression)
      ) {
        return resolveToStrings(expression.expression, seen);
      }

      if (ts.isTemplateExpression(expression)) {
        const parts = [[expression.head.text]];
        for (const span of expression.templateSpans) {
          const spanValues = resolveToStrings(span.expression, seen);
          if (spanValues.length === 0) return [];
          parts.push(spanValues, [span.literal.text]);
        }
        return combineTemplateParts(parts);
      }

      if (ts.isIdentifier(expression)) {
        if (seen.has(expression.text)) return [];
        const binding = lookupBinding(expression.text);
        if (!binding) return [];
        seen.add(expression.text);
        return merge(...binding.expressions.map((expr) => resolveToStrings(expr, new Set(seen))));
      }

      if (ts.isPropertyAccessExpression(expression)) {
        return resolveFromObjectProperty(expression.expression, expression.name.text, seen);
      }

      return [];
    };

    const resolveArrayElements = (expression) => {
      if (ts.isArrayLiteralExpression(expression)) {
        return expression.elements.filter(ts.isExpression);
      }

      if (ts.isIdentifier(expression)) {
        const binding = lookupBinding(expression.text);
        if (!binding) return [];
        return binding.expressions.flatMap((expr) => resolveArrayElements(expr));
      }

      return [];
    };

    const readJsxI18nKey = (attribute) => {
      if (!attribute.initializer) return [];
      if (ts.isStringLiteral(attribute.initializer)) return [attribute.initializer.text];

      if (ts.isJsxExpression(attribute.initializer)) {
        const expr = attribute.initializer.expression;
        if (!expr) return [];
        if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return [expr.text];
        if (ts.isTemplateExpression(expr)) return resolveToStrings(expr);
      }
      return [];
    };

    const isTFunctionCall = (node) => {
      if (ts.isIdentifier(node.expression) && node.expression.text === 't') {
        return true;
      }
      return (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'i18n' &&
        node.expression.name.text === 't'
      );
    };

    const visit = (node) => {
      let pushedScope = false;
      if (isScopeNode(node)) {
        scopes.push(new Map());
        pushedScope = true;
      }

      if (ts.isVariableStatement(node) && (node.declarationList.flags & ts.NodeFlags.Const) !== 0) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.initializer) {
            addBinding(declaration.name.text, declaration.initializer);
          }
        }
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.importClause) {
        const resolvedPath = resolveImportPath(sourceFile.fileName, node.moduleSpecifier.text);
        if (resolvedPath) {
          const exportedConsts = getExportedConsts(resolvedPath);
          const namedBindings = node.importClause.namedBindings;
          if (namedBindings && ts.isNamedImports(namedBindings)) {
            for (const importSpecifier of namedBindings.elements) {
              const importedName = importSpecifier.propertyName?.text ?? importSpecifier.name.text;
              const localName = importSpecifier.name.text;
              const exported = exportedConsts.get(importedName);
              if (exported) addBinding(localName, exported);
            }
          }
        }
      }

      if (ts.isCallExpression(node) && isTFunctionCall(node)) {
        const keys = resolveToStrings(node.arguments[0]);
        for (const key of keys) {
          if (key) extractedKeys.add(key);
        }
      }

      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'map' &&
        node.arguments.length > 0 &&
        (ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]))
      ) {
        const callback = node.arguments[0];
        const firstParam = callback.parameters[0];
        if (firstParam && ts.isIdentifier(firstParam.name)) {
          const items = resolveArrayElements(node.expression.expression);
          if (items.length > 0) {
            scopes.push(new Map());
            scopes[scopes.length - 1].set(firstParam.name.text, { expressions: items });
            if (ts.isBlock(callback.body)) {
              callback.body.statements.forEach((statement) => visit(statement));
            } else {
              visit(callback.body);
            }
            scopes.pop();
          }
        }
      }

      if (ts.isJsxAttribute(node) && node.name.text === 'i18nKey') {
        const keys = readJsxI18nKey(node);
        for (const key of keys) {
          if (key) extractedKeys.add(key);
        }
      }

      ts.forEachChild(node, visit);

      if (pushedScope) {
        scopes.pop();
      }
    };

    visit(sourceFile);
    return Array.from(extractedKeys);
  };

  return {
    name: 'dynamic-template-keys-plugin',
    async onEnd(keys) {
      const usageByFile = new Map();
      for (const keyData of keys.values()) {
        const locations = keyData.locations || [];
        for (const location of locations) {
          if (!location?.file) continue;
          const set = usageByFile.get(location.file) ?? new Set();
          set.add(location.file);
          usageByFile.set(location.file, set);
        }
      }

      const filesToAnalyze = Array.from(usageByFile.keys());
      for (const file of filesToAnalyze) {
        if (!/\.(tsx?|jsx?)$/.test(file)) continue;
        if (!fs.existsSync(file)) continue;

        const dynamicKeys = extractKeysFromFile(file);
        for (const key of dynamicKeys) {
          const uniqueKey = `translation:${key}`;
          if (!keys.has(uniqueKey)) {
            keys.set(uniqueKey, {
              key,
              defaultValue: key,
              ns: 'translation',
            });
          }
        }
      }
    },
  };
};
