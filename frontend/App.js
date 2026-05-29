import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, SafeAreaView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import { setAuthToken, API_BASE_URL, updateApiBaseUrl } from './src/services/api';
import Constants from 'expo-constants';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [resolvedBaseUrl, setResolvedBaseUrl] = useState(API_BASE_URL);
  const [scanProgress, setScanProgress] = useState('');

  const checkServerHealth = async (baseUrl) => {
    try {
      const healthUrl = baseUrl.replace('/api', '') + '/health';
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      
      const response = await fetch(healthUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(id);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data && data.status === 'healthy') {
          return true;
        }
      }
    } catch (e) {
      // Ignore network errors
    }
    return false;
  };

  const getSubnetFromUrl = (url) => {
    const match = url.match(/https?:\/\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
    return null;
  };

  const runSubnetDiscovery = async () => {
    const subnetsToScan = [];
    
    // 1. Try to extract from current API URL
    const detectedSubnet = getSubnetFromUrl(API_BASE_URL);
    if (detectedSubnet) {
      subnetsToScan.push(detectedSubnet);
    }
    
    // 2. Try to extract from Metro host URI (vital for hotspots / local networks)
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.toolUrl;
    if (hostUri) {
      const match = hostUri.match(/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
      if (match) {
        const hostSubnet = `${match[1]}.${match[2]}.${match[3]}`;
        if (!subnetsToScan.includes(hostSubnet)) {
          subnetsToScan.push(hostSubnet);
        }
      }
    }
    
    const defaultSubnets = ['192.168.1', '192.168.0', '192.168.43', '172.20.10', '10.0.2'];
    for (const subnet of defaultSubnets) {
      if (!subnetsToScan.includes(subnet)) {
        subnetsToScan.push(subnet);
      }
    }

    const port = 5000;
    
    const probeIp = async (ipAddress) => {
      try {
        const healthUrl = `http://${ipAddress}:${port}/health`;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 850);
        
        const response = await fetch(healthUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(id);
        
        if (response.status === 200) {
          const data = await response.json();
          if (data && data.status === 'healthy') {
            return ipAddress;
          }
        }
      } catch (e) {
        // Ignore failure
      }
      return null;
    };

    for (const subnet of subnetsToScan) {
      setScanProgress(`Sweeping local network range ${subnet}.x...`);
      
      const batchSize = 25;
      for (let i = 1; i <= 254; i += batchSize) {
        const promises = [];
        const end = Math.min(i + batchSize - 1, 254);
        
        for (let host = i; host <= end; host++) {
          const ip = `${subnet}.${host}`;
          promises.push(probeIp(ip));
        }
        
        const results = await Promise.all(promises);
        const foundIp = results.find(res => res !== null);
        
        if (foundIp) {
          const newBaseUrl = `http://${foundIp}:${port}/api`;
          updateApiBaseUrl(newBaseUrl);
          setResolvedBaseUrl(newBaseUrl);
          setIsServerConnected(true);
          setIsScanning(false);
          return true;
        }
      }
    }
    
    setScanProgress('Backend server not found. Sweeping again...');
    return false;
  };

  useEffect(() => {
    let isMounted = true;
    
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
      }
    };

    const verifyConnection = async () => {
      setScanProgress('Connecting to backend...');
      const isHealthy = await checkServerHealth(API_BASE_URL);
      if (isHealthy) {
        if (isMounted) {
          setIsServerConnected(true);
          setIsScanning(false);
          setResolvedBaseUrl(API_BASE_URL);
          await restoreSession();
          setLoading(false);
        }
        return;
      }
      
      if (isMounted) {
        setIsScanning(true);
        await restoreSession();
        setLoading(false);
      }
      
      while (isMounted) {
        const found = await runSubnetDiscovery();
        if (found) break;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    };

    verifyConnection();

    return () => {
      isMounted = false;
    };
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

  if (isScanning) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0e15" />
        <View style={[styles.mainContainer, styles.centerContainer]}>
          <View style={styles.glassCard}>
            <View style={styles.pulseRing}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
            <Text style={styles.scanningTitle}>SEARCHING BACKEND</Text>
            <Text style={styles.scanningSubtitle}>
              Please ensure your PC and phone are on the same Wi-Fi or hotspot network.
            </Text>
            
            <View style={styles.progressBar}>
              <Text style={styles.progressText}>{scanProgress}</Text>
            </View>

            <TouchableOpacity 
              style={styles.retryBtn} 
              onPress={() => {
                updateApiBaseUrl(API_BASE_URL);
                setResolvedBaseUrl(API_BASE_URL);
                setScanProgress('Re-checking default server configuration...');
                checkServerHealth(API_BASE_URL).then(healthy => {
                  if (healthy) {
                    setIsServerConnected(true);
                    setIsScanning(false);
                  } else {
                    setScanProgress('Default server unavailable. Running auto-scan...');
                  }
                });
              }}
            >
              <Text style={styles.retryBtnText}>Retry Default IP</Text>
            </TouchableOpacity>
          </View>
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
          <LoginScreen 
            onLoginSuccess={handleLoginSuccess} 
            isServerConnected={isServerConnected}
            resolvedBaseUrl={resolvedBaseUrl}
          />
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(22, 23, 34, 0.8)',
    borderWidth: 1.5,
    borderColor: '#242637',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  pulseRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scanningTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  scanningSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressBar: {
    backgroundColor: '#161722',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#242637',
  },
  progressText: {
    color: '#a5b4fc',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '700',
  },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
});
