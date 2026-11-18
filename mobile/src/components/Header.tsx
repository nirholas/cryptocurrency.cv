/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = 'Crypto News', subtitle }: HeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>₿</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#f7931a',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    logoIcon: {
      fontSize: 18,
      color: '#ffffff',
      fontWeight: '700',
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
    },
    subtitle: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      marginTop: 2,
    },
  });
