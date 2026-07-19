import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { SkeletonLoader, ProductCardSkeleton, CategorySkeleton, OrderRowSkeleton } from '../../../components/SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders card type by default', () => {
    const { container } = render(<SkeletonLoader />);
    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders card type with custom count', () => {
    const { container } = render(<SkeletonLoader type="card" count={3} />);
    const gridItems = container.querySelectorAll('.bg-white');
    expect(gridItems.length).toBe(3);
  });

  it('renders hero type', () => {
    const { container } = render(<SkeletonLoader type="hero" />);
    const hero = container.querySelector('.h-96');
    expect(hero).not.toBeNull();
  });

  it('renders table type', () => {
    const { container } = render(<SkeletonLoader type="table" />);
    const rows = container.querySelectorAll('.p-4');
    expect(rows.length).toBe(5);
  });

  it('renders list type', () => {
    const { container } = render(<SkeletonLoader type="list" />);
    const items = container.querySelectorAll('.rounded-full');
    expect(items.length).toBe(6);
  });

  it('applies animate-pulse class', () => {
    const { container } = render(<SkeletonLoader />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).not.toBeNull();
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

describe('CategorySkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CategorySkeleton />);
    expect(container.firstChild).not.toBeNull();
  });

  it('has animate-pulse class', () => {
    const { container } = render(<CategorySkeleton />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).not.toBeNull();
  });
});

describe('OrderRowSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<OrderRowSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });

  it('has animate-pulse class', () => {
    const { container } = render(<OrderRowSkeleton />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).not.toBeNull();
  });
});
