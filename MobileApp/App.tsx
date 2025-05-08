// ✅ Polyfill setup FIRST
import { Buffer } from 'buffer';
import process from 'process';
import 'react-native-url-polyfill/auto';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  globalThis.process = process;
}

// 🔽 THEN import other modules
import { useEffect } from 'react';
import { SafeAreaView, Button, StyleSheet } from 'react-native';
import { connectMQTT } from './src/mqttClient';
import { sendLocation } from './src/sendLocation';
import React from 'react';

export default function App() {
  useEffect(() => {
    connectMQTT();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Send my location" onPress={sendLocation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
