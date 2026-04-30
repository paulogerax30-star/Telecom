/**
 * Utility functions for database interactions
 */

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function mapKeysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => mapKeysToSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toSnakeCase(key)]: mapKeysToSnakeCase(obj[key]),
      }),
      {}
    );
  }
  return obj;
}

export function mapKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => mapKeysToCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamelCase(key)]: mapKeysToCamelCase(obj[key]),
      }),
      {}
    );
  }
  return obj;
}
