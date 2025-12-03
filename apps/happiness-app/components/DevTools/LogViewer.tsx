import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useLogStore, LogEntry } from '@/utils/Logger';
import { Colors } from '@/constants/Theme';

export function LogViewer() {
  const [visible, setVisible] = useState(false);
  const logs = useLogStore((state) => state.logs);
  const clearLogs = useLogStore((state) => state.clearLogs);

  if (!visible) {
    return (
      <Pressable
        style={styles.trigger}
        onLongPress={() => setVisible(true)}
        delayLongPress={1000}
      >
        <View style={styles.triggerDot} />
      </Pressable>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <BlurView intensity={90} tint="dark" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>App Logs</Text>
          <View style={styles.actions}>
            <Pressable onPress={clearLogs} style={styles.button}>
              <Ionicons name="trash-outline" size={20} color="white" />
            </Pressable>
            <Pressable onPress={() => setVisible(false)} style={styles.button}>
              <Ionicons name="close-circle" size={24} color="white" />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.logList}>
          {logs.map((log) => (
            <View key={log.id} style={[styles.logItem, styles[log.level]]}>
              <Text style={styles.timestamp}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.message}>{log.message}</Text>
              {log.data && (
                <Text style={styles.data}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 9999,
    padding: 10,
  },
  triggerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    padding: 4,
  },
  logList: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  info: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  warn: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  error: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  debug: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  timestamp: {
    color: Colors.gray[400],
    fontSize: 10,
    marginBottom: 4,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  data: {
    color: Colors.gray[300],
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Courier',
  },
});
