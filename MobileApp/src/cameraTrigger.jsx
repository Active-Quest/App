import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CameraTrigger({ userId }) {
  const [waiting, setWaiting] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://activequest.ddns.net:3002/users/${userId}`);
        const data = await res.json();
        if (data.waitingMobile2FA === true) {
          clearInterval(interval);
          setWaiting(false);
          openCamera();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    } else {
      setWaiting(true);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const formData = new FormData();

      formData.append('image', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      setIsUploading(true);

      const res = await fetch('http://activequest.ddns.net:3737/verify', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await res.json();
      setIsUploading(false);

      if (data.verified === 'true') {
        Alert.alert('2FA completed successfully!');
        //passed2FA = true API CALL
        
        
      } else {
        Alert.alert('Not a match!');
      }
    } catch (err) {
      setIsUploading(false);
      Alert.alert('Upload failed:', err.message);
    }
  };


  return (
    <View style={styles.container}>
      {isUploading && (
        <>
          <Text style={{marginBottom:10}}>Uploading your photo...</Text>
          <ActivityIndicator size="large" color="#000" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});