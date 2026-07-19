import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import cache from '../../../utils/cache';

describe('CacheManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cache.clear();
  });

  it('stores and retrieves data', () => {
    cache.set('key1', { name: 'test' }, 5);
    expect(cache.get('key1')).toEqual({ name: 'test' });
  });

  it('returns null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('respects TTL and returns null after expiry', () => {
    cache.set('key1', 'value1', 1);
    expect(cache.get('key1')).toBe('value1');
    vi.advanceTimersByTime(61000);
    expect(cache.get('key1')).toBeNull();
  });

  it('returns data before TTL expires', () => {
    cache.set('key1', 'value1', 5);
    vi.advanceTimersByTime(240000);
    expect(cache.get('key1')).toBe('value1');
  });

  it('overwrites existing keys', () => {
    cache.set('key1', 'old', 5);
    cache.set('key1', 'new', 5);
    expect(cache.get('key1')).toBe('new');
  });

  it('isFresh returns true for fresh entries', () => {
    cache.set('key1', 'value1', 5);
    expect(cache.isFresh('key1')).toBe(true);
  });

  it('isFresh returns false for expired entries', () => {
    cache.set('key1', 'value1', 1);
    vi.advanceTimersByTime(61000);
    expect(cache.isFresh('key1')).toBe(false);
  });

  it('has returns true for existing keys', () => {
    cache.set('key1', 'value1', 5);
    expect(cache.has('key1')).toBe(true);
  });

  it('getAge returns age in milliseconds', () => {
    cache.set('key1', 'value1', 5);
    vi.advanceTimersByTime(30000);
    expect(cache.getAge('key1')).toBe(30000);
  });

  it('getAge returns null for non-existent keys', () => {
    expect(cache.getAge('nonexistent')).toBeNull();
  });

  it('invalidate removes specific key', () => {
    cache.set('key1', 'value1', 5);
    cache.invalidate('key1');
    expect(cache.get('key1')).toBeNull();
  });

  it('invalidatePattern removes matching keys', () => {
    cache.set('products_1', 'data1', 5);
    cache.set('products_2', 'data2', 5);
    cache.set('categories_1', 'cat1', 5);
    cache.invalidatePattern(/^products_/);
    expect(cache.get('products_1')).toBeNull();
    expect(cache.get('products_2')).toBeNull();
    expect(cache.get('categories_1')).toBe('cat1');
  });

  it('clear removes all entries', () => {
    cache.set('a', 1, 5);
    cache.set('b', 2, 5);
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });

  it('cleanup removes expired entries', () => {
    cache.set('fresh', 'yes', 5);
    cache.set('stale', 'no', 0.001);
    vi.advanceTimersByTime(200);
    const cleaned = cache.cleanup();
    expect(cleaned).toBeGreaterThanOrEqual(1);
    expect(cache.get('fresh')).toBe('yes');
  });

  it('getStats returns hit/miss counts', () => {
    const beforeStats = cache.getStats();
    cache.set('key1', 'val', 5);
    cache.get('key1');
    cache.get('miss');
    const stats = cache.getStats();
    expect(stats.hits).toBeGreaterThanOrEqual(beforeStats.hits + 1);
    expect(stats.misses).toBeGreaterThanOrEqual(beforeStats.misses + 1);
    expect(stats.size).toBeGreaterThanOrEqual(1);
  });

  it('keys returns all cached keys', () => {
    cache.set('a', 1, 5);
    cache.set('b', 2, 5);
    expect(cache.keys()).toContain('a');
    expect(cache.keys()).toContain('b');
  });

  it('default TTL is 5 minutes', () => {
    cache.set('key1', 'value1');
    vi.advanceTimersByTime(4 * 60000);
    expect(cache.get('key1')).toBe('value1');
    vi.advanceTimersByTime(2 * 60000);
    expect(cache.get('key1')).toBeNull();
  });
});
