import React from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, TextInput, SafeAreaView} from "react-native";
import { useNavigation } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {router} from 'expo-router';

export default function Register(){
    const [firstName,setFirstName] = React.useState('');
    const [lastName,setLastName] = React.useState('');
    const [email,setEmail] = React.useState('');
    const [password,setPassword] = React.useState('');
    const [confirmPassword,setConfirmPassword] = React.useState('');
    const navigation = useNavigation();
    async function sendRegisterRequest(firstName : String,lastName : String,email : string,password : string,confirmPassword : String){
    if(firstName.length < 1 || lastName.length < 1 || email.length < 1 || password.length < 1 || confirmPassword.length < 1){
        return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if(!passwordRegex.test(password)){
        return
    }
    if(!emailRegex.test(email)){
        return
    }

    if(password!=confirmPassword){
        return
    }

    const emailNotUsed = await fetch(`http://activequest.ddns.net:3002/users/${email}`); 

    if (emailNotUsed.ok) {
    const result = await emailNotUsed.json();

    if (result.exists) {
        alert("Email is already in use.");
        return;
    }
    }

    const res = await fetch('http://activequest.ddns.net:3002/users/register',{
        method:'POST',
        headers:{
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            firstName:firstName,
            lastName:lastName,
            email:email,
            password:password
        })
    });

    if(!res.ok){
        const err = await res.json();
        alert(err.message || 'Registration failed');
        return;
    }

    navigation.goBack();
}
    return(
        <View style={styles.background}>
            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                    <FontAwesome name="angle-left" size={24} color="#000000" />
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                <View>
                    <Text style={styles.title}>Register</Text>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="First Name"
                        onChangeText={setFirstName}
                    ></TextInput>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="Last Name"
                        onChangeText={setLastName}
                    ></TextInput>
                    <TextInput 
                        style={styles.textInput}
                        placeholder="Email"
                        onChangeText={setEmail}
                    ></TextInput>
                    <TextInput 
                        style={styles.textInput}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                        placeholder="Password"
                    ></TextInput>
                    <TextInput 
                        style={styles.textInput}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={true}
                        placeholder="Confirm Password"
                    ></TextInput>

                    
                    <TouchableOpacity style={styles.button} onPress={()=>sendRegisterRequest(firstName,lastName,email,password,confirmPassword)}>
                        <Text style={styles.buttonText}>Register</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        alignItems:'center',
        justifyContent:'space-evenly',
        width:'80%',
        maxHeight:'50%',
        marginHorizontal:'auto',
        gap:20
    },
    textInput:{
        height:40,
        borderWidth:1,
        padding:10,
    },
    inputContainer:{
        width:'100%',
        gap:20
    },
    title:{
        fontSize:40,
        fontFamily:'Verdana-Bold'
    },
    button: {
        marginHorizontal:'auto',
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    iconContainer:{
        flexDirection:'row',
        alignItems:'flex-start',
        paddingLeft:10
    },
    background:{
        flex:1,
        backgroundColor:'#ffffff',
        paddingTop:80,
    }
});

