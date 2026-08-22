import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { getAdminReports } from '../../services/admin';
import { Report } from '../../types/database';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatDate } from '../../utils/formatting';

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReports = async () => {
      const data = await getAdminReports();
      setReports(data);
      setLoading(false);
    };
    fetchReports();
  }, []);

  if (loading) return <Loading message="Loading reports..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.reason}>{item.reason}</Text>
            <Text style={styles.status}>STATUS: {item.status.toUpperCase()}</Text>
            <Text style={styles.date}>Reported on {formatDate(item.created_at)}</Text>
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  reason: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  status: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  date: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
