import { describe, expect, it } from 'vitest';
import { sanitizeInput, validateEmail, validateUsername } from './validation.js';

describe('validation helpers', () => {
  it('accepts common display-style usernames with spaces', () => {
    expect(validateUsername('Jane Doe')).toBe(true);
    expect(validateUsername('mashup_user')).toBe(true);
    expect(validateUsername('Jane-Doe.2024')).toBe(true);
    expect(validateUsername("O'Connor")).toBe(true);
    expect(validateUsername('José')).toBe(true);
  });

  it('rejects unsupported username characters', () => {
    expect(validateUsername('Jane@Doe')).toBe(false);
    expect(validateUsername('ab')).toBe(false);
  });

  it('sanitizes obvious HTML-like input', () => {
    expect(sanitizeInput('<b>Jane</b>')).toBe('Jane');
  });

  it('validates email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
