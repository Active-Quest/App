import React, {useState,useEffect, useCallback} from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, ActivityIndicator} from "react-native";


export default function Index(){
   return(
    <View style={styles.container}>
        <Text>WELCOME TO ACTIVE QUEST</Text>
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
        color: '#fff',
        fontWeight: 'bold',
    }
});