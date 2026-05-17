import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('alpha_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  const isLoggedIn = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem('alpha_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('alpha_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('isAdmin', String(isAdmin));
  }, [isAdmin]);

  // Cleanup lingering demo user from localStorage
  useEffect(() => {
    if (user && (user.email === 'rajesh@dentkart.com' || user.name === 'Dr. Rajesh Koothrappali')) {
      console.log("Cleaning up demo user");
      setUser(null);
      localStorage.removeItem('alpha_user');
      window.location.reload();
    }
  }, [user]);

  return {
    isLoggedIn,
    user,
    setUser,
    isAdmin,
    setIsAdmin
  };
};
