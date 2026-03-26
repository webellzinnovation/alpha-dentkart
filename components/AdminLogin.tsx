import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

interface AdminLoginProps {
  onAdminLogin: (user?: any) => void;
  onNavigateToUserLogin?: () => void;
  isAdmin?: boolean;
  user?: { name: string; email: string } | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onAdminLogin, onNavigateToUserLogin, isAdmin, user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already logged in as admin via localStorage
    if (typeof window !== 'undefined') {
      const storedIsAdmin = localStorage.getItem('isAdmin');
      const storedUser = localStorage.getItem('user');
      if (storedIsAdmin === 'true' && storedUser) {
        try {
          onAdminLogin(JSON.parse(storedUser));
        } catch (e) {
          onAdminLogin();
        }
      }
    }
  }, [onAdminLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
// Try API login
      const response = await authAPI.login(email, password);
      const user = response.user;

      if (user.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }

      onAdminLogin(user);
    } catch (err: any) {
      console.error('Admin login error:', err);

      // Check if it's a network error (backend not running)
      if (!err.response) {
        // Backend not available, but allow hardcoded credentials anyway
        setError('Server unavailable. Use test credentials: admin@alphadentkart.com / admin123');
        return;
      }

      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin credentials required.');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="flex flex-col justify-center items-center w-full text-gray-800 dark:text-white p-12">
          <div className="mb-8">
            <img
              src="/Alpha-dentkart-logo-600p.png"
              alt="Alpha DentKart"
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 text-center">Admin Portal</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-md">
            Manage your store, products, orders, and customers from one place.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 text-center">
            <div className="bg-primary/10 rounded-xl p-4">
              <i className="fas fa-box-open text-3xl mb-2 text-primary"></i>
              <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-4">
              <i className="fas fa-shopping-cart text-3xl mb-2 text-primary"></i>
              <p className="text-sm text-gray-600 dark:text-gray-400">Orders</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-4">
              <i className="fas fa-users text-3xl mb-2 text-primary"></i>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-4">
              <i className="fas fa-chart-bar text-3xl mb-2 text-primary"></i>
              <p className="text-sm text-gray-600 dark:text-gray-400">Analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="lg:hidden text-center mb-8">
            <img
              src="/Alpha-dentkart-logo-icon.png"
              alt="Alpha DentKart"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Portal</h2>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in with your admin credentials
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {(isAdmin || localStorage.getItem('isAdmin') === 'true') && user && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <i className="fas fa-check-circle text-xl"></i>
                  <span className="font-medium">You are already logged in</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Logged in as: <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                </p>
                <button
                  type="button"
                  onClick={() => window.location.hash = '#/admin-dashboard'}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Go to Admin Dashboard
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <i className="fas fa-exclamation-circle"></i>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400 hover:text-gray-500`}></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-pink-700">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin text-pink-200"></i>
                  ) : (
                    <i className="fas fa-sign-in-alt text-pink-200 group-hover:text-white transition-colors"></i>
                  )}
                </span>
                {isLoading ? 'Signing in...' : 'Sign in to Admin'}
              </button>
            </div>

            {onNavigateToUserLogin && (
              <div className="mt-6 text-center border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Not an admin?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToUserLogin}
                    className="font-medium text-primary hover:text-pink-700"
                  >
                    User Login
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
