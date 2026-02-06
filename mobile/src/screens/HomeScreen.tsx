import React, { useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewsCard from '../components/NewsCard';
import { useNews, useBreakingNews, useTrending } from '../hooks/useNews';
import { useFearGreed, useSentiment } from '../hooks/useMarket';
import FearGreedGauge from '../components/FearGreedGauge';
import SentimentBadge from '../components/SentimentBadge';
import type { Article } from '../api/client';

type Tab = 'latest' | 'breaking' | 'trending';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('latest');

  const latestNews = useNews({ limit: 30, autoRefresh: true, refreshInterval: 60000 });
  const breakingNews = useBreakingNews(10);
  const trendingNews = useTrending(10);
  const fearGreed = useFearGreed();
  const sentiment = useSentiment();

  const getActiveData = () => {
    switch (activeTab) {
      case 'breaking': return breakingNews;
      case 'trending': return trendingNews;
      default: return latestNews;
    }
  };

  const activeData = getActiveData();
  const styles = createStyles(isDark);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Fear & Greed Gauge */}
      {fearGreed.data && <FearGreedGauge data={fearGreed.data} />}
      
      {/* Market Sentiment */}
      {sentiment.sentiment && <SentimentBadge sentiment={sentiment.sentiment} />}
      
      {/* Tabs */}
      <View style={styles.tabs}>
        {(['latest', 'breaking', 'trending'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'latest' ? '📰 Latest' : tab === 'breaking' ? '🔴 Breaking' : '🔥 Trending'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (activeData.loading && activeData.articles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList<Article>
        data={activeData.articles}
        keyExtractor={(item: Article, index: number) => `${item.link}-${index}`}
        renderItem={({ item }: { item: Article }) => <NewsCard article={item} />}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={activeData.loading}
            onRefresh={activeData.refresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
        onEndReached={activeTab === 'latest' ? latestNews.loadMore : undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    header: {
      paddingTop: 8,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      gap: 8,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    },
    activeTab: {
      backgroundColor: '#ffffff',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
    },
    activeTabText: {
      color: '#ffffff',
    },
    list: {
      paddingBottom: 20,
    },
  });
