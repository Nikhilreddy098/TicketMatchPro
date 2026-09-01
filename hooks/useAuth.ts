import { useState, useEffect, createContext, useContext } from 'react';
import { UserProfile } from '../types/user';
import { getCurrentUserProfile, loginWithEmail, registerWithEmail, logoutUser } from '../services/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ user: UserProfile | null; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ user: UserProfile | null; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ user: null }),
  register: async () => ({ user: null }),
  logout: async () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);
