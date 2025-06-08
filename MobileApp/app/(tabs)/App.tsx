import { Buffer } from 'buffer';
import process from 'process';
import 'react-native-url-polyfill/auto';
import * as Crypto from 'expo-crypto';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  globalThis.process = process;
}

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, Button, StyleSheet, TouchableOpacity, Text, Platform, StatusBar } from 'react-native';
import { connectMQTT } from '../../src/mqttClient';
import { sendLocation } from '../../src/sendLocation';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps'; /*MAP IMPORT*/
import * as Location from 'expo-location';
import { ActivityIndicator, View } from 'react-native';
import Dropdown from '../../src/dropdown';
export default function App() {
  const [user, setUser] = useState(null);
  const [activityId, setActivityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [userDoingActivity, setUserDoingActivity] = useState(false);
  const userDoingActivityRef = useRef(false);
  const [myLocation, setMyLocation] = useState<null | { latitude: number; longitude: number }>(null);
  const [distance, setDistance] = useState(0.00);
  const [duration,setDuration] = useState(0.00)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef(0);//For sending the duration to backend
  const [events,setEvents] = useState([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [selectedDropdownValue,setSelectedDropdownValue] = useState<string | null>(null);


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

  useEffect(()=>{
    fetch('http://activequest.ddns.net:3002/events')
    .then(res => res.json())
    .then(data => {
      const dropdownItems = data.map(event => ({
        label: event.title,
        value:event._id
      }));
      setEvents(dropdownItems);
    });
  });

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

  const startStopwatch = () =>{
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(()=>{
      if(startTimeRef.current !== null){
        const delta = Math.floor((Date.now() - startTimeRef.current)/1000);
        setDuration(delta);
        durationRef.current = delta;
      }
    },1000);
  }

  const stopStopwatch = () =>{
    if(intervalRef.current){
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  const formatTime = (seconds:number) =>{
    const mins = Math.floor(seconds/60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2,'0')}`;
  }

  
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
    <>
    {eventId ?(
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
        showsMyLocationButton
        >
          {path.length > 0 &&(
            <>
              {/*<Marker coordinate={path[path.length -1]}/>*/}
              
              <Polyline coordinates={path} strokeColor='blue' strokeWidth={4}/>
            </>
          )} 
        </MapView>
        
        {/*<View style={{ alignItems: 'center'}}>*/}
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}><FontAwesome5 name="ruler" size={14} color="black" /> {distance.toFixed(3)}m</Text>
            <Text style={styles.distanceText}>{formatTime(duration)} <FontAwesome5 name="hourglass-half" size={14} color="black" /></Text>
          </View>
          <TouchableOpacity
            style={[styles.activityButton, userDoingActivityRef.current ? styles.stopButton : styles.startButton]}
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

                if(!newState){
                  stopStopwatch();

                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }

                  await sendLocation(user?.id, idToUse, formatTime(durationRef.current), eventId, true);
                  AsyncStorage.removeItem('prevCoord');

                  return; //If we just stopped dont start the interval
                } 
                
                startStopwatch();

                intervalRef.current = setInterval(async () => {
                  if (!userDoingActivityRef.current) {
                    if (intervalRef.current !== null) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    return;
                    }
                  }
                  


          
                  console.log('SENT TIME: ', formatTime(durationRef.current));
                  console.log("SENT EVENT ID:", eventId);
                  let location = await sendLocation(user?.id, idToUse, formatTime(durationRef.current),eventId,false);//Wait for data from function

                  if(location?.latitude && location?.longitude){
                    setCurrentLocation({latitude: location.latitude, longitude: location.longitude});
                    setPath(prev => [...prev, {latitude:location.latitude,longitude:location.longitude}]);
                  }

                  if (location?.distance != null && !isNaN(location.distance)) {
                    setDistance(prev => {
                      const updated = prev + location.distance;
                      //console.log("Added:", location.distance, "| Total:", updated);
                      return updated;
                    });
                  } else {
                    console.warn("Invalid distance received:", location?.distance);
                  }
                  
                  
                  
                  //DEBUG
                  /*console.log(`User:  ${user?.id}`);
                  console.log(`Activity:  ${idToUse}`);*/
                  

                 
                }, 10000);
              };
              
              doingActivity();
            }}
          >
              <Text style={styles.buttonText}>{userDoingActivity ? "Stop" : "Start"}</Text>
          </TouchableOpacity>
        {/*</View>*/}
      </SafeAreaView>
    ):(
      <View style={styles.selectionContainer}>
        <Text style={styles.stepHeader}>  Select an Event</Text>

        <View style={styles.dropdownWrapper}>
          <Dropdown
            events={events}
            selectedValue={selectedDropdownValue}
            setSelectedValue={setSelectedDropdownValue}
          />
        </View>

        {selectedDropdownValue && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setEventId(selectedDropdownValue)}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    position:'relative'
  },
  activityButton: {
    width:'30%',
    position:'absolute',
    bottom:20,
    borderRadius:'20%',
    padding:15,
    alignItems:'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    alignSelf:'center'
    
  },
  startButton:{
    backgroundColor:'#54AC6E'
  },
  stopButton:{
    backgroundColor:'#d64a51'
  },
  buttonText:{
    color:'#ffffff',
    textAlign:'center',
    fontSize:20,
    fontWeight:'bold'
  },
  distanceContainer:{
    position:'absolute',
    top: 20,
    borderRadius:'10%',
    padding:20,
    alignItems:'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor:'white',
    alignSelf:'center',
    display:'flex',
    flexDirection:'row',
    justifyContent:'space-between',
    minWidth:200
    
  },
  distanceText:{
    textAlign:'center'
  },
  selectionContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
  backgroundColor: '#f5f7fa',
  },

  stepHeader: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    alignSelf: 'flex-start',
  },

  dropdownWrapper: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  confirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f9ea',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },

  confirmationText: {
    marginLeft: 8,
    color: '#2e7d32',
    fontSize: 14,
  },

  continueButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },

  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
