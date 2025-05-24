import { linkTo } from "expo-router/build/global-state/routing";
import React, {useState,useEffect} from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, ActivityIndicator} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from "../authUtils";

export default function Index(){
   const [isLoading, setIsLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(()=>{
        const checkAuth = async()=>{
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');

            if(token && userData){
                setAuthenticated(true);
                setUser(JSON.parse(userData));
            }
            setIsLoading(false);
        };

        checkAuth();
    },[])
    if(isLoading){
        return <ActivityIndicator size="large" color="#000" />;
    }

    return(
        <View style={styles.container}>
            {!authenticated ? (
            <>
                <TouchableOpacity style={styles.button} onPress={() => linkTo('./login')}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => console.log('Register pressed!')}>
                    <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>
            </>
            ):(
                <>
                    <Text>Welcome {user?.firstName}</Text>
                    <TouchableOpacity onPress={logout}>
                        <Text>Logout</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container :{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap:10,
        backgroundColor: '#212121'
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