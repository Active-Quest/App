import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout(){
    return (
        <Tabs screenOptions={{
            tabBarStyle:{
                backgroundColor:'#212121',
                borderTopWidth:0
            },
            tabBarInactiveTintColor:'#888',
            tabBarActiveTintColor:'#fff',
            headerStyle:{
                backgroundColor:'#212121',
                borderBottomWidth:0
            }
        }}>
            <Tabs.Screen name='index' options={{headerTitle:"Home",title:'Home'}}/>
            <Tabs.Screen name='App' options={{headerTitle:"Start",title:'Start'}}/>
        </Tabs>
    );
}