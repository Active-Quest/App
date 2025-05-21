import React from "react";
import {Text, View, StyleSheet, Button, TouchableOpacity, TextInput, SafeAreaView} from "react-native";

export default function Login(){
    const [email,setEmail] = React.useState('');
    const [password,setPassword] = React.useState('');

    async function sendLoginRequest(email : String,password : String){
    if(email.length < 1 || password.length < 1){
        return
    }

    const res = await fetch('http://activequest.ddns.net:3000/users/login',{
        method:'POST',
        headers:{
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            email:email,
            password:password
        })
    });

    const data = await res.json();

    console.log(data);
}

    return(
        <View style={styles.container}>
            <View>
                <Text style={styles.title}>Login</Text>
            </View>
            <View style={styles.inputContainer}>
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

                <Text style={styles.registerText} onPress={()=>console.log('redirect to register')}>Don't have an account? Create one</Text>
                
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText} onPress={()=>sendLoginRequest(email,password)}>Login</Text>
                </TouchableOpacity>
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
    registerText:{
        color: '#334455'
    }
});

