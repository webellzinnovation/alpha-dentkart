import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '../../../components/Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer />);
    expect(screen.getAllByText(/Alpha Dentkart/).length).toBeGreaterThan(0);
  });

  it('displays copyright', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2023 Alpha Dentkart/)).toBeDefined();
  });

  it('renders contact info', () => {
    render(<Footer />);
    expect(screen.getByText(/Contact Us/)).toBeDefined();
    expect(screen.getByText(/\+91 98765 43210/)).toBeDefined();
    expect(screen.getByText(/sales@alphadentkart\.com/)).toBeDefined();
  });

  it('renders Information links', () => {
    render(<Footer />);
    expect(screen.getByText('Information')).toBeDefined();
    expect(screen.getByText('Shipping Policy')).toBeDefined();
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText('Terms of Service')).toBeDefined();
  });

  it('renders Account links', () => {
    render(<Footer />);
    expect(screen.getByText('Account')).toBeDefined();
    expect(screen.getByText('My Dashboard')).toBeDefined();
    expect(screen.getByText('Order History')).toBeDefined();
  });

  it('renders Top Brands', () => {
    render(<Footer />);
    expect(screen.getByText('Top Brands')).toBeDefined();
    expect(screen.getByText('3M')).toBeDefined();
    expect(screen.getByText('Kerr')).toBeDefined();
  });

  it('renders Subscribe section', () => {
    render(<Footer />);
    expect(screen.getByText('Subscribe for Updates')).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter your email address/)).toBeDefined();
  });

  it('renders payment icons', () => {
    const { container } = render(<Footer />);
    const visa = container.querySelector('.fa-cc-visa');
    expect(visa).not.toBeNull();
  });
});
