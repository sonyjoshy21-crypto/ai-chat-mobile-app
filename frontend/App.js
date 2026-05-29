import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, SafeAreaView, ActivityIndicator } from 'react-native';
import { ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import { setAuthToken } from './src/services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('@user_session');
        if (sessionData) {
          const parsedUser = JSON.parse(sessionData);
          if (parsedUser && parsedUser.token) {
            setAuthToken(parsedUser.token);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLoginSuccess = async (authenticatedUser) => {
    try {
      await AsyncStorage.setItem('@user_session', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Failed to persist authentication session:', error);
    }
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@user_session');
    } catch (error) {
      console.error('Failed to clear authentication session:', error);
    }
    // Revoke token caches
    setAuthToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0e15" />
        <View style={[styles.mainContainer, styles.centerContainer]}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Configure StatusBar color to coordinate with dark styling */}
      <StatusBar barStyle="light-content" backgroundColor="#0d0e15" />
      
      <View style={styles.mainContainer}>
        {!user ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <ChatScreen user={user} onLogout={handleLogout} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0e15',
  },
  mainContainer: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
