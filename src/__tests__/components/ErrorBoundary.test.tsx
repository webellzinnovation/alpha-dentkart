import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../../components/ErrorBoundary';

function Bomb() {
  throw new Error('Test error');
}

function GoodChild() {
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeDefined();
  });

  it('renders error UI when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Reload Page')).toBeDefined();
    consoleSpy.mockRestore();
  });

  it('displays error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText(/unexpected error occurred/)).toBeDefined();
    consoleSpy.mockRestore();
  });

  it('renders the reload button', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    const button = screen.getByText('Reload Page');
    expect(button).toBeDefined();
    expect(button.tagName).toBe('BUTTON');
    consoleSpy.mockRestore();
  });

  it('does not render error UI when children are valid', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Valid content</div>
      </ErrorBoundary>
    );
    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByText('Valid content')).toBeDefined();
  });

  it('catches errors from deep children', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const DeepBomb = () => {
      return (
        <div>
          <span>outer</span>
          <Bomb />
        </div>
      );
    };
    render(
      <ErrorBoundary>
        <DeepBomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.queryByText('outer')).toBeNull();
    consoleSpy.mockRestore();
  });
});
