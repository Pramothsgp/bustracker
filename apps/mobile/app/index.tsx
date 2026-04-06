import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user?.role === 'conductor') {
      router.replace('/(conductor)/dashboard');
    } else if (user?.role === 'driver') {
      router.replace('/(driver)/dashboard');
    } else {
      router.replace('/(user)/(tabs)/map');
    }
  }, [user, loading]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#1d4ed8" />
    </View>
  );
}
