import { linkTo } from "expo-router/build/global-state/routing";
import React, {useState,useEffect, useCallback} from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, ActivityIndicator} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../authContext";
import { useFocusEffect } from "expo-router";
import { router } from 'expo-router';
import Enable2FA from "../../src/enable2FA";

export default function Profile(){
    const [isLoading, setIsLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [twoFA, setTwoFA] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [imageUri, setImageUri] = useState([]);
    const {logout} = useAuth();

    //Load user
    useFocusEffect(
        useCallback(() => {
        const checkAuth = async () => {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');
            const fetch2FASetting = await AsyncStorage.getItem('enabled2FA')
            
            if (token && userData) {
            setAuthenticated(true);
            setUser(JSON.parse(userData));
            } else {
            setAuthenticated(false);
            setUser(null);
            setIsLoading(false); 
            }

            if(fetch2FASetting){
                setTwoFA(JSON.parse(fetch2FASetting))
            }else{
                setTwoFA(false);
            }
        };
        checkAuth();
        }, [])
    );

    //Load 2FA when user is ready
    useFocusEffect(
        useCallback(() => {
        const check2FA = async () => {
            if (!user?.id) return;

            try {
            const res = await fetch(`http://activequest.ddns.net:3002/users/${user.id}`);
            if (!res.ok) {
                console.log("Failed to fetch user data");
                return;
            }
            const data = await res.json();
            setTwoFA(data.twoFA);
            } catch (error) {
            console.error("2FA fetch error:", error);
            } finally {
            setIsLoading(false);
            }
        };
        check2FA();
        }, [user?.id])
    );

    if(isLoading){
        return <ActivityIndicator size="large" color="#000" />;
    }

    return(
        <View style={styles.container}>
            {!authenticated ? (
            <>
                <TouchableOpacity style={styles.button} onPress={() => router.push('../login')}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push('../register')}>
                    <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>
            </>
            ):(
                <>
                    <Text style={styles.welcomeText}>Welcome {user?.firstName}</Text>
                    {!twoFA && (
                        <>
                            <TouchableOpacity style={styles.button2FA} onPress={() => setModalVisible(true)}>
                                <Text style={styles.buttonText}>Set up 2FA</Text>
                            </TouchableOpacity>

                            {imageUri && (
                            <Enable2FA
                                visible={modalVisible}
                                onClose={() => setModalVisible(false)}
                                onImagePicked={(uris) => setImageUri(uris)}
                                />
                            )}
                        </>
                    )}
                    
                    <TouchableOpacity onPress={logout} style={styles.buttonLogout}>
                        <Text style={styles.buttonText}>Logout</Text>
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
        gap:10
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111",
        marginBottom: 20,
    },
    button2FA: {
        backgroundColor: "#007bff",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    buttonLogout: {
        backgroundColor: "#ff4d4f",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 12,
    },
    
});