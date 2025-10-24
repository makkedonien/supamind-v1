/**
 * Input Validation Utilities
 * Provides validation functions for common input types
 */

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export function isValidHttpUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  
  try {
    const parsed = new URL(url);
    // Additional checks
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return false; // Prevent SSRF
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates RSS feed URL
 */
export function isValidRssUrl(url: string): boolean {
  return isValidHttpUrl(url);
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .substring(0, maxLength)
    .trim();
}

/**
 * Validates source type
 */
export function isValidSourceType(type: string): boolean {
  const validTypes = ['pdf', 'text', 'website', 'youtube', 'audio', 'podcast'];
  return validTypes.includes(type);
}

/**
 * Validates file path format
 */
export function isValidFilePath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  
  // Basic path validation - no directory traversal
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) {
    return false;
  }
  
  // Must contain forward slash and valid characters
  const pathRegex = /^[a-zA-Z0-9\-_/]+\.[a-zA-Z0-9]+$/;
  return pathRegex.test(path);
}

/**
 * Validates message content length
 */
export function isValidMessageLength(message: string, maxLength: number = 50000): boolean {
  return typeof message === 'string' && message.length > 0 && message.length <= maxLength;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates timestamp format (ISO 8601)
 */
export function isValidTimestamp(timestamp: string): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Validates API key format (basic check)
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // API keys should be at least 20 characters and alphanumeric with some special chars
  const minLength = 20;
  const maxLength = 500;
  
  return key.length >= minLength && 
         key.length <= maxLength &&
         /^[a-zA-Z0-9\-_]+$/.test(key);
}

/**
 * Validates integer within range
 */
export function isValidInteger(value: any, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return false;
  }
  
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  
  return true;
}

/**
 * Validates and sanitizes an object with expected keys
 */
export function validateObject(
  obj: any, 
  requiredKeys: string[], 
  optionalKeys: string[] = []
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    errors.push('Input must be an object');
    return { valid: false, errors };
  }
  
  // Check required keys
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      errors.push(`Missing required field: ${key}`);
    }
  }
  
  // Check for unexpected keys
  const allAllowedKeys = [...requiredKeys, ...optionalKeys];
  for (const key of Object.keys(obj)) {
    if (!allAllowedKeys.includes(key)) {
      errors.push(`Unexpected field: ${key}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates chat message input
 */
export function validateChatMessage(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.session_id || !isValidUUID(data.session_id)) {
    errors.push('Invalid session_id: must be a valid UUID');
  }
  
  if (!data.user_id || !isValidUUID(data.user_id)) {
    errors.push('Invalid user_id: must be a valid UUID');
  }
  
  if (!isValidMessageLength(data.message)) {
    errors.push('Invalid message: must be a non-empty string under 50000 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates document processing input
 */
export function validateDocumentProcessing(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.sourceId || !isValidUUID(data.sourceId)) {
    errors.push('Invalid sourceId: must be a valid UUID');
  }
  
  if (!data.userId || !isValidUUID(data.userId)) {
    errors.push('Invalid userId: must be a valid UUID');
  }
  
  if (!data.filePath || !isValidFilePath(data.filePath)) {
    errors.push('Invalid filePath: must be a valid file path without directory traversal');
  }
  
  if (!data.sourceType || !isValidSourceType(data.sourceType)) {
    errors.push('Invalid sourceType: must be one of: pdf, text, website, youtube, audio, podcast');
  }
  
  if (data.notebookId && !isValidUUID(data.notebookId)) {
    errors.push('Invalid notebookId: must be a valid UUID if provided');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates URL list for processing
 */
export function validateUrlList(urls: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(urls)) {
    errors.push('urls must be an array');
    return { valid: false, errors };
  }
  
  if (urls.length === 0) {
    errors.push('urls array cannot be empty');
  }
  
  if (urls.length > 50) {
    errors.push('urls array cannot contain more than 50 items');
  }
  
  for (let i = 0; i < urls.length; i++) {
    if (!isValidHttpUrl(urls[i])) {
      errors.push(`Invalid URL at index ${i}: ${urls[i]}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

