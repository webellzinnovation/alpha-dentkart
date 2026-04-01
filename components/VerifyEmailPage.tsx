import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!token) {
        if (!mounted) return;
        setStatus('error');
        setMessage('This verification link is invalid.');
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        if (!mounted) return;
        setStatus('success');
        setMessage(response.message || 'Email verified successfully.');
      } catch (err: any) {
        if (!mounted) return;
        setStatus('error');
        setMessage(err.response?.data?.error || err.message || 'Failed to verify email.');
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-surface-dark p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${
            status === 'success' ? 'bg-green-100 text-green-600' :
            status === 'error' ? 'bg-red-100 text-red-600' :
            'bg-primary/10 text-primary'
          }`}>
            <i className={`fas ${
              status === 'success' ? 'fa-check-circle' :
              status === 'error' ? 'fa-times-circle' :
              'fa-spinner fa-spin'
            }`}></i>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Verification
          </h2>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full py-3 px-4 text-sm font-medium rounded-lg text-white bg-primary hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30 transition-all"
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
