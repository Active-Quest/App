import { Buffer } from 'buffer';
import process from 'process';
import 'react-native-url-polyfill/auto';
import * as Crypto from 'expo-crypto';
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  globalThis.process = process;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, Button, StyleSheet } from 'react-native';
import { connectMQTT } from '../../src/mqttClient';
import { sendLocation } from '../../src/sendLocation';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps'; /*MAP IMPORT*/
import * as Location from 'expo-location';
import { ActivityIndicator, View } from 'react-native';



export default function App() {
  const [user, setUser] = useState(null);
  const [activityId, setActivityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [userDoingActivity, setUserDoingActivity] = useState(false);
  const userDoingActivityRef = useRef(false);
  const [myLocation, setMyLocation] = useState<null | { latitude: number; longitude: number }>(null);

  
  /*FOR MAP*/
  const [path,setPath] = useState<{ latitude:number;longitude:number}[]>([]);
  const [currentLocation,setCurrentLocation] = useState(null);

  useEffect(() => {
    connectMQTT();

    const location = async () =>{
      const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }
      
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = location.coords;

        setMyLocation(coords);
    }

    location();
  }, []);

  
  useFocusEffect( //Every time when this activity is focused fetch the token and user
    useCallback(()=>{
      const fetchData = async () => {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      if (userData && token) {
        setUser(JSON.parse(userData));
      }

      setLoading(false);//Data is done loading
    };
    fetchData();
    },[])
  );

  const makeActivityId = async () => {
    if (!user) {
      console.warn("User not loaded yet!");
      return;
    }

    const timestamp = new Date().toISOString();
    const rawId = `${user.id}-${timestamp}`;
    const activityId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawId
    );

    setActivityId(activityId);
    await AsyncStorage.setItem('activityId', activityId);
    return activityId;
  };

  if (loading || !myLocation) { //Wait for the initial location!
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <MapView
      style={{flex:1}}
      initialRegion={{
        latitude: myLocation?.latitude || 46.3127862,
        longitude: myLocation?.longitude || 13.992352,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      region = {
        currentLocation ? {
          ...currentLocation,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
        :undefined
      }
      showsUserLocation
      >
        {path.length > 0 &&(
          <>
            {/*<Marker coordinate={path[path.length -1]}/>*/}
            
            <Polyline coordinates={path} strokeColor='blue' strokeWidth={4}/>
          </>
        )} 
      </MapView>

      <Button
        title={userDoingActivity ? "Stop" : "Start"}
        disabled={loading || !user}
        onPress={() => {
          //console.log(userDoingActivity);
          const doingActivity = async () => {
            if (!user) {
              console.warn("User is not available.");
              return;
            }
            let idToUse: string | undefined = activityId;

            if (!idToUse) {
              idToUse = await makeActivityId();
              if(!idToUse) return;
            }

            const newState = !userDoingActivity;
            setUserDoingActivity(newState);
            userDoingActivityRef.current = newState;

            if(!newState) return; //If we just stopped dont start the interval
            

            const interval = setInterval(async() => {
              let location = await sendLocation(user?.id, idToUse);//Wait for data from function
              if(location?.latitude && location?.longitude){
                setCurrentLocation({latitude: location.latitude, longitude: location.longitude});
                setPath(prev => [...prev, {latitude:location.latitude,longitude:location.longitude}]);
              }
              
              
              //DEBUG IF NEEDED
              /*console.log(`User:  ${user?.id}`);
              console.log(`Activity:  ${idToUse}`);*/
              

              if (!userDoingActivityRef.current) {
                clearInterval(interval);
              }
            }, 10000);
          };
          
          doingActivity();
        }}
      />
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
