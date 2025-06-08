import React, {useState,useEffect, useCallback} from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, ActivityIndicator, Modal} from "react-native";
import Activities from "../../src/activities";
import CameraTrigger from "../../src/cameraTrigger";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index(){
    const [modalVisible, setModalVisible] = useState(false);
    const [user,setUser] = useState(null);
    
    useEffect(() => {
    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
        setUser(JSON.parse(userData));
        }
    };
    getUser();
    //console.log(user);
    });

   return(
    <>
        <CameraTrigger userId={user?.id} />
        <View style={styles.container}>
            <Activities></Activities>
        </View>
    </>
   );
}

const styles = StyleSheet.create({
    container :{
        flexDirection:'column',
        gap:10
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});