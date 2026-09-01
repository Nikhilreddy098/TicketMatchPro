import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { getUserConversations } from '../../services/chat';
import { Conversation } from '../../types/database';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Avatar } from '../../components/Avatar';
import { COLORS } from '../../constants/colors';
import { formatDate } from '../../utils/formatting';
import { FONTS } from '../../constants/typography';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserConversations(user.id);
      setConversations(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return (
    <View style={styles.container}>
      {loading ? (
        <Loading message="Loading messages..." />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No Messages Yet"
          description="Direct message sellers or buyers to negotiate ticket purchases and exchange arrangements."
          buttonTitle="Search Tickets"
          onButtonPress={() => router.push('/(tabs)/search')}
          icon={<MessageSquare size={36} color={COLORS.primary} />}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchConversations} tintColor={COLORS.primary} />}
          renderItem={({ item }) => {
            const otherParty = item.participants.find((p) => p.id !== user?.id) || item.participants[0];

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                <Avatar url={otherParty?.avatar_url} name={otherParty?.full_name} size={48} isVerified={otherParty?.is_verified} />
                <View style={styles.contentArea}>
                  <View style={styles.topRow}>
                    <Text style={styles.name}>{otherParty?.full_name || 'Ticket Trader'}</Text>
                    {item.last_message_at && (
                      <Text style={styles.timestamp}>{formatDate(item.last_message_at)}</Text>
                    )}
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.last_message || 'Tap to start conversation'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  contentArea: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  lastMessage: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
