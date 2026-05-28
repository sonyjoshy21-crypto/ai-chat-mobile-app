import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI } from '../services/api';
import MessageBubble from '../components/MessageBubble';
import VoiceIndicator from '../components/VoiceIndicator';

export default function ChatScreen({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ID tracking for brand new AI responses to trigger typewriter animation
  const [newAiMsgId, setNewAiMsgId] = useState(null);

  const scrollViewRef = useRef();

  // 1. Fetch chat history on component load
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setErrorMsg('');
    try {
      const response = await chatAPI.getHistory();
      setMessages(response.history);
      scrollToBottom();
    } catch (err) {
      setErrorMsg('Could not sync chat history.');
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 2. Trigger auto-scrolling to bottom
  const scrollToBottom = (delay = 100) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  // 3. Send text message handler
  const handleSendMessage = async (textToSend = inputText) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText || sendingMessage) return;

    setInputText('');
    setSendingMessage(true);
    setNewAiMsgId(null);
    setErrorMsg('');

    // Append local speculative message immediately to keep UI ultra responsive
    const localUserMsg = {
      _id: 'temp_' + Date.now(),
      sender: 'user',
      text: trimmedText,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, localUserMsg]);
    scrollToBottom(50);

    try {
      const response = await chatAPI.sendMessage(trimmedText);
      
      // Update with matching backend objects (removes temp and adds Gemini reply)
      setMessages((prev) => {
        const filtered = prev.filter(m => !m._id.startsWith('temp_'));
        return [...filtered, response.userMessage, response.aiMessage];
      });
      
      // Mark AI message ID for streaming animation triggers
      setNewAiMsgId(response.aiMessage._id);
      scrollToBottom(50);
    } catch (err) {
      setErrorMsg('Failed to fetch AI reply.');
      // Remove speculative bubble on failure so user knows it failed
      setMessages((prev) => prev.filter(m => !m._id.startsWith('temp_')));
    } finally {
      setSendingMessage(false);
    }
  };

  // 4. Simulated interactive voice speech recognition
  const handleVoiceRecordTrigger = () => {
    if (sendingMessage) return;
    setRecordingVoice(true);

    // Bounces animation wave overlay for 2.5 seconds, then completes speech translation
    setTimeout(() => {
      setRecordingVoice(false);
      
      const simulatedSpeeches = [
        "Explain clean code architecture in this assessment.",
        "What are the benefits of using MongoDB?",
        "How is chat history persisted in this app?",
        "Explain Option A and Option B requirements."
      ];
      const selectedSpeech = simulatedSpeeches[Math.floor(Math.random() * simulatedSpeeches.length)];
      
      // Load speech results to text bar and trigger message submit
      setInputText(selectedSpeech);
      setTimeout(() => {
        handleSendMessage(selectedSpeech);
      }, 500);
    }, 2800);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Visual audio soundwave full-screen simulation overlay */}
      <VoiceIndicator isRecording={recordingVoice} />

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Sleek App Header Bar */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name || 'Evaluator Candidate'}</Text>
              <Text style={styles.userStatus}>● Online Assistant</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#fca5a5" />
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Core Chat Scroll View Box */}
        <View style={styles.chatArea}>
          {loadingHistory ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color="#6366f1" size="large" />
              <Text style={styles.loadingText}>Syncing message logs...</Text>
            </View>
          ) : errorMsg && messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
                <Text style={styles.retryText}>Retry Sync</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesList}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollToBottom()}
            >
              {messages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#475569" />
                  <Text style={styles.welcomeTitle}>Welcome, {user?.name}!</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Start a conversation with Google Gemini AI. Ask questions about the MERN project, clean architecture, or general code quality.
                  </Text>
                  <View style={styles.tipCard}>
                    <Text style={styles.tipTitle}>💡 Try typing these statements:</Text>
                    <Text style={styles.tipText}>• "Explain clean code and security"</Text>
                    <Text style={styles.tipText}>• "What database configuration is running?"</Text>
                    <Text style={styles.tipText}>• Or press the microphone to test simulated voice input!</Text>
                  </View>
                </View>
              ) : (
                messages.map((msg) => (
                  <MessageBubble 
                    key={msg._id} 
                    message={msg} 
                    isNewAI={msg._id === newAiMsgId}
                  />
                ))
              )}

              {/* Typing Response Loading Indicator */}
              {sendingMessage && (
                <View style={styles.loadingBubbleContainer}>
                  <View style={styles.aiBadgeContainer}>
                    <Text style={styles.aiBadgeText}>🤖 Gemini AI</Text>
                  </View>
                  <View style={styles.loadingBubble}>
                    <ActivityIndicator size="small" color="#818cf8" style={styles.loadingDots} />
                    <Text style={styles.loadingBubbleText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Input Bar Footer */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message to AI..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            editable={!sendingMessage && !recordingVoice}
            multiline
            maxLength={1000}
          />

          {/* Voice Input Mic Trigger */}
          <TouchableOpacity 
            style={[
              styles.iconBtn,
              inputText.trim() === '' ? styles.micActive : styles.micDisabled
            ]} 
            onPress={inputText.trim() === '' ? handleVoiceRecordTrigger : () => handleSendMessage()}
            disabled={sendingMessage || recordingVoice}
            activeOpacity={0.7}
          >
            {inputText.trim() === '' ? (
              <Ionicons name="mic" size={22} color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0e15',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1f2b',
    backgroundColor: '#0d0e15',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  userStatus: {
    color: '#34d399',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chatArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 15,
    backgroundColor: '#1e1f2b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 'auto',
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  welcomeSubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  tipCard: {
    backgroundColor: '#161722',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242637',
    padding: 16,
    marginTop: 25,
    width: '100%',
  },
  tipTitle: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 2,
  },
  loadingBubbleContainer: {
    alignSelf: 'flex-start',
    marginVertical: 6,
    maxWidth: '80%',
  },
  aiBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818cf8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loadingBubble: {
    backgroundColor: '#1e1f2b',
    borderWidth: 1,
    borderColor: '#2b2d42',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDots: {
    marginRight: 8,
  },
  loadingBubbleText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1f2b',
    backgroundColor: '#0d0e15',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#161722',
    borderWidth: 1.5,
    borderColor: '#242637',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micActive: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  micDisabled: {
    backgroundColor: '#10b981', // green for send
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});
