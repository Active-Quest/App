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


export default function App() {
  const [user, setUser] = useState(null);
  const [activityId, setActivityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [userDoingActivity, setUserDoingActivity] = useState(false);
  const userDoingActivityRef = useRef(false);
  
  /*FOR MAP*/
  const [path,setPath] = useState<{ latitude:number;longitude:number}[]>([]);
  const [currentLocation,setCurrentLocation] = useState(null);

  useEffect(() => {
    connectMQTT();
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

  return (
    <SafeAreaView style={styles.container}>

      <MapView
      style={{flex:1}}
      initialRegion={{
        latitude: path[0]?.latitude || 46.3127862,
        longitude: path[0]?.longitude || 13.992352,
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
      >
        {path.length > 0 &&(
          <>
            <Polyline coordinates={path} strokeColor='blue' strokeWidth={4}/>
            <Marker coordinate={path[path.length -1]}/>
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
