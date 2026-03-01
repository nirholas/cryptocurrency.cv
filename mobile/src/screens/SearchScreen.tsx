/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NewsCard from '../components/NewsCard';
import Badge from '../components/Badge';
import { useSearch } from '../hooks/useNews';
import type { Article } from '../api/client';

const RECENT_SEARCHES_KEY = '@crypto_recent_searches';
const MAX_RECENT = 10;

const CATEGORIES = [
  { label: 'Bitcoin', value: 'bitcoin' },
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'DeFi', value: 'defi' },
  { label: 'NFT', value: 'nft' },
  { label: 'Solana', value: 'solana' },
  { label: 'Regulation', value: 'regulation' },
  { label: 'Market', value: 'market' },
  { label: 'Altcoins', value: 'altcoin' },
];

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { articles, loading, error } = useSearch(
    selectedCategory ? `${query} ${selectedCategory}`.trim() : query
  );

  const styles = createStyles(isDark);

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Silently fail
    }
  };

  const saveRecentSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail
    }
  }, [recentSearches]);

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    Keyboard.dismiss();
  };

  const handleCategoryPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const popularSearches = ['Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Regulation', 'SEC'];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={isDark ? '#888' : '#666'} />
          <TextInput
            style={styles.input}
            placeholder="Search crypto news..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => saveRecentSearch(query)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSelectedCategory(null); }}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value && styles.categoryChipActive,
            ]}
            onPress={() => handleCategoryPress(cat.value)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.value && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results or Suggestions */}
      {query.length === 0 && !selectedCategory ? (
        <ScrollView style={styles.suggestionsScroll}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chips}>
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.recentChip}
                    onPress={() => handleSearch(term)}
                  >
                    <Ionicons name="time-outline" size={14} color={isDark ? '#888' : '#666'} />
                    <Text style={styles.recentChipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.chips}>
              {popularSearches.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.chip}
                  onPress={() => handleSearch(term)}
                >
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f7931a" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={isDark ? '#666' : '#999'} />
          <Text style={styles.emptyText}>
            No results for "{selectedCategory || query}"
          </Text>
        </View>
      ) : (
        <FlatList<Article>
          data={articles}
          keyExtractor={(item: Article, index: number) => `${item.link}-${index}`}
          renderItem={({ item }: { item: Article }) => <NewsCard article={item} compact />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {articles.length} result{articles.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
    },
    searchContainer: {
      padding: 16,
      paddingBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#ffffff' : '#000000',
    },
    categoryContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    categoryChip: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? '#2a2a2a' : '#e0e0e0',
    },
    categoryChipActive: {
      backgroundColor: '#f7931a',
      borderColor: '#f7931a',
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#aaa' : '#666',
    },
    categoryChipTextActive: {
      color: '#ffffff',
    },
    suggestionsScroll: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      marginBottom: 12,
    },
    clearText: {
      fontSize: 13,
      color: '#f7931a',
      fontWeight: '500',
      marginBottom: 12,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    chipText: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000',
    },
    recentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      gap: 6,
    },
    recentChipText: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      marginTop: 12,
      color: '#ef4444',
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      marginTop: 12,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
      fontSize: 16,
    },
    resultCount: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    list: {
      paddingBottom: 20,
    },
  });
