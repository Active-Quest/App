import React from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity} from "react-native";

export default function Index(){
    return(
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={() => console.log('Log in pressed!')}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => console.log('Register pressed!')}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
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