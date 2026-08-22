import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/database';
import { getConversationMessages, sendMessage as sendMsgService } from '../services/chat';

export const useChat = (conversationId: string, currentUserId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const send = async (content: string) => {
    if (!content.trim() || !conversationId) return;
    const newMsg = await sendMsgService(conversationId, currentUserId, content);
    setMessages((prev) => [...prev, newMsg]);
  };

  return { messages, loading, send, refetch: fetchMessages };
};
