import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Loading } from '../../../components/Loading';

describe('Loading', () => {
  it('renders with default message', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders custom message', () => {
    render(<Loading message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeDefined();
  });

  it('renders fullScreen mode', () => {
    const { container } = render(<Loading fullScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('fixed');
  });

  it('renders non-fullScreen mode by default', () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain('fixed');
  });

  it('shows progress bar when showProgress is true', () => {
    render(<Loading showProgress progress={50} />);
    expect(screen.getByText('50% Completed')).toBeDefined();
  });

  it('does not show progress bar by default', () => {
    render(<Loading />);
    expect(screen.queryByText('Completed')).toBeNull();
  });

  it('shows error state with message', () => {
    render(<Loading error="Network timeout" />);
    expect(screen.getByText('Connection Issue')).toBeDefined();
    expect(screen.getByText('Network timeout')).toBeDefined();
  });

  it('shows retry button when error and onRetry provided', () => {
    const onRetry = vi.fn();
    render(<Loading error="Something failed" onRetry={onRetry} />);
    const retryBtn = screen.getByText(/Try Again/);
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not show retry button when error but no onRetry', () => {
    render(<Loading error="Something failed" />);
    expect(screen.queryByText(/Try Again/)).toBeNull();
  });

  it('does not show error UI when no error', () => {
    render(<Loading />);
    expect(screen.queryByText('Connection Issue')).toBeNull();
  });

  it('shows helpful subtitle text', () => {
    render(<Loading />);
    expect(screen.getByText(/usually takes only a few seconds/)).toBeDefined();
  });
});
