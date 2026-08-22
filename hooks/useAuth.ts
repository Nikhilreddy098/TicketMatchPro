import { useState, useEffect, createContext, useContext } from 'react';
import { UserProfile } from '../types/user';
import { getCurrentUserProfile, loginWithEmail, registerWithEmail, logoutUser, DEMO_USER } from '../services/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ user: UserProfile | null; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ user: UserProfile | null; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: DEMO_USER,
  isLoading: false,
  login: async () => ({ user: DEMO_USER }),
  register: async () => ({ user: DEMO_USER }),
  logout: async () => {},
  isAdmin: true,
});

export const useAuth = () => useContext(AuthContext);
