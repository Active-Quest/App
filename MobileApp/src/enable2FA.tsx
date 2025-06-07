import React, { useState } from 'react';
import { Modal, View, Text, Button, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Enable2FA({ visible, onClose, onImagePicked }) {
  const [images, setImages] = useState([]);
  const [isLoading,setIsLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = [...images, result.assets[0].uri];
      if (newImages.length <= 3) {
        setImages(newImages);
        onImagePicked(newImages);
      }
    }
  };

    const handleTakePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            alert('Camera permission is required!');
            return;
            }

            const result = await ImagePicker.launchCameraAsync({
            quality: 1,
            });

            if (!result.canceled) {
            const newImages = [...images, result.assets[0].uri];
            if (newImages.length <= 3) {
                setImages(newImages);
                onImagePicked(newImages);
            }
        }
    };

    const sendDataFor2FA = async() => {
        const userData = await AsyncStorage.getItem('user');
        if(!userData){
            return;
        }
        const user = JSON.parse(userData);
        
        const formData = new FormData();

        formData.append('userId',user?.id);

        setIsLoading(true);
        setImages([]);
        images.forEach((uri,index)=>{
            formData.append('images',{
                uri:uri,
                name:`photo${index}.jpg`,
                type:'image/jpeg'
            });
        });
        const res = await fetch("http://activequest.ddns.net:3737/register",{
            method:'POST',
            body:formData,
            headers:{
               'Content-Type':'multipart/form-data'
            }
        });

        

        const data = await res.json();
        if(data){
            setIsLoading(false);
            if(data.status == "ok"){
                Alert.alert("2FA enabled!")
                updateUser2FA();
                onClose();
            }else{
                Alert.alert("Error occured!");
                onClose();
            }
            
        }

    }

    if(images.length == 3){
        sendDataFor2FA();
    }

    const updateUser2FA = async() =>{
        const userData = await AsyncStorage.getItem('user');

        if(!userData){
            Alert.alert("Not signed in!");
            return;
        }

        const user = JSON.parse(userData);
        const res = await fetch(`http://activequest.ddns.net:3002/users/${user.id}/update2FA`,{
            method:'POST',
            body:JSON.stringify({
                boolean2FA:"True"
            }),
            headers:{
                "Content-Type":"Application/json"
            }
        });

        const data = await res.json();

        if(data.status == 201){
            await AsyncStorage.setItem('enabled2FA','True');
        }

    }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Set up 2FA</Text>
          <Text style={styles.smallText}>Take or select 3 pictures of your face</Text>

          <View style={styles.imageRow}>
            {images.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.image} />
            ))}
          </View>

          {images.length < 3 && (
            <>
              <TouchableOpacity style={styles.button} onPress={handlePickImage}>
                <Text style={styles.buttonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
                <Text style={styles.buttonText}>Take a Photo</Text>
              </TouchableOpacity>
            </>
          )}
        
          {isLoading && (
            <>
                <Text>Please wait, this will take some time</Text>
                <ActivityIndicator size="large" color="#000" />
            </>
          )}
          <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose} disabled={isLoading}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
  },
  closeButton: {
    backgroundColor: '#ff4d4f',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  smallText:{
    fontSize:12,
    marginBottom:10,
    color:'gray'
  }
});
