import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessageBubble({ message, isNewAI }) {
  const { sender, text, createdAt, isError } = message;
  const isUser = sender === 'user';
  
  // Streaming state for typing effect
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(!isUser && isNewAI);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    // If it's a new AI message, stream the characters
    if (!isUser && isNewAI) {
      setIsTyping(true);
      let currentIdx = 0;
      setDisplayedText('');
      
      intervalRef.current = setInterval(() => {
        setDisplayedText((prev) => {
          const nextText = prev + text.charAt(currentIdx);
          currentIdx++;
          if (currentIdx >= text.length) {
            clearInterval(intervalRef.current);
            setIsTyping(false);
          }
          return nextText;
        });
      }, 15); // Fast typing cadence (15ms per character)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setDisplayedText(text);
      setIsTyping(false);
    }
  }, [text, isUser, isNewAI]);

  const handleStopTyping = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsTyping(false);
    }
  };

  // Clean time formatter
  const formatTime = (timeStr) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <View style={[styles.container, isUser ? styles.userAlign : styles.aiAlign]}>
      {/* Sender Badge */}
      {!isUser && (
        <View style={styles.aiBadgeContainer}>
          <Text style={[styles.aiBadgeText, isError && styles.errorBadgeText]}>
            {isError ? '⚠️ System Alert' : '🤖 Addonez AI'}
          </Text>
        </View>
      )}

      {/* Bubble Box */}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.aiBubble,
        isError && styles.errorBubble
      ]}>
        <Text style={[
          styles.text, 
          isUser ? styles.userText : styles.aiText,
          isError && styles.errorText
        ]}>
          {displayedText}
        </Text>
        
        <View style={styles.bubbleFooter}>
          {/* Timestamp */}
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
            {formatTime(createdAt)}
          </Text>

          {/* Stop typing button */}
          {!isUser && isTyping && (
            <TouchableOpacity style={styles.bubbleStopBtn} onPress={handleStopTyping} activeOpacity={0.7}>
              <Ionicons name="stop-circle" size={14} color="#f87171" />
              <Text style={styles.bubbleStopText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    maxWidth: '85%',
    flexDirection: 'column',
  },
  userAlign: {
    alignSelf: 'flex-end',
  },
  aiAlign: {
    alignSelf: 'flex-start',
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
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#1e1f2b',
    borderWidth: 1,
    borderColor: '#2b2d42',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#ffffff',
    fontWeight: '400',
  },
  aiText: {
    color: '#e2e8f0',
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 10,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTimestamp: {
    color: '#64748b',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  bubbleStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 10,
  },
  bubbleStopText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  errorBubble: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
  },
  errorText: {
    color: '#fca5a5',
    fontWeight: '500',
  },
  errorBadgeText: {
    color: '#ef4444',
  },
});
