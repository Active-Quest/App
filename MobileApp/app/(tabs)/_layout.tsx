import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';


export default function TabsLayout(){
    return (
        <Tabs screenOptions={{
            tabBarStyle:{
                backgroundColor:'#ffffff',
                borderTopWidth:0
            },
            tabBarInactiveTintColor:'#888',
            tabBarActiveTintColor:'#000000',
            headerStyle:{
                backgroundColor:'#ffffff',
                borderBottomWidth:0
            }
        }}>
            <Tabs.Screen name='index' options={{headerTitle:"Home",title:'Home',tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),}}/>
            <Tabs.Screen name='App' options={{headerTitle:"Start",title:'Start',tabBarIcon: ({ color, size }) => (
            <FontAwesome name="street-view" size={size} color={color}/>),}}/>
        </Tabs>
    );
}