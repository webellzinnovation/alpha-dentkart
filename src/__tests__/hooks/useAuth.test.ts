import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../../hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      reload: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with null user when no localStorage', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('initializes with user from localStorage', () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' };
    localStorage.setItem('alpha_user', JSON.stringify(mockUser));
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoggedIn).toBe(true);
  });

  it('persists user to localStorage on setUser', () => {
    const { result } = renderHook(() => useAuth());
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(JSON.parse(localStorage.getItem('alpha_user')!)).toEqual(mockUser);
  });

  it('removes user from localStorage when setUser(null)', () => {
    localStorage.setItem('alpha_user', JSON.stringify({ id: '1' }));
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setUser(null);
    });

    expect(localStorage.getItem('alpha_user')).toBeNull();
  });

  it('initializes isAdmin from localStorage', () => {
    localStorage.setItem('isAdmin', 'true');
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAdmin).toBe(true);
  });

  it('persists isAdmin to localStorage', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setIsAdmin(true);
    });
    expect(localStorage.getItem('isAdmin')).toBe('true');
  });

  it('cleans up demo user', () => {
    const demoUser = { id: '1', name: 'Dr. Rajesh Koothrappali', email: 'rajesh@dentkart.com' };
    localStorage.setItem('alpha_user', JSON.stringify(demoUser));
    const { result } = renderHook(() => useAuth());
    // The demo user cleanup effect should trigger
    expect(result.current.user).toBeNull();
  });
});
