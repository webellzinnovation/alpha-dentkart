import { describe, it, expect } from 'vitest';
import { generateSlug, createUniqueSlug, extractIdFromSlug } from '../../../utils/slugify';

describe('generateSlug', () => {
  it('converts text to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('replaces special characters with hyphens', () => {
    expect(generateSlug('Colgate - PeriGard Toothpaste')).toBe('colgate-perigard-toothpaste');
  });

  it('removes parentheses and dots', () => {
    expect(generateSlug('Product (90 g)')).toBe('product-90-g');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('a---b')).toBe('a-b');
  });

  it('collapses underscores into hyphens', () => {
    expect(generateSlug('hello_world')).toBe('hello-world');
  });

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug(' hello ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles special dental characters', () => {
    expect(generateSlug('Dental #1 Kit')).toBe('dental-1-kit');
  });

  it('handles unicode characters', () => {
    const result = generateSlug('Café');
    expect(result).toMatch(/^caf/);
  });

  it('handles numbers in slug', () => {
    expect(generateSlug('3M ESPE 123')).toBe('3m-espe-123');
  });

  it('trims whitespace', () => {
    expect(generateSlug('  hello  ')).toBe('hello');
  });
});

describe('createUniqueSlug', () => {
  it('appends ID to slug', () => {
    expect(createUniqueSlug('Colgate Toothpaste', 123)).toBe('colgate-toothpaste-123');
  });

  it('handles special characters with ID', () => {
    expect(createUniqueSlug('Product (Pro)', 456)).toBe('product-pro-456');
  });

  it('works with zero ID', () => {
    expect(createUniqueSlug('Test', 0)).toBe('test-0');
  });
});

describe('extractIdFromSlug', () => {
  it('extracts ID from end of slug', () => {
    expect(extractIdFromSlug('colgate-toothpaste-123')).toBe(123);
  });

  it('returns null when no ID found', () => {
    expect(extractIdFromSlug('colgate-toothpaste')).toBeNull();
  });

  it('handles multi-digit IDs', () => {
    expect(extractIdFromSlug('product-name-123456789')).toBe(123456789);
  });

  it('handles ID at very end', () => {
    expect(extractIdFromSlug('a-1')).toBe(1);
  });

  it('does not extract ID from middle', () => {
    expect(extractIdFromSlug('product-123-name')).toBeNull();
  });

  it('returns null for empty slug', () => {
    expect(extractIdFromSlug('')).toBeNull();
  });
});
