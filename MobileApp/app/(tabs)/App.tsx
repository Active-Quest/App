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

import { useEffect,useState } from 'react';
import { SafeAreaView, Button, StyleSheet } from 'react-native';
import { connectMQTT } from '../../src/mqttClient';
import { sendLocation } from '../../src/sendLocation';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [user, setUser] = useState(null);
  const [activityId, setActivityId] = useState('');
  useEffect(() => {
    connectMQTT();
  }, []);

  useEffect(()=>{
    const fetchData = async()=>{
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      
      if(userData && token){
        setUser(JSON.parse(userData));
      }

      //console.log('USER: ', user, "   Token: ", token);
    };
    fetchData();
  }, []);

  /*CALL THIS WHEN USER CLICKS START ACTIVITY OR WHATEVER*/
  const makeActivityId = async()=>{
    if(!user){
      return;
    }

    const timestamp = new Date().toISOString();
    const rawId = `${user.id}-${timestamp}`;
    const activityId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawId
    );

    setActivityId(activityId);
    await AsyncStorage.setItem('activityId',activityId);
  };


  return (
    <SafeAreaView style={styles.container}>
      <Button title="Send my location" onPress={()=>{
        const doingActivity = async()=>{
          if(!activityId){
            await makeActivityId();
          }
          let count = 0;

          const interval = setInterval(()=>{
            //console.log(user?.id, "  ACTIVITY:", activityId)
            sendLocation(user?.id, activityId);
            count++;

            if(count>9){
              clearInterval(interval);  
            }
          },2000);
        }

        doingActivity();
        }} />
    </SafeAreaView>
  );
}

//START ACTIVITY -> storage save sha hash (userId+eventId+time)
//END ACTIVITY -> remove hash from storage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
