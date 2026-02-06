import React, { useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Text,
  useColorScheme,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NewsCard from '../components/NewsCard';
import { useSearch } from '../hooks/useNews';
import type { Article } from '../api/client';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [query, setQuery] = useState('');
  const { articles, loading, error } = useSearch(query);

  const styles = createStyles(isDark);

  const recentSearches = ['Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Regulation', 'SEC'];

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
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? '#666' : '#999'}
              onPress={() => setQuery('')}
            />
          )}
        </View>
      </View>

      {/* Results or Suggestions */}
      {query.length === 0 ? (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Popular Searches</Text>
          <View style={styles.chips}>
            {recentSearches.map((term) => (
              <Text
                key={term}
                style={styles.chip}
                onPress={() => {
                  setQuery(term);
                  Keyboard.dismiss();
                }}
              >
                {term}
              </Text>
            ))}
          </View>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={isDark ? '#666' : '#999'} />
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      ) : (
        <FlatList<Article>
          data={articles}
          keyExtractor={(item: Article, index: number) => `${item.link}-${index}`}
          renderItem={({ item }: { item: Article }) => <NewsCard article={item} compact />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
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
    suggestions: {
      padding: 16,
    },
    suggestionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
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
    list: {
      paddingBottom: 20,
    },
  });
