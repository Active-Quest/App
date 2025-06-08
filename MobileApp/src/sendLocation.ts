import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { publishMessage } from './mqttClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

function calculateDistance(coord1: { latitude: number, longitude: number }, coord2: { latitude: number, longitude: number }) {
  const toRad = (angle: number) => angle * Math.PI / 180;
  const R = 6371e3; // meters

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function estimateSpeedFromAccelerometer(durationMs = 1000): Promise<number> {
  return new Promise((resolve) => {
    let speed = 0;
    let prevTimestamp: number | null = null;

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const currentTime = Date.now();
      const acceleration = Math.sqrt(x * x + y * y + z * z) - 1;

      if (prevTimestamp !== null) {
        const deltaTime = (currentTime - prevTimestamp) / 1000; // in seconds
        speed += acceleration * deltaTime;
      }

      prevTimestamp = currentTime;
    });

    Accelerometer.setUpdateInterval(100); // 10 readings/sec

    setTimeout(() => {
      subscription.remove();
      const speedKmh = Math.max(0, speed) * 3.6; // Convert from m/s to km/h
      resolve(speedKmh);
    }, durationMs);
  });
}

export const sendLocation = async (userId: String, activityId: String, duration: string) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Location permission not granted');
    return;
  }

  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const coords = location.coords;

  const prevCoordsStr = await AsyncStorage.getItem('prevCoord');
  let distance: number | undefined;

  if (prevCoordsStr) {
    const prevCoords = JSON.parse(prevCoordsStr);
    distance = calculateDistance(coords, prevCoords);
  }

  const averageSpeedKmh = await estimateSpeedFromAccelerometer();

  publishMessage('test/topic', JSON.stringify({
    userId,
    activityId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude,
    distance: distance ?? 0,
    averageSpeed: averageSpeedKmh,
    duration
  }));

  await AsyncStorage.setItem('prevCoord', JSON.stringify(coords));

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    distance,
    averageSpeed: averageSpeedKmh
  };
};
