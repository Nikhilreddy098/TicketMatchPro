import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const result = await AuthService.login(email, password);
  if (result.error || !result.user) {
    return res.status(401).json({ success: false, error: result.error || 'Invalid login credentials.' });
  }

  return res.status(200).json({ success: true, data: result.user });
};

export const register = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
  }

  const result = await AuthService.register(fullName, email, password);
  if (result.error || !result.user) {
    return res.status(400).json({ success: false, error: result.error || 'Registration failed.' });
  }

  return res.status(201).json({ success: true, data: result.user });
};
