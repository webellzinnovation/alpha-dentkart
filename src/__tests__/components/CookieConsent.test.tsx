import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CookieConsent from '../../../components/CookieConsent';

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render immediately', () => {
    render(<CookieConsent />);
    expect(screen.queryByText(/We use essential cookies/)).toBeNull();
  });

  it('renders after delay when no consent stored', () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/We use essential cookies/)).toBeDefined();
  });

  it('does not render after delay when consent already stored', () => {
    localStorage.setItem('alpha_cookie_consent', 'accepted');
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText(/We use essential cookies/)).toBeNull();
  });

  it('shows Accept and Decline buttons', () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Accept')).toBeDefined();
    expect(screen.getByText('Decline')).toBeDefined();
  });

  it('hides banner and stores accepted on Accept click', () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByText('Accept'));
    expect(screen.queryByText(/We use essential cookies/)).toBeNull();
    expect(localStorage.getItem('alpha_cookie_consent')).toBe('accepted');
  });

  it('hides banner and stores declined on Decline click', () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByText('Decline'));
    expect(screen.queryByText(/We use essential cookies/)).toBeNull();
    expect(localStorage.getItem('alpha_cookie_consent')).toBe('declined');
  });

  it('links to privacy policy', () => {
    render(<CookieConsent />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    const link = screen.getByText('Privacy Policy');
    expect(link.getAttribute('href')).toBe('/privacy-policy');
  });
});
