
import React, { useState } from 'react';
import { authAPI } from '../utils/api';

interface ForgotPasswordProps {
  onNavigateBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
              <i className="fas fa-check-circle mr-2"></i>
              Password reset link has been sent to your email.
            </div>
            <button
              onClick={onNavigateBack}
              className="text-primary font-medium hover:underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className="fas fa-paper-plane mr-2"></i>
                )}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={onNavigateBack}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i> Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
