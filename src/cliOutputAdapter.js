const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const flatten = (value, prefix = '', acc = []) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextPrefix = prefix ? `${prefix}.${index}` : String(index);
      flatten(item, nextPrefix, acc);
    });
    return acc;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, nested]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flatten(nested, nextPrefix, acc);
    });
    return acc;
  }

  if (prefix) acc.push(prefix);
  return acc;
};

export const extractKeysFromCliJson = (json) => Array.from(new Set(flatten(json))).sort();
