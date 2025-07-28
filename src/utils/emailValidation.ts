/**
 * Email validation utilities for TUPÁ Hub
 * Implements robust email format validation and security checks
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates email format using strict regex
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const trimmedEmail = email.trim();
  
  // Basic length checks
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false;
  }
  
  // Check regex pattern
  return EMAIL_REGEX.test(trimmedEmail);
}

/**
 * Validates email and provides specific error messages
 * @param email - Email string to validate
 * @returns object with validation result and error message
 */
export function validateEmailWithMessage(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email es requerido' };
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: 'Email no puede estar vacío' };
  }
  
  if (trimmedEmail.length < 5) {
    return { isValid: false, error: 'Email demasiado corto' };
  }
  
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email demasiado largo' };
  }
  
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  return { isValid: true };
}

/**
 * Checks for suspicious email patterns that could indicate attacks
 * @param email - Email string to check
 * @returns boolean indicating if email looks suspicious
 */
export function isSuspiciousEmail(email: string): boolean {
  const suspiciousPatterns = [
    /\+.*\+/, // Multiple plus signs
    /\.{2,}/, // Multiple consecutive dots
    /@.*@/, // Multiple @ symbols
    /[<>"]/, // HTML/script characters
    /javascript:/i, // Script injection
    /data:/i, // Data URLs
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(email));
}