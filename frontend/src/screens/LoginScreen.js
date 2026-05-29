import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { authAPI, setAuthToken } from '../services/api';

export default function LoginScreen({ onLoginSuccess, isServerConnected, resolvedBaseUrl }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [focusField, setFocusField] = useState(null);

  const handleSubmit = async () => {
    setErrorMsg('');
    
    // Validation checks
    if (isLogin) {
      if (!name.trim() || !password) {
        setErrorMsg('Please enter both username and password.');
        return;
      }
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setErrorMsg('Please fill in all credentials.');
        return;
      }
      if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
        setErrorMsg('Registration requires a Gmail address (@gmail.com).');
        return;
      }
    }

    if (password.length < 6) {
      setErrorMsg('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await authAPI.login(name.trim(), password);
        setAuthToken(response.token);
        onLoginSuccess({ ...response.user, token: response.token });
      } else {
        const response = await authAPI.register(name.trim(), email.trim(), password);
        setAuthToken(response.token);
        onLoginSuccess({ ...response.user, token: response.token });
      }
    } catch (error) {
      setErrorMsg(error.toString());
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Stylized Logo Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>A D D O N E Z</Text>
          <Text style={styles.logoSubText}>VISIONARY BUSINESS ARCHITECTS</Text>
          <View style={styles.divider} />
          <Text style={styles.screenTitle}>{isLogin ? 'Sign In to Assistant' : 'Create Account'}</Text>
          
          {/* Connection Status Badge */}
          <View style={[
            styles.statusBadge,
            isServerConnected ? styles.statusBadgeConnected : styles.statusBadgeDisconnected
          ]}>
            <Text style={[
              styles.statusBadgeText,
              isServerConnected ? styles.statusBadgeTextConnected : styles.statusBadgeTextDisconnected
            ]}>
              {isServerConnected ? '● Connected' : '● Offline'}
            </Text>
          </View>
        </View>

        {/* Input Form Fields */}
        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* Username Field (Sign In and Sign Up) */}
          <View style={styles.inputWrapper}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={[
                styles.input,
                focusField === 'name' && styles.inputFocused
              ]}
              placeholder={isLogin ? "Enter your username" : "Choose a username"}
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusField('name')}
              onBlur={() => setFocusField(null)}
              autoCapitalize="none"
            />
          </View>

          {/* Gmail Field (Sign Up Only) */}
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Gmail Address</Text>
              <TextInput
                style={[
                  styles.input,
                  focusField === 'email' && styles.inputFocused
                ]}
                placeholder="e.g. user@gmail.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusField('email')}
                onBlur={() => setFocusField(null)}
              />
            </View>
          )}

          {/* Password Field */}
          <View style={styles.inputWrapper}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[
                styles.input,
                focusField === 'password' && styles.inputFocused
              ]}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusField('password')}
              onBlur={() => setFocusField(null)}
            />
          </View>

          {/* Action CTA Button */}
          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? 'Authenticate Access' : 'Register Credentials'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Auth Screen Toggle Button */}
          <TouchableOpacity 
            style={styles.toggleBtn} 
            onPress={toggleAuthMode}
            disabled={loading}
          >
            <Text style={styles.toggleBtnText}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Evaluation Footer */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>Personal AI Assistant</Text>
          <Text style={styles.footerNoteSubText}>Secure Chat Interface</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0e15',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 6,
  },
  logoSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 2,
    marginTop: 4,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#6366f1',
    borderRadius: 2,
    marginVertical: 20,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 5,
  },
  formContainer: {
    marginVertical: 30,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorAlertText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#161722',
    borderWidth: 1.5,
    borderColor: '#242637',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 15,
  },
  inputFocused: {
    borderColor: '#6366f1',
    backgroundColor: '#1b1c2b',
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: 22,
    padding: 8,
  },
  toggleBtnText: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '500',
  },
  footerNote: {
    alignItems: 'center',
  },
  footerNoteText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerNoteSubText: {
    color: '#334155',
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
  },
  statusBadgeConnected: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  statusBadgeDisconnected: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadgeTextConnected: {
    color: '#34d399',
  },
  statusBadgeTextDisconnected: {
    color: '#f87171',
  },
});
