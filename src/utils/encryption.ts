/**
 * Simple encryption utilities for protecting content in source code.
 * Note: This is NOT real security - just basic obfuscation.
 */

const ENCRYPTION_KEY = 'p03try_k3y_2025';

export const encryptString = (
  str: string,
  key: string = ENCRYPTION_KEY,
): string => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(
      str.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    );
  }
  return btoa(result); // Base64 encode the result
};

export const decryptString = (
  encryptedStr: string,
  key: string = ENCRYPTION_KEY,
): string => {
  try {
    const decoded = atob(encryptedStr); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length),
      );
    }
    return result;
  } catch {
    return '';
  }
};
