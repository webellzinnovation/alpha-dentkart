import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { LoadingSkeleton, ProductCardSkeleton, DetailPageSkeleton } from '../../../components/LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });

  it('has animate-pulse class', () => {
    const { container } = render(<LoadingSkeleton />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).not.toBeNull();
  });

  it('renders header skeleton', () => {
    const { container } = render(<LoadingSkeleton />);
    const header = container.querySelector('.h-16');
    expect(header).not.toBeNull();
  });

  it('renders hero skeleton', () => {
    const { container } = render(<LoadingSkeleton />);
    const hero = container.querySelector('.h-\\[400px\\]');
    expect(hero).not.toBeNull();
  });
});

describe('ProductCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });

  it('has animate-pulse class', () => {
    const { container } = render(<ProductCardSkeleton />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).not.toBeNull();
  });
});

describe('DetailPageSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DetailPageSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });

  it('has animate-pulse class', () => {
    const { container } = render(<DetailPageSkeleton />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).not.toBeNull();
  });

  it('renders image and details skeleton sections', () => {
    const { container } = render(<DetailPageSkeleton />);
    const cols = container.querySelectorAll('.grid');
    expect(cols.length).toBeGreaterThan(0);
  });
});
