import * as Location from 'expo-location';
import { publishMessage } from './mqttClient';


export const sendLocation = async (userId : String, activityId : String) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Location permission not granted');
    return;
  }

  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const coords = location.coords;

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
  return {latitude,longitude};
};