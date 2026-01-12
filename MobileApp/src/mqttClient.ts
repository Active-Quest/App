import mqtt from 'mqtt';
import { MQTT_BROKER_URL } from '@env';

let client: mqtt.MqttClient | null = null;

export const connectMQTT = () => {
  client = mqtt.connect(MQTT_BROKER_URL, {
    clientId: 'expo_app_' + Math.random().toString(16).substring(2, 8),
    clean: true,
    reconnectPeriod: 1000,
  });
  client.on('connect', () => console.log('Connected to MQTT'));
  client.on('error', (err) => console.error('MQTT Error:', err));
};

export const publishMessage = (topic: string, message: string) => {
  if (client?.connected) {
    client.publish(topic, message);
  } else {
    console.warn('MQTT not connected');
  }
};