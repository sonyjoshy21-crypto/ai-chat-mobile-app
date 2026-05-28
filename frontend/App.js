import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, SafeAreaView } from 'react-native';
import { ExpoStatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import { setAuthToken } from './src/services/api';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    // Revoke token caches
    setAuthToken(null);
    setUser(null);
  };

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
});
