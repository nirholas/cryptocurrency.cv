import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../App';

type ArticleRouteProp = RouteProp<RootStackParamList, 'Article'>;

export default function ArticleScreen() {
  const navigation = useNavigation();
  const route = useRoute<ArticleRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { url, title } = route.params;
  const styles = createStyles(isDark);

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `${title}\n\n${url}`,
        url: url,
        title: title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenExternal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // This would open in external browser
    // Linking.openURL(url);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleOpenExternal}>
            <Ionicons name="open-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading article...</Text>
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={true}
        decelerationRate="normal"
        onError={(syntheticEvent: { nativeEvent: { description: string } }) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
    },
    webview: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      padding: 8,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
    },
    loadingText: {
      marginTop: 12,
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
  });
