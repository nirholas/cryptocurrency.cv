import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface SettingItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'link' | 'button';
  value?: boolean;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);
  const [haptics, setHaptics] = useState(true);

  const styles = createStyles(isDark);

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const sections = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get alerts for breaking news',
          type: 'toggle' as const,
          value: notifications,
          onPress: () => setNotifications(!notifications),
        },
        {
          id: 'darkMode',
          icon: 'moon',
          title: 'Dark Mode',
          subtitle: 'Use system setting',
          type: 'toggle' as const,
          value: darkMode,
          onPress: () => setDarkMode(!darkMode),
        },
        {
          id: 'haptics',
          icon: 'phone-portrait',
          title: 'Haptic Feedback',
          subtitle: 'Vibration on interactions',
          type: 'toggle' as const,
          value: haptics,
          onPress: () => setHaptics(!haptics),
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          id: 'docs',
          icon: 'book',
          title: 'API Documentation',
          subtitle: 'Learn how to build with our API',
          type: 'link' as const,
          onPress: () => openLink('https://cryptocurrency.cv/docs'),
        },
        {
          id: 'github',
          icon: 'logo-github',
          title: 'GitHub Repository',
          subtitle: 'Star us on GitHub',
          type: 'link' as const,
          onPress: () => openLink('https://github.com/AItoolsbyai/free-crypto-news'),
        },
        {
          id: 'website',
          icon: 'globe',
          title: 'Website',
          subtitle: 'cryptocurrency.cv',
          type: 'link' as const,
          onPress: () => openLink('https://cryptocurrency.cv'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          icon: 'information-circle',
          title: 'Version',
          subtitle: '1.0.0',
          type: 'button' as const,
        },
        {
          id: 'privacy',
          icon: 'shield-checkmark',
          title: 'Privacy Policy',
          type: 'link' as const,
          onPress: () => openLink('https://cryptocurrency.cv/privacy'),
        },
        {
          id: 'terms',
          icon: 'document-text',
          title: 'Terms of Service',
          type: 'link' as const,
          onPress: () => openLink('https://cryptocurrency.cv/terms'),
        },
      ],
    },
  ];

  const renderItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.item}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={22} color="#ffffff" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{ false: isDark ? '#2a2a2a' : '#e0e0e0', true: '#ffffff' }}
          thumbColor={item.value ? '#ffffff' : isDark ? '#888' : '#f4f4f4'}
        />
      )}
      {item.type === 'link' && (
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#999'} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>₿</Text>
          </View>
          <Text style={styles.appName}>Crypto News</Text>
          <Text style={styles.appDesc}>Powered by Free Crypto News API</Text>
        </View>

        {/* Settings Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderItem)}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for the crypto community</Text>
          <Text style={styles.footerCopyright}>© 2025 Free Crypto News API</Text>
        </View>
      </ScrollView>
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
      alignItems: 'center',
      paddingVertical: 32,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    logoIcon: {
      fontSize: 40,
      color: '#ffffff',
      fontWeight: '700',
    },
    appName: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
    },
    appDesc: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    sectionContent: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      marginHorizontal: 16,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(247, 147, 26, 0.15)' : 'rgba(247, 147, 26, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#000000',
    },
    itemSubtitle: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      marginTop: 2,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    footerText: {
      fontSize: 14,
      color: isDark ? '#666' : '#999',
    },
    footerCopyright: {
      fontSize: 12,
      color: isDark ? '#444' : '#ccc',
      marginTop: 8,
    },
  });
