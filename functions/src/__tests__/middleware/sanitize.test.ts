import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeInput } from '../../middleware/sanitize';
import type { Request, Response, NextFunction } from 'express';

describe('sanitize middleware', () => {
  describe('stripHtml', () => {
    it('removes script tags from object body', () => {
      const req = { body: { text: 'Hello <script>alert("xss")</script> World' }, query: {}, params: {} } as any;
      const res = {} as any;
      let nextCalled = false;
      sanitizeInput(req, res, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
      expect(req.body.text).not.toContain('<script>');
    });

    it('removes HTML tags from object body', () => {
      const req = { body: { text: '<b>Bold</b> text' }, query: {}, params: {} } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.body.text).toBe('Bold text');
    });

    it('removes javascript: protocol from object body', () => {
      const req = { body: { url: 'javascript:alert(1)' }, query: {}, params: {} } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.body.url).not.toContain('javascript:');
    });

    it('removes event handlers (onclick, onerror, etc.) from object body', () => {
      const req = { body: { text: 'test onclick=alert(1)' }, query: {}, params: {} } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.body.text).not.toContain('onclick=');
    });

    it('sanitizes nested objects recursively', () => {
      const req = {
        body: { name: '<b>Test</b>', nested: { desc: '<script>bad</script>' } },
        query: {},
        params: {}
      } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.body.name).toBe('Test');
      expect(req.body.nested.desc).toBe('');
    });

    it('sanitizes arrays', () => {
      const req = {
        body: ['<b>one</b>', '<script>two</script>', 'clean'],
        query: {},
        params: {}
      } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.body[0]).toBe('one');
      expect(req.body[1]).toBe('');
      expect(req.body[2]).toBe('clean');
    });

    it('preserves non-string values', () => {
      const req = { body: { count: 42, active: true, data: null }, query: {}, params: {} } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.body.count).toBe(42);
      expect(req.body.active).toBe(true);
      expect(req.body.data).toBe(null);
    });

    it('sanitizes query parameters', () => {
      const req = {
        body: {},
        query: { search: '<script>xss</script>test', page: '1' },
        params: {}
      } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.query.search).toBe('test');
      expect(req.query.page).toBe('1');
    });

    it('sanitizes route params', () => {
      const req = {
        body: {},
        query: {},
        params: { id: '123', name: '<b>test</b>' }
      } as any;
      const res = {} as any;
      sanitizeInput(req, res, () => {});
      expect(req.params.id).toBe('123');
      expect(req.params.name).toBe('test');
    });

    it('handles empty body gracefully', () => {
      const req = { body: undefined, query: {}, params: {} } as any;
      const res = {} as any;
      let nextCalled = false;
      sanitizeInput(req, res, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
    });
  });
});
