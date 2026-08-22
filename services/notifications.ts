import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppNotification } from '../types/database';
import { generateUniqueId } from '../utils/helpers';

let localNotifications: AppNotification[] = [
  {
    id: 'n-1',
    user_id: 'demo-user-123',
    title: 'Ticket Exchange Request',
    body: 'Rahul Sharma sent an exchange request for your Summer Beats ticket.',
    type: 'exchange',
    is_read: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'n-2',
    user_id: 'demo-user-123',
    title: 'Order Confirmed! 🎉',
    body: 'Your ticket order for Bengaluru Music Fest has been completed successfully.',
    type: 'order',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'n-3',
    user_id: 'demo-user-123',
    title: 'New Message Received',
    body: 'Priya Sundaram replied: Is the front row ticket still available?',
    type: 'chat',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const getUserNotifications = async (userId: string): Promise<AppNotification[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as AppNotification[];
    } catch (e) {}
  }

  return localNotifications;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    } catch (e) {}
  }

  const notif = localNotifications.find((n) => n.id === notificationId);
  if (notif) notif.is_read = true;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    } catch (e) {}
  }

  localNotifications.forEach((n) => (n.is_read = true));
};

export const createNotification = async (
  userId: string,
  title: string,
  body: string,
  type: AppNotification['type'],
  data?: Record<string, any>
): Promise<AppNotification> => {
  const notif: AppNotification = {
    id: generateUniqueId('notif'),
    user_id: userId,
    title,
    body,
    type,
    data,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('notifications').insert(notif);
    } catch (e) {}
  }

  localNotifications.unshift(notif);
  return notif;
};
