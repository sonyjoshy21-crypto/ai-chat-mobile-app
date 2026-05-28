import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MessageBubble({ message, isNewAI }) {
  const { sender, text, createdAt } = message;
  const isUser = sender === 'user';
  
  // Streaming state for typing effect
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    // If it's a new AI message, stream the characters
    if (!isUser && isNewAI) {
      let currentIdx = 0;
      const interval = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(currentIdx));
        currentIdx++;
        if (currentIdx >= text.length) {
          clearInterval(interval);
        }
      }, 15); // Fast typing cadence (15ms per character)
      return () => clearInterval(interval);
    } else {
      setDisplayedText(text);
    }
  }, [text, isUser, isNewAI]);

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
          <Text style={styles.aiBadgeText}>🤖 Gemini AI</Text>
        </View>
      )}

      {/* Bubble Box */}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {displayedText}
        </Text>
        
        {/* Timestamp */}
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
          {formatTime(createdAt)}
        </Text>
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
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTimestamp: {
    color: '#64748b',
  },
});
