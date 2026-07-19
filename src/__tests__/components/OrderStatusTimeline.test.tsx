import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderStatusTimeline from '../../../components/OrderStatusTimeline';

describe('OrderStatusTimeline', () => {
  it('renders processing step for Processing status', () => {
    render(<OrderStatusTimeline currentStatus="Processing" />);
    expect(screen.getByText('Order Confirmed')).toBeDefined();
  });

  it('renders shipped step for Shipped status', () => {
    render(<OrderStatusTimeline currentStatus="Shipped" />);
    expect(screen.getByText('In Transit')).toBeDefined();
  });

  it('renders delivered step for Delivered status', () => {
    render(<OrderStatusTimeline currentStatus="Delivered" />);
    expect(screen.getByText('Delivered')).toBeDefined();
  });

  it('renders cancelled state for Cancelled status', () => {
    render(<OrderStatusTimeline currentStatus="Cancelled" />);
    expect(screen.getByText('Order Cancelled')).toBeDefined();
    expect(screen.getByText(/will not be processed further/)).toBeDefined();
  });

  it('renders return rejected state', () => {
    render(<OrderStatusTimeline currentStatus="Return Rejected" />);
    expect(screen.getByText('Return Rejected')).toBeDefined();
    expect(screen.getByText(/was rejected by the administration/)).toBeDefined();
  });

  it('renders return flow steps for Return Initiated', () => {
    render(<OrderStatusTimeline currentStatus="Return Initiated" />);
    expect(screen.getByText('Return Initiated')).toBeDefined();
    expect(screen.getByText('Return Approved')).toBeDefined();
    expect(screen.getByText('Return Completed')).toBeDefined();
  });

  it('renders normal flow steps for Processing', () => {
    render(<OrderStatusTimeline currentStatus="Processing" />);
    expect(screen.getByText('Order Confirmed')).toBeDefined();
    expect(screen.getByText('In Transit')).toBeDefined();
    expect(screen.getByText('Delivered')).toBeDefined();
  });

  it('shows history timestamps when provided', () => {
    const history = [
      { status: 'Processing', timestamp: '2026-01-15T10:00:00Z', note: '' },
    ];
    render(<OrderStatusTimeline currentStatus="Shipped" history={history} />);
    const timeElements = screen.getAllByText(/2026|01\/15|Jan/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('shows history note when provided', () => {
    const history = [
      { status: 'Shipped', timestamp: '2026-01-16T10:00:00Z', note: 'Package picked up' },
    ];
    render(<OrderStatusTimeline currentStatus="Shipped" history={history} />);
    expect(screen.getByText(/Package picked up/)).toBeDefined();
  });

  it('highlights current step', () => {
    const { container } = render(<OrderStatusTimeline currentStatus="Shipped" />);
    const rings = container.querySelectorAll('.ring-4');
    expect(rings.length).toBeGreaterThan(0);
  });

  it('marks completed steps', () => {
    const { container } = render(<OrderStatusTimeline currentStatus="Delivered" />);
    const primaryBgs = container.querySelectorAll('.bg-primary');
    expect(primaryBgs.length).toBeGreaterThan(0);
  });
});
