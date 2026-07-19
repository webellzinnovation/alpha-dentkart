import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import TermsOfService from '../../../components/TermsOfService';

describe('TermsOfService', () => {
  it('renders title', () => {
    render(<TermsOfService />);
    expect(screen.getByText('Terms of Service')).toBeDefined();
  });

  it('displays last updated date', () => {
    render(<TermsOfService />);
    expect(screen.getByText(/Last Updated: February 2026/)).toBeDefined();
  });

  it('renders all 9 sections', () => {
    render(<TermsOfService />);
    expect(screen.getByText(/1\. Acceptance of Terms/)).toBeDefined();
    expect(screen.getByText(/2\. Account Registration/)).toBeDefined();
    expect(screen.getByText(/3\. Orders & Payments/)).toBeDefined();
    expect(screen.getByText(/4\. Shipping & Delivery/)).toBeDefined();
    expect(screen.getByText(/5\. Cancellations & Returns/)).toBeDefined();
    expect(screen.getByText(/6\. Intellectual Property/)).toBeDefined();
    expect(screen.getByText(/7\. Limitation of Liability/)).toBeDefined();
    expect(screen.getByText(/8\. Governing Law/)).toBeDefined();
    expect(screen.getByText(/9\. Contact/)).toBeDefined();
  });

  it('mentions key policies', () => {
    render(<TermsOfService />);
    expect(screen.getByText(/Indian Rupees/)).toBeDefined();
    expect(screen.getByText(/Razorpay/)).toBeDefined();
    expect(screen.getByText(/Shiprocket/)).toBeDefined();
  });

  it('displays contact email', () => {
    render(<TermsOfService />);
    const emailLink = screen.getByText('sales@alphadentkart.com');
    expect(emailLink).toBeDefined();
    expect(emailLink.getAttribute('href')).toBe('mailto:sales@alphadentkart.com');
  });

  it('mentions governing law jurisdiction', () => {
    render(<TermsOfService />);
    expect(screen.getByText(/courts in New Delhi, India/)).toBeDefined();
  });
});
