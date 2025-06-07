import React, {useState,useEffect, useCallback} from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, ActivityIndicator, Modal} from "react-native";
import Activities from "../../src/activities";
import { use2FAPolling } from "../../src/checking2FA";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index(){
    const [modalVisible, setModalVisible] = useState(false);
    const [user,setUser] = useState(null);
    const onPassed2FA = () => {
        setModalVisible(true);
    };

    useEffect(()=>{
        const getUser = async() =>{
            const userData = await AsyncStorage.getItem('user');
            if(userData){
                setUser(JSON.parse(userData));
            }
        }
    })
  const { isChecking } = use2FAPolling(user?.id, onPassed2FA);

   return(
    <>
        <Modal visible={modalVisible} transparent animationType="slide">
            <View style={{ flex:1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000aa' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                <Text>2FA Completed! You may continue.</Text>
                <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
            </View>
        </Modal>
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