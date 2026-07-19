import { describe, it, expect } from 'vitest';
import { generateKeywords, generateProductKeywords } from '../../utils/generateKeywords';

describe('generateKeywords', () => {
  it('returns empty array for empty input', () => {
    expect(generateKeywords('')).toEqual([]);
    expect(generateKeywords(null as any)).toEqual([]);
    expect(generateKeywords(undefined as any)).toEqual([]);
  });

  it('generates single-word keywords', () => {
    const result = generateKeywords('toothbrush');
    expect(result).toContain('toothbrush');
  });

  it('generates multi-word keywords', () => {
    const result = generateKeywords('dental handpiece');
    expect(result).toContain('dental');
    expect(result).toContain('handpiece');
    expect(result).toContain('dental handpiece');
  });

  it('generates prefix substrings for autocomplete', () => {
    const result = generateKeywords('colgate');
    expect(result).toContain('co');
    expect(result).toContain('col');
    expect(result).toContain('colg');
    expect(result).toContain('colga');
    expect(result).toContain('colgate');
    // Prefixes are capped at 5 chars
    expect(result).not.toContain('colgat');
  });

  it('filters out words shorter than 2 characters', () => {
    const result = generateKeywords('a b test');
    expect(result).not.toContain('a');
    expect(result).not.toContain('b');
    expect(result).toContain('test');
  });

  it('converts to lowercase', () => {
    const result = generateKeywords('COLGATE Total');
    expect(result).toContain('colgate');
    expect(result).toContain('total');
  });

  it('removes special characters', () => {
    const result = generateKeywords('Dental Kit (Pro)');
    expect(result).toContain('dental');
    expect(result).toContain('kit');
    expect(result).toContain('pro');
    expect(result.some(k => k.includes('('))).toBe(false);
  });

  it('handles product name with numbers', () => {
    const result = generateKeywords('Syringe 5ml Pack');
    expect(result).toContain('syringe');
    expect(result).toContain('5ml');
    expect(result).toContain('pack');
  });

  it('generates bigrams for phrase matching', () => {
    const result = generateKeywords('high speed handpiece');
    expect(result).toContain('high speed');
    expect(result).toContain('speed handpiece');
  });
});

describe('generateProductKeywords', () => {
  it('combines product fields into keywords', () => {
    const result = generateProductKeywords({
      name: 'Composite Kit',
      brandName: '3M',
      categoryName: 'Restorative',
    });
    expect(result).toContain('composite');
    expect(result).toContain('kit');
    expect(result).toContain('3m');
    expect(result).toContain('restorative');
  });

  it('handles missing fields gracefully', () => {
    const result = generateProductKeywords({
      name: 'Test Product',
    });
    expect(result).toContain('test');
    expect(result).toContain('product');
  });

  it('handles all empty fields', () => {
    const result = generateProductKeywords({});
    expect(result).toEqual([]);
  });
});
