import * as Location from 'expo-location';
import { publishMessage } from './mqttClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

function calculateDistance(coord1: { latitude: number, longitude: number }, coord2: { latitude: number, longitude: number }) {
  const toRad = (angle: number) => angle * Math.PI / 180;
  const R = 6371e3; // Earth's radius in meters

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


export const sendLocation = async (userId : String, activityId : String) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Location permission not granted');
    return;
  }

  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const coords = location.coords;
  const prevCoords = await AsyncStorage.getItem('prevCoord');
  let distance;
  if(prevCoords){
    distance = calculateDistance(coords,JSON.parse(prevCoords));
    await AsyncStorage.setItem('prevCoord', JSON.stringify(coords));

  }else{//go in here if it's the first coordinate
    await AsyncStorage.setItem('prevCoord', JSON.stringify(coords));
  }
  //Date -> controller
  publishMessage('test/topic', JSON.stringify({
    userId: userId,
    activityId: activityId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude
  }));

  let latitude = coords.latitude;
  let longitude = coords.longitude;
  //Return the location data for the map back on our App.tsx
  return {latitude,longitude,distance};
};