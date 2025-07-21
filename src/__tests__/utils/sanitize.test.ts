import { describe, it, expect } from 'vitest';
import { 
  sanitizeInput, 
  sanitizeEmail, 
  sanitizePassword, 
  sanitizeWithBasicFormatting,
  sanitizeFormFields 
} from '@/utils/sanitize';

describe('sanitizeInput', () => {
  it('should remove all HTML tags', () => {
    const maliciousInput = '<script>alert("xss")</script>Hello World';
    const result = sanitizeInput(maliciousInput);
    expect(result).toBe('Hello World');
  });

  it('should remove HTML attributes', () => {
    const maliciousInput = '<div onclick="alert(\'xss\')">Click me</div>';
    const result = sanitizeInput(maliciousInput);
    expect(result).toBe('Click me');
  });

  it('should handle XSS attack vectors', () => {
    const xssVectors = [
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<object data="javascript:alert(\'XSS\')"></object>',
      '<embed src="javascript:alert(\'XSS\')">',
      '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
      '<style>@import url("javascript:alert(\'XSS\')")</style>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
      '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>'
    ];

    xssVectors.forEach(vector => {
      const result = sanitizeInput(vector);
      expect(result).not.toContain('<');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onload');
    });
  });

  it('should preserve text content', () => {
    const input = '<b>Bold</b> and <i>italic</i> text';
    const result = sanitizeInput(input);
    expect(result).toBe('Bold and italic text');
  });

  it('should trim whitespace', () => {
    const input = '  <p>  Hello World  </p>  ';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello World');
  });

  it('should handle non-string input', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
    expect(sanitizeInput(123 as any)).toBe('');
    expect(sanitizeInput({} as any)).toBe('');
  });

  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('should sanitize and normalize email', () => {
    const input = '  <script>alert("xss")</script>Test@Example.COM  ';
    const result = sanitizeEmail(input);
    expect(result).toBe('test@example.com');
  });

  it('should remove whitespace from emails', () => {
    const input = 'test @ example . com';
    const result = sanitizeEmail(input);
    expect(result).toBe('test@example.com');
  });

  it('should handle malicious email input', () => {
    const input = '<img src="x" onerror="alert(\'xss\')">user@domain.com';
    const result = sanitizeEmail(input);
    expect(result).toBe('user@domain.com');
  });
});

describe('sanitizePassword', () => {
  it('should remove HTML but preserve special characters', () => {
    const input = '<script>alert("xss")</script>P@ssw0rd!';
    const result = sanitizePassword(input);
    expect(result).toBe('P@ssw0rd!');
  });

  it('should preserve spaces in passwords', () => {
    const input = '  my password with spaces  ';
    const result = sanitizePassword(input);
    expect(result).toBe('  my password with spaces  ');
  });

  it('should handle XSS in password field', () => {
    const input = '<img onerror="alert(\'xss\')" src="x">mypassword';
    const result = sanitizePassword(input);
    expect(result).toBe('mypassword');
  });

  it('should handle non-string password input', () => {
    expect(sanitizePassword(null as any)).toBe('');
    expect(sanitizePassword(undefined as any)).toBe('');
  });
});

describe('sanitizeWithBasicFormatting', () => {
  it('should allow basic formatting tags', () => {
    const input = '<b>Bold</b> and <i>italic</i> and <strong>strong</strong>';
    const result = sanitizeWithBasicFormatting(input);
    expect(result).toBe('<b>Bold</b> and <i>italic</i> and <strong>strong</strong>');
  });

  it('should remove dangerous tags but keep content', () => {
    const input = '<script>alert("xss")</script><b>Safe content</b>';
    const result = sanitizeWithBasicFormatting(input);
    expect(result).toBe('<b>Safe content</b>');
  });

  it('should remove all attributes', () => {
    const input = '<b onclick="alert(\'xss\')">Bold text</b>';
    const result = sanitizeWithBasicFormatting(input);
    expect(result).toBe('<b>Bold text</b>');
  });

  it('should handle mixed content', () => {
    const input = '<p>Paragraph</p><script>alert("xss")</script><br><em>Emphasis</em>';
    const result = sanitizeWithBasicFormatting(input);
    expect(result).toBe('<p>Paragraph</p><br><em>Emphasis</em>');
  });
});

describe('sanitizeFormFields', () => {
  it('should sanitize multiple form fields appropriately', () => {
    const fields = {
      email: '  <script>alert("xss")</script>User@Domain.COM  ',
      password: '<img onerror="alert(\'xss\')" src="x">  mypassword  ',
      username: '<b>username</b>',
      comment: '<p>This is a comment</p>'
    };

    const result = sanitizeFormFields(fields);

    expect(result.email).toBe('user@domain.com');
    expect(result.password).toBe('  mypassword  '); // Preserves spaces
    expect(result.username).toBe('username');
    expect(result.comment).toBe('This is a comment');
  });

  it('should handle empty fields object', () => {
    const result = sanitizeFormFields({});
    expect(result).toEqual({});
  });

  it('should handle fields with XSS attempts', () => {
    const fields = {
      userEmail: '<script>document.cookie</script>test@example.com',
      userPassword: '<iframe src="javascript:alert(\'xss\')"></iframe>password123',
      name: '<img src="x" onerror="alert(\'xss\')">John Doe'
    };

    const result = sanitizeFormFields(fields);

    expect(result.userEmail).toBe('test@example.com');
    expect(result.userPassword).toBe('password123');
    expect(result.name).toBe('John Doe');
  });
});

describe('Advanced XSS Protection', () => {
  it('should handle nested and encoded XSS attempts', () => {
    const complexXssVectors = [
      '&lt;script&gt;alert("xss")&lt;/script&gt;',
      '<scri<script>pt>alert("xss")</scri</script>pt>',
      'javascript&#58;alert("xss")',
      '%3Cscript%3Ealert("xss")%3C/script%3E',
      '<IMG SRC="javascript:alert(\'XSS\');">',
      '<IMG SRC="jav&#x09;ascript:alert(\'XSS\');">',
      '<IMG SRC="jav&#x0A;ascript:alert(\'XSS\');">',
      '<IMG SRC="jav&#x0D;ascript:alert(\'XSS\');">'
    ];

    complexXssVectors.forEach(vector => {
      const result = sanitizeInput(vector);
      expect(result).not.toContain('script');
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  it('should handle data URIs and base64 encoded XSS', () => {
    const dataUriXss = [
      'data:text/html,<script>alert("xss")</script>',
      'data:image/svg+xml,<svg onload="alert(\'xss\')"></svg>',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgieHNzIik8L3NjcmlwdD4='
    ];

    dataUriXss.forEach(vector => {
      const result = sanitizeInput(vector);
      expect(result).not.toContain('data:');
      expect(result).not.toContain('script');
      expect(result).not.toContain('onload');
    });
  });
});