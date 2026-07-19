import { describe, it, expect } from 'vitest';
import { resolveProductImage } from '../../../utils/image';

describe('resolveProductImage', () => {
  it('returns default logo for empty/undefined input', () => {
    expect(resolveProductImage('')).toBe('/Alpha-dentkart-logo-600p.png');
    expect(resolveProductImage(undefined as any)).toBe('/Alpha-dentkart-logo-600p.png');
  });

  it('returns base64 URLs as-is', () => {
    const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANS';
    expect(resolveProductImage(base64)).toBe(base64);
  });

  it('rewrites Firebase Storage URLs to direct GCS URLs', () => {
    const firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/products%2Fimage.jpg?alt=media';
    const result = resolveProductImage(firebaseUrl);
    expect(result).toContain('storage.googleapis.com');
    expect(result).toContain('products/image.jpg');
    expect(result).not.toContain('firebasestorage');
  });

  it('rewrites localhost wp-content paths', () => {
    const localhostUrl = 'http://localhost/wp-content/uploads/test.jpg';
    const result = resolveProductImage(localhostUrl);
    expect(result).toBe('https://alphadentkart.com/wp-content/uploads/test.jpg');
  });

  it('upgrades HTTP to HTTPS for alphadentkart.com', () => {
    const httpUrl = 'http://alphadentkart.com/image.jpg';
    const result = resolveProductImage(httpUrl);
    expect(result).toBe('https://alphadentkart.com/image.jpg');
  });

  it('strips www from alphadentkart.com', () => {
    const wwwUrl = 'https://www.alphadentkart.com/image.jpg';
    const result = resolveProductImage(wwwUrl);
    expect(result).toBe('https://alphadentkart.com/image.jpg');
  });

  it('prefixes relative paths with domain', () => {
    const relative = '/images/product.jpg';
    expect(resolveProductImage(relative)).toBe('https://alphadentkart.com/images/product.jpg');
  });

  it('adds leading slash to relative paths without one', () => {
    const relative = 'images/product.jpg';
    expect(resolveProductImage(relative)).toBe('https://alphadentkart.com/images/product.jpg');
  });

  it('preserves external URLs unchanged', () => {
    const external = 'https://example.com/image.jpg';
    expect(resolveProductImage(external)).toBe(external);
  });

  it('handles Firebase URL with query params', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/file.png?alt=media&token=abc';
    const result = resolveProductImage(url);
    expect(result).toContain('storage.googleapis.com/bucket/file.png');
  });

  it('handles 127.0.0.1 localhost URLs', () => {
    const url = 'http://127.0.0.1/wp-content/uploads/test.jpg';
    const result = resolveProductImage(url);
    expect(result).toBe('https://alphadentkart.com/wp-content/uploads/test.jpg');
  });
});
