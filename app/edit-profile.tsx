import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/profile';
import { Avatar } from '../components/Avatar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>(user?.full_name || '');
  const [bio, setBio] = useState<string>(user?.bio || 'Verified event & ticket enthusiast');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        full_name: fullName,
        bio,
      });
      Alert.alert('Profile Saved', 'Your profile details have been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarSection}>
        <Avatar url={user?.avatar_url} name={fullName} size={84} isVerified={user?.is_verified} />
        <TouchableOpacity style={styles.changeAvatarBtn}>
          <Text style={styles.changeAvatarText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
        <Input
          label="Bio / Headline"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell buyers & sellers about yourself..."
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />
        <Input label="Email Address (Read Only)" value={user?.email} editable={false} style={{ opacity: 0.6 }} />

        <Button title="Save Profile Changes" onPress={handleSaveProfile} loading={loading} size="large" style={{ marginTop: 8 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  changeAvatarBtn: {
    marginTop: 10,
  },
  changeAvatarText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});
