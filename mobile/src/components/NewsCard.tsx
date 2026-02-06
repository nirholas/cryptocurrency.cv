import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Article } from '../api/client';

interface NewsCardProps {
  article: Article;
  compact?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NewsCard({ article, compact = false }: NewsCardProps) {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    navigation.navigate('Article', {
      url: article.link,
      title: article.title,
    });
  };

  const styles = createStyles(isDark, compact);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {article.image && !compact && (
        <Image source={{ uri: article.image }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.source}>{article.source}</Text>
          <Text style={styles.time}>{article.timeAgo}</Text>
        </View>
        <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
          {article.title}
        </Text>
        {article.description && !compact && (
          <Text style={styles.description} numberOfLines={2}>
            {article.description}
          </Text>
        )}
        {article.ticker && (
          <View style={styles.tickerBadge}>
            <Text style={styles.tickerText}>${article.ticker}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (isDark: boolean, compact: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    image: {
      width: '100%',
      height: 180,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    content: {
      padding: compact ? 12 : 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    source: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
      textTransform: 'uppercase',
    },
    time: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
      lineHeight: compact ? 20 : 22,
    },
    description: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      marginTop: 8,
      lineHeight: 20,
    },
    tickerBadge: {
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    tickerText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
  });
