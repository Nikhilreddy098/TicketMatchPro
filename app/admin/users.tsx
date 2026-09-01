import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getAdminUsers } from '../../services/admin';
import { UserProfile } from '../../types/user';
import { Avatar } from '../../components/Avatar';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getAdminUsers();
      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleDisableUser = (user: UserProfile) => {
    Alert.alert('Disable User Account', `Are you sure you want to suspend access for ${user.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Account Suspended', `User ${user.full_name} has been disabled.`);
        },
      },
    ]);
  };

  if (loading) return <Loading message="Loading user directory..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Avatar url={item.avatar_url} name={item.full_name} size={44} isVerified={item.is_verified} />
            <View style={styles.userMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <Text style={styles.roleTag}>{item.role.toUpperCase()}</Text>
              </View>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userStats}>
                ★ {item.rating} • {item.total_sales} sales • {item.total_exchanges} exchanges
              </Text>
            </View>

            {item.role !== 'admin' && (
              <TouchableOpacity style={styles.suspendBtn} onPress={() => handleDisableUser(item)}>
                <Text style={styles.suspendText}>Suspend</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  userMeta: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  roleTag: {
    color: COLORS.secondary,
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    marginLeft: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  userStats: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  suspendBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  suspendText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
});
