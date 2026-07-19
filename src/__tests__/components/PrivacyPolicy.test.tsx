import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivacyPolicy from '../../../components/PrivacyPolicy';

describe('PrivacyPolicy', () => {
  it('renders title', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText('Privacy Policy')).toBeDefined();
  });

  it('displays last updated date', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText(/Last Updated: February 2026/)).toBeDefined();
  });

  it('renders all 7 sections', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText(/1\. Information We Collect/)).toBeDefined();
    expect(screen.getByText(/2\. How We Use Your Information/)).toBeDefined();
    expect(screen.getByText(/3\. Data Sharing/)).toBeDefined();
    expect(screen.getByText(/4\. Data Security/)).toBeDefined();
    expect(screen.getByText(/5\. Your Rights/)).toBeDefined();
    expect(screen.getByText(/6\. Cookies/)).toBeDefined();
    expect(screen.getByText(/7\. Contact Us/)).toBeDefined();
  });

  it('mentions data processors', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText(/Razorpay/)).toBeDefined();
    expect(screen.getByText(/Shiprocket/)).toBeDefined();
    expect(screen.getByText(/Firebase/)).toBeDefined();
  });

  it('mentions Indian data protection laws', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText(/DPDP Act, 2023/)).toBeDefined();
    expect(screen.getByText(/IT Act, 2000/)).toBeDefined();
  });

  it('displays contact email', () => {
    render(<PrivacyPolicy />);
    const emailLink = screen.getByText('sales@alphadentkart.com');
    expect(emailLink).toBeDefined();
    expect(emailLink.getAttribute('href')).toBe('mailto:sales@alphadentkart.com');
  });

  it('mentions security measures', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText(/HTTPS/)).toBeDefined();
    expect(screen.getByText(/bcrypt/)).toBeDefined();
  });
});
