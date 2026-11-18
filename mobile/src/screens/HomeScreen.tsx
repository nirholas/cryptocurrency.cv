/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NewsCard from '../components/NewsCard';
import { useNews, useBreakingNews, useTrending } from '../hooks/useNews';
import { useFearGreed, useSentiment } from '../hooks/useMarket';
import FearGreedGauge from '../components/FearGreedGauge';
import SentimentBadge from '../components/SentimentBadge';
import type { Article } from '../api/client';

type Tab = 'latest' | 'breaking' | 'trending';

function BreakingBanner({ articles }: { articles: Article[] }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (!articles || articles.length === 0) return null;

  const topBreaking = articles[0];

  return (
    <View style={breakingStyles(isDark).banner}>
      <View style={breakingStyles(isDark).bannerHeader}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <View style={breakingStyles(isDark).liveDot} />
        </Animated.View>
        <Text style={breakingStyles(isDark).bannerLabel}>BREAKING</Text>
      </View>
      <Text style={breakingStyles(isDark).bannerTitle} numberOfLines={2}>
        {topBreaking.title}
      </Text>
      <Text style={breakingStyles(isDark).bannerSource}>
        {topBreaking.source} · {topBreaking.timeAgo}
      </Text>
    </View>
  );
}

const breakingStyles = (isDark: boolean) =>
  StyleSheet.create({
    banner: {
      backgroundColor: isDark ? '#1c0a0a' : '#fef2f2',
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
      borderRadius: 12,
      padding: 14,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    bannerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ef4444',
    },
    bannerLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#ef4444',
      letterSpacing: 1,
    },
    bannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
      lineHeight: 21,
    },
    bannerSource: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      marginTop: 6,
    },
  });

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
      {/* Breaking News Banner */}
      {breakingNews.articles.length > 0 && activeTab !== 'breaking' && (
        <TouchableOpacity onPress={() => setActiveTab('breaking')} activeOpacity={0.8}>
          <BreakingBanner articles={breakingNews.articles} />
        </TouchableOpacity>
      )}

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
            <View style={styles.tabContent}>
              <Ionicons
                name={
                  tab === 'latest'
                    ? 'newspaper-outline'
                    : tab === 'breaking'
                    ? 'radio-outline'
                    : 'flame-outline'
                }
                size={14}
                color={activeTab === tab ? '#ffffff' : isDark ? '#888' : '#666'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'latest' ? 'Latest' : tab === 'breaking' ? 'Breaking' : 'Trending'}
              </Text>
            </View>
            {tab === 'breaking' && breakingNews.articles.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{breakingNews.articles.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (activeData.loading && activeData.articles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f7931a" />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList<Article>
        data={activeData.articles}
        keyExtractor={(item: Article, index: number) => `${activeTab}-${item.link}-${index}`}
        renderItem={({ item }: { item: Article }) => <NewsCard article={item} />}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={activeData.loading}
            onRefresh={activeData.refresh}
            tintColor="#f7931a"
            colors={['#f7931a']}
          />
        }
        onEndReached={activeTab === 'latest' ? latestNews.loadMore : undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color={isDark ? '#444' : '#ccc'} />
            <Text style={styles.emptyText}>No news available</Text>
          </View>
        }
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      gap: 4,
    },
    activeTab: {
      backgroundColor: '#f7931a',
    },
    tabContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
    },
    activeTabText: {
      color: '#ffffff',
    },
    tabBadge: {
      backgroundColor: '#ef4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 5,
      marginLeft: 4,
    },
    tabBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '700',
    },
    list: {
      paddingBottom: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      marginTop: 12,
    },
  });
