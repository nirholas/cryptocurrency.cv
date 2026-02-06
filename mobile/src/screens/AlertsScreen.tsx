import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Alert {
  id: string;
  type: 'price' | 'news' | 'sentiment';
  asset: string;
  condition: string;
  enabled: boolean;
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'price', asset: 'BTC', condition: 'Above $100,000', enabled: true },
  { id: '2', type: 'price', asset: 'ETH', condition: 'Below $3,000', enabled: true },
  { id: '3', type: 'news', asset: 'SOL', condition: 'Breaking news', enabled: false },
  { id: '4', type: 'sentiment', asset: 'BTC', condition: 'Sentiment changes', enabled: true },
];

export default function AlertsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const styles = createStyles(isDark);

  const toggleAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'price': return 'trending-up';
      case 'news': return 'newspaper';
      case 'sentiment': return 'pulse';
      default: return 'notifications';
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <View style={styles.alertCard}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon(item.type)} size={24} color="#ffffff" />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertAsset}>${item.asset}</Text>
        <Text style={styles.alertCondition}>{item.condition}</Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={() => toggleAlert(item.id)}
        trackColor={{ false: isDark ? '#2a2a2a' : '#e0e0e0', true: '#ffffff' }}
        thumbColor={item.enabled ? '#ffffff' : isDark ? '#888' : '#f4f4f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Price Alerts</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={isDark ? '#444' : '#ccc'} />
          <Text style={styles.emptyTitle}>No Alerts</Text>
          <Text style={styles.emptyText}>
            Create price alerts to get notified when your favorite coins move.
          </Text>
        </View>
      ) : (
        <FlatList<Alert>
          data={alerts}
          keyExtractor={(item: Alert) => item.id}
          renderItem={renderAlert}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#ffffff" />
        <Text style={styles.infoText}>
          Alerts are powered by the Free Crypto News API and delivered in real-time.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
    },
    addButton: {
      backgroundColor: '#ffffff',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      padding: 16,
      gap: 12,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(247, 147, 26, 0.15)' : 'rgba(247, 147, 26, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    alertContent: {
      flex: 1,
    },
    alertAsset: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
    },
    alertCondition: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginTop: 2,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(247, 147, 26, 0.1)' : 'rgba(247, 147, 26, 0.05)',
      margin: 16,
      padding: 16,
      borderRadius: 12,
      gap: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      lineHeight: 18,
    },
  });
