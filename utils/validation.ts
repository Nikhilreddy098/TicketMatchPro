import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const ticketListingSchema = z.object({
  eventName: z.string().min(3, 'Event name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  eventDate: z.string().min(1, 'Please select an event date'),
  eventTime: z.string().min(1, 'Please enter event time'),
  venue: z.string().min(2, 'Please enter venue name'),
  city: z.string().min(2, 'Please enter city'),
  ticketType: z.string().min(1, 'e.g. VIP, General Admission'),
  section: z.string().min(1, 'Section is required'),
  row: z.string().optional(),
  seat: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Max 10 tickets per listing'),
  originalPrice: z.number().min(1, 'Original price must be positive'),
  sellingPrice: z.number().min(1, 'Selling price must be positive'),
  description: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  bio: z.string().max(200, 'Bio must be under 200 characters').optional(),
});
