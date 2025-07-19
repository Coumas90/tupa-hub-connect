import DOMPurify from 'dompurify';

/**
 * Sanitiza input del usuario para prevenir ataques XSS
 * Configuración estricta: no permite ninguna etiqueta HTML ni atributo
 * 
 * @param value - String a sanitizar
 * @returns String sanitizado sin HTML
 */
export function sanitizeInput(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Configuración ultra-estricta para inputs de formulario
  const clean = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // No permitir ninguna etiqueta HTML
    ALLOWED_ATTR: [], // No permitir ningún atributo HTML
    KEEP_CONTENT: true // Mantener el contenido de texto, solo eliminar HTML
  });

  return clean.trim();
}

/**
 * Versión relajada para campos donde se necesita preservar formato básico
 * NO USAR en inputs críticos como auth, solo para casos específicos como rich text
 * 
 * @param value - String a sanitizar con formato básico
 * @returns String sanitizado con HTML básico permitido
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