import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('This password reset link is invalid.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token, password);
      setSuccess(response.message || 'Password reset successfully. Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-surface-dark p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fas fa-key"></i>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Set a new password for your account.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}

          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="sr-only">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="New password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-check text-gray-400"></i>
                </div>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-primary hover:text-pink-700"
            >
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
