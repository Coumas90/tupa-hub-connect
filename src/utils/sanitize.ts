import DOMPurify from 'dompurify';

/**
 * Strict sanitization for user inputs - prevents XSS attacks
 * Configuration: No HTML tags or attributes allowed
 * 
 * @param value - String to sanitize
 * @returns Sanitized string without HTML
 */
export function sanitizeInput(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Ultra-strict configuration for form inputs
  const clean = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No HTML attributes allowed
    KEEP_CONTENT: true // Keep text content, remove HTML
  });

  return clean.trim();
}

/**
 * Sanitize email input with additional validation
 * 
 * @param email - Email string to sanitize
 * @returns Sanitized email string
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeInput(email);
  // Additional email-specific cleaning
  return sanitized.toLowerCase().replace(/\s+/g, '');
}

/**
 * Sanitize password input (preserves special characters needed for passwords)
 * 
 * @param password - Password string to sanitize
 * @returns Sanitized password string
 */
export function sanitizePassword(password: string): string {
  if (typeof password !== 'string') {
    return '';
  }

  // For passwords, we only sanitize HTML but preserve special characters
  const clean = DOMPurify.sanitize(password, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });

  return clean; // Don't trim passwords as spaces might be intentional
}

/**
 * Sanitize text input with basic formatting allowed (for rich text fields)
 * WARNING: Use only for non-critical fields, never for auth inputs
 * 
 * @param value - String to sanitize with basic formatting
 * @returns Sanitized string with basic HTML allowed
 */
export function sanitizeWithBasicFormatting(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  const clean = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });

  return clean.trim();
}

/**
 * Batch sanitize multiple form fields
 * 
 * @param fields - Object with form field values
 * @returns Object with sanitized values
 */
export function sanitizeFormFields(fields: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  Object.entries(fields).forEach(([key, value]) => {
    if (key.toLowerCase().includes('email')) {
      sanitized[key] = sanitizeEmail(value);
    } else if (key.toLowerCase().includes('password')) {
      sanitized[key] = sanitizePassword(value);
    } else {
      sanitized[key] = sanitizeInput(value);
    }
  });

  return sanitized;
}