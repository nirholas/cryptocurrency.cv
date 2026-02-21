import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import MarketsScreen from './src/screens/MarketsScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ArticleScreen from './src/screens/ArticleScreen';

// Types
export type RootStackParamList = {
  Main: undefined;
  Article: { url: string; title: string };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Markets: undefined;
  Alerts: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Custom dark theme
const CryptoDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#f7931a',
    background: '#0a0a0a',
    card: '#1a1a1a',
    text: '#ffffff',
    border: '#2a2a2a',
    notification: '#f7931a',
  },
};

// Custom light theme
const CryptoLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#f7931a',
    background: '#ffffff',
    card: '#f5f5f5',
    text: '#000000',
    border: '#e0e0e0',
    notification: '#f7931a',
  },
};

function TabNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof TabParamList } }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Markets':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f7931a',
        tabBarInactiveTintColor: isDark ? '#888' : '#666',
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderTopColor: isDark ? '#2a2a2a' : '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'News' }} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? CryptoDarkTheme : CryptoLightTheme}>
      <StatusBar style="auto" />
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Article" 
          component={ArticleScreen}
          options={({ route }: { route: { params: RootStackParamList['Article'] } }) => ({ 
            title: route.params.title,
            headerBackTitle: 'Back',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

