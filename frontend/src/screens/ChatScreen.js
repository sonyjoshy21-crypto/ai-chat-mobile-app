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
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI, setAuthToken } from '../services/api';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import MessageBubble from '../components/MessageBubble';
import VoiceIndicator from '../components/VoiceIndicator';

// Safely require expo-speech-recognition native module to prevent startup crashes in Expo Go
let ExpoSpeechRecognitionModule = null;
try {
  const SpeechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = SpeechModule.ExpoSpeechRecognitionModule;
} catch (e) {
  console.warn("ExpoSpeechRecognition native module is not available in this environment. Falling back to MERN backend transcription.");
}

const isNativeSTTAvailable = !!(
  ExpoSpeechRecognitionModule && 
  typeof ExpoSpeechRecognitionModule.start === 'function'
);

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
  const abortControllerRef = useRef(null);
  const simulatedVoiceTimeoutRef = useRef(null);
  const isSendingRef = useRef(false);
  const recordingRef = useRef(null);

  // 1. Fetch chat history on component load & restore token on mount/Fast Refresh
  useEffect(() => {
    if (user && user.token) {
      setAuthToken(user.token);
    }
    fetchHistory();
  }, [user]);

  // Unified voice speech recognition listeners for Web, iOS, and Android
  useEffect(() => {
    if (!isNativeSTTAvailable) return;

    const startSub = ExpoSpeechRecognitionModule.addListener("start", () => {
      setRecordingVoice(true);
      setErrorMsg('');
    });

    const endSub = ExpoSpeechRecognitionModule.addListener("end", () => {
      setRecordingVoice(false);
    });

    const resultSub = ExpoSpeechRecognitionModule.addListener("result", (event) => {
      const recognizedText = event.results?.[0]?.transcript || "";
      if (recognizedText && recognizedText.trim() !== '') {
        setInputText(recognizedText);
        if (event.isFinal) {
          handleSendMessage(recognizedText);
        }
      }
    });

    const errorSub = ExpoSpeechRecognitionModule.addListener("error", (event) => {
      console.error("Speech recognition error:", event.error, event.message);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setErrorMsg(`Speech error: ${event.message || event.error}`);
      }
      setRecordingVoice(false);
    });

    return () => {
      startSub.remove();
      endSub.remove();
      resultSub.remove();
      errorSub.remove();
    };
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
    if (!trimmedText || isSendingRef.current) return;

    isSendingRef.current = true;
    setInputText('');
    setSendingMessage(true);
    setNewAiMsgId(null);
    setErrorMsg('');

    // Create abort controller for stopping generation
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
      const response = await chatAPI.sendMessage(trimmedText, controller.signal);
      
      // Update with matching backend objects (removes temp and adds Gemini reply)
      setMessages((prev) => {
        const filtered = prev.filter(m => !m._id.startsWith('temp_'));
        return [...filtered, response.userMessage, response.aiMessage];
      });
      
      // Mark AI message ID for streaming animation triggers
      setNewAiMsgId(response.aiMessage._id);
      scrollToBottom(50);
    } catch (err) {
      let finalErrorText = 'Failed to fetch AI reply.';
      if (err === 'cancelled') {
        finalErrorText = 'Generation stopped by user.';
      } else if (typeof err === 'string') {
        finalErrorText = err;
      }
      
      // Show the error message on screen in a temporary banner
      setErrorMsg(finalErrorText);

      // Restore user text in input bar so they don't have to retype it
      setInputText(trimmedText);

      // Cleanly remove speculative bubble on failure
      setMessages((prev) => prev.filter(m => !m._id.startsWith('temp_')));
    } finally {
      setSendingMessage(false);
      isSendingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // 4. Voice speech recognition (Unified Expo Speech Recognition with fallback to Backend Audio Upload in Expo Go)
  const handleVoiceRecordTrigger = async () => {
    if (sendingMessage) return;

    if (isNativeSTTAvailable) {
      try {
        const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) {
          setErrorMsg('Microphone and Speech Recognition permissions are required.');
          return;
        }

        setErrorMsg('');
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          continuous: false,
          interimResults: true,
        });
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setErrorMsg('Failed to initialize speech recognition.');
      }
    } else {
      // Fallback path: record audio using expo-av and upload to backend
      await startMobileRecording();
    }
  };

  const startMobileRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setErrorMsg('Microphone permission is required for voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordingVoice(true);
      setErrorMsg('');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setErrorMsg('Failed to access microphone. Please check system permissions.');
    }
  };

  const stopMobileRecordingAndTranscribe = async () => {
    if (isNativeSTTAvailable) {
      ExpoSpeechRecognitionModule.stop();
      setRecordingVoice(false);
      return;
    }

    // Fallback path
    if (!recordingRef.current) return;

    try {
      setRecordingVoice(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        // Read file as base64 string
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });

        const mimeType = 'audio/m4a';

        setSendingMessage(true);
        setNewAiMsgId(null);
        setErrorMsg('');

        // Append speculative user bubble
        const localUserMsg = {
          _id: 'temp_' + Date.now(),
          sender: 'user',
          text: '🎙️ Transcribing voice message...',
          createdAt: new Date()
        };
        setMessages((prev) => [...prev, localUserMsg]);
        scrollToBottom(50);

        try {
          const response = await chatAPI.transcribeVoice(base64Audio, mimeType);
          
          // Remove transcription temporary bubble
          setMessages((prev) => prev.filter(m => m._id !== localUserMsg._id));

          if (response.text && response.text.trim() !== '') {
            handleSendMessage(response.text);
          } else {
            setErrorMsg('Speech could not be transcribed or was empty.');
          }
        } catch (transcribeErr) {
          console.error('Transcription failed:', transcribeErr);
          setMessages((prev) => prev.filter(m => m._id !== localUserMsg._id));
          setErrorMsg(typeof transcribeErr === 'string' ? transcribeErr : 'Failed to transcribe audio.');
        } finally {
          setSendingMessage(false);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setRecordingVoice(false);
      recordingRef.current = null;
      setErrorMsg('Failed to process recorded audio.');
    }
  };

  const handleCancelVoiceRecording = async () => {
    if (isNativeSTTAvailable) {
      ExpoSpeechRecognitionModule.abort();
      setRecordingVoice(false);
      return;
    }

    // Fallback path
    if (recordingRef.current) {
      try {
        setRecordingVoice(false);
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      } catch (err) {
        console.error('Failed to cancel recording:', err);
        setRecordingVoice(false);
        recordingRef.current = null;
      }
    } else {
      setRecordingVoice(false);
    }
  };

  const handleKeyPress = (e) => {
    // Only capture Enter key on Web platform, and when Shift is NOT pressed
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Visual audio soundwave full-screen simulation overlay */}
      <VoiceIndicator 
        isRecording={recordingVoice} 
        onCancel={handleCancelVoiceRecording} 
        onDone={stopMobileRecordingAndTranscribe}
      />

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
          {errorMsg && messages.length > 0 && (
            <View style={styles.inlineErrorBanner}>
              <Ionicons name="warning-outline" size={16} color="#ef4444" />
              <Text style={styles.inlineErrorText}>{errorMsg}</Text>
              <TouchableOpacity onPress={() => setErrorMsg('')} style={styles.closeErrorBtn}>
                <Ionicons name="close" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}
          {loadingHistory ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color="#6366f1" size="large" />
              <Text style={styles.loadingText}>Syncing message logs...</Text>
            </View>
          ) : errorMsg && messages.length === 0 ? (
            <View style={styles.centerContainer}>
              {errorMsg.includes('stopped') ? (
                <Text style={styles.errorText}>🛑 {errorMsg}</Text>
              ) : (
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              )}
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
                    Start a conversation with Addonez AI. Ask questions about the MERN project, clean architecture, or general code quality.
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
                    <Text style={styles.aiBadgeText}>🤖 Addonez AI</Text>
                  </View>
                  <View style={styles.loadingBubble}>
                    <ActivityIndicator size="small" color="#818cf8" style={styles.loadingDots} />
                    <Text style={styles.loadingBubbleText}>Thinking...</Text>
                    <TouchableOpacity style={styles.stopBtn} onPress={handleStopGeneration} activeOpacity={0.7}>
                      <Ionicons name="stop-circle" size={18} color="#ef4444" style={styles.stopIcon} />
                      <Text style={styles.stopBtnText}>Stop</Text>
                    </TouchableOpacity>
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
            onKeyPress={handleKeyPress}
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
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 12,
  },
  stopIcon: {
    marginRight: 4,
  },
  stopBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600',
  },
  inlineErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1315',
    borderBottomWidth: 1,
    borderBottomColor: '#3d1d22',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inlineErrorText: {
    color: '#fca5a5',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  closeErrorBtn: {
    padding: 4,
  },
});
