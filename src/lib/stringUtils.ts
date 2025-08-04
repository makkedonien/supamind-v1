/**
 * Safely converts any value to a string format
 * Prevents "[object]" display by properly handling objects, arrays, and other types
 */
export const safeStringify = (value: any): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    // Handle arrays - if they contain objects, format them nicely
    if (value.length === 0) return '';
    
    // If array contains simple values, join them
    if (value.every(item => typeof item === 'string' || typeof item === 'number')) {
      return value.join('\n\n');
    }
    
    // If array contains objects, convert each to readable format
    return value.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        try {
          return JSON.stringify(item, null, 2);
        } catch {
          return `Item ${index + 1}: ${String(item)}`;
        }
      }
      return String(item);
    }).join('\n\n');
  }
  if (typeof value === 'object') {
    try {
      // Check if it's a plain object that might contain text content
      if (value.content || value.text || value.summary || value.description) {
        const extractedContent = value.content || value.text || value.summary || value.description;
        
        // If the extracted content is also an object/array, process it recursively
        if (typeof extractedContent === 'object') {
          return safeStringify(extractedContent);
        }
        
        return String(extractedContent);
      }
      
      // Check for common N8N output patterns
      if (value.output) {
        return safeStringify(value.output);
      }
      
      // Check if it's a result object with data
      if (value.data) {
        return safeStringify(value.data);
      }
      
      // If it looks like a response object, try to extract meaningful content
      if (value.result || value.response) {
        return safeStringify(value.result || value.response);
      }
      
      const stringified = JSON.stringify(value, null, 2);
      return stringified;
    } catch (error) {
      console.error('Error in safeStringify:', error);
      return String(value);
    }
  }
  return String(value);
};

/**
 * Safely converts a value to string for display purposes
 * Returns empty string if value is null/undefined (useful for direct display)
 */
export const safeStringifyForDisplay = (value: any): string => {
  const result = safeStringify(value);
  return result ?? '';
};