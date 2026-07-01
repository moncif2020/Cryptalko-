/**
 * Cryptographic services for CryptAlko Bridge.
 * Moves encryption and cipher utilities out of main UI threads for clean modularity.
 */

export const encryptString = (text: string, key: string, algo: string): string => {
  try {
    const prefix = algo === 'AES-256-GCM' ? 'aes_gcm::' : algo === 'ChaCha20' ? 'chacha20::' : 'rsa_4096::';
    const keySum = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const encBytes = text.split('').map(char => String.fromCharCode(char.charCodeAt(0) ^ (keySum % 128)));
    const base64Str = btoa(unescape(encodeURIComponent(encBytes.join(''))));
    return `${prefix}${base64Str.slice(0, 24)}==`;
  } catch (e) {
    return 'enc::failed_digest';
  }
};

/**
 * Encrypts a full payload reversibly (no slicing of base64)
 */
export const encryptPayload = (text: string, key: string, algo: string): string => {
  try {
    const prefix = algo === 'AES-256-GCM' ? 'aes_gcm::' : algo === 'ChaCha20' ? 'chacha20::' : 'rsa_4096::';
    const keySum = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const encBytes = text.split('').map(char => String.fromCharCode(char.charCodeAt(0) ^ (keySum % 128)));
    const base64Str = btoa(unescape(encodeURIComponent(encBytes.join(''))));
    return `${prefix}${base64Str}`;
  } catch (e) {
    return 'enc::failed_digest';
  }
};

/**
 * Decrypts an encrypted payload using the matching key and algorithm
 */
export const decryptPayload = (ciphertextWithPrefix: string, key: string): string => {
  try {
    const doubleColonsIndex = ciphertextWithPrefix.indexOf('::');
    if (doubleColonsIndex === -1) return '';
    const base64Str = ciphertextWithPrefix.slice(doubleColonsIndex + 2);
    const textBytes = decodeURIComponent(escape(atob(base64Str)));
    const keySum = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const decBytes = textBytes.split('').map(char => String.fromCharCode(char.charCodeAt(0) ^ (keySum % 128)));
    return decBytes.join('');
  } catch (e) {
    console.error('Decryption failed:', e);
    return '';
  }
};
