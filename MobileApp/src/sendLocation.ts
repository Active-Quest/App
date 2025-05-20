import * as Location from 'expo-location';
import { publishMessage } from './mqttClient';

export const sendLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Location permission not granted');
    return;
  }

  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const coords = location.coords;

  publishMessage('test/topic', JSON.stringify({
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude
  }));
};