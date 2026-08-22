import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ChatMessage, Conversation } from '../types/database';
import { generateUniqueId } from '../utils/helpers';

let localConversations: Conversation[] = [
  {
    id: 'conv-1',
    ticket_id: 't-101',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_message: 'Is the VIP Gold ticket still available for 2800?',
    last_message_at: new Date().toISOString(),
    participants: [
      {
        id: 'demo-user-123',
        full_name: 'Demo User',
        email: 'demo@ticketmatchpro.app',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        rating: 4.9,
        total_sales: 10,
        total_purchases: 8,
        total_exchanges: 4,
        is_verified: true,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'u-1',
        full_name: 'Rahul Sharma',
        email: 'rahul@example.com',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        rating: 4.9,
        total_sales: 12,
        total_purchases: 4,
        total_exchanges: 3,
        is_verified: true,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    unread_count: 1,
  },
];

let localMessages: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'm-1',
      conversation_id: 'conv-1',
      sender_id: 'u-1',
      content: 'Hi! Yes, the Summer Beats ticket is available. Are you looking to buy or exchange?',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'm-2',
      conversation_id: 'conv-1',
      sender_id: 'demo-user-123',
      content: 'Is the VIP Gold ticket still available for 2800?',
      created_at: new Date().toISOString(),
    },
  ],
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('conversation_members')
        .select('conversation:conversations(*)')
        .eq('user_id', userId);
      if (!error && data) return data.map((d: any) => d.conversation) as Conversation[];
    } catch (e) {}
  }
  return localConversations;
};

export const getConversationMessages = async (conversationId: string): Promise<ChatMessage[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (!error && data) return data as ChatMessage[];
    } catch (e) {}
  }
  return localMessages[conversationId] || [];
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> => {
  const newMsg: ChatMessage = {
    id: generateUniqueId('msg'),
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('messages').insert(newMsg);
      await supabase.from('conversations').update({
        last_message: content,
        last_message_at: newMsg.created_at,
      }).eq('id', conversationId);
    } catch (e) {}
  }

  if (!localMessages[conversationId]) {
    localMessages[conversationId] = [];
  }
  localMessages[conversationId].push(newMsg);

  const conv = localConversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.last_message = content;
    conv.last_message_at = newMsg.created_at;
  }

  return newMsg;
};

export const startConversation = async (ticketId: string, senderId: string, receiverId: string): Promise<Conversation> => {
  const existing = localConversations.find((c) => c.ticket_id === ticketId);
  if (existing) return existing;

  const newConv: Conversation = {
    id: generateUniqueId('conv'),
    ticket_id: ticketId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_message: 'Started a chat regarding ticket',
    last_message_at: new Date().toISOString(),
    participants: [
      {
        id: senderId,
        full_name: 'You',
        email: 'user@app.com',
        rating: 5.0,
        total_sales: 0,
        total_purchases: 0,
        total_exchanges: 0,
        is_verified: true,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  };

  localConversations.unshift(newConv);
  localMessages[newConv.id] = [];
  return newConv;
};
