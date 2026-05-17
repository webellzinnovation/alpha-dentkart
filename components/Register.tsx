import React, { useState } from 'react';
import { authSchema } from '../utils/schemas';
import { z } from 'zod';

interface RegisterProps {
  onRegister: (data: any) => void;
  onNavigateToLogin: () => void;
}

type UserType = 'dental-doctor' | 'dental-student' | 'dental-business' | 'regular';

export const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('regular');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Conditional fields
  const [licenseId, setLicenseId] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [institution, setInstitution] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessName, setBusinessName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const registrationData: any = {
      name,
      email,
      password,
      userType
    };

    try {
      authSchema.parse(registrationData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
        return;
      }
    }

    setLoading(true);

    if (userType === 'dental-doctor') {
      registrationData.dentalDoctorInfo = {
        licenseId,
        licenseState,
        specialization
      };
    } else if (userType === 'dental-student') {
      registrationData.dentalStudentInfo = {
        institution,
        studentId
      };
    } else if (userType === 'dental-business') {
      registrationData.dentalBusinessInfo = {
        gstNumber,
        businessName
      };
    }

    onRegister(registrationData);
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-surface-dark p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join Alpha Dentkart to get started
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user text-gray-400"></i>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Type
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-800 dark:text-white"
              >
                <option value="regular">Regular Customer</option>
                <option value="dental-doctor">Dental Doctor</option>
                <option value="dental-student">Dental Student</option>
                <option value="dental-business">Dental Business (Clinic/Lab)</option>
              </select>
            </div>

            {/* Conditional Fields Based on User Type */}
            {userType === 'dental-doctor' && (
              <div className="space-y-4 animate-fade-in">
                <input
                  type="text"
                  placeholder="License ID"
                  required
                  value={licenseId}
                  onChange={(e) => setLicenseId(e.target.value)}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="License State"
                  required
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Specialization"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
              </div>
            )}

            {userType === 'dental-student' && (
              <div className="space-y-4 animate-fade-in">
                <input
                  type="text"
                  placeholder="Institution Name"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Student ID"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
              </div>
            )}

            {userType === 'dental-business' && (
              <div className="space-y-4 animate-fade-in">
                <input
                  type="text"
                  placeholder="Business Name"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="GST Number"
                  required
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                />
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-user-plus text-pink-200 group-hover:text-white transition-colors"></i>
              </span>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-medium text-primary hover:text-pink-700"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
