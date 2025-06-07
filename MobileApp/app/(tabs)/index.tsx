import React, {useState,useEffect, useCallback} from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, ActivityIndicator} from "react-native";
import Activities from "../../src/activities";

export default function Index(){
   return(
    <View style={styles.container}>
        <Activities></Activities>
    </View>
    
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