import { useEffect, useState } from 'react';
import ActivityCard from './activityCard';
import { View, StyleSheet, ScrollView } from 'react-native';
import React from 'react';

function Activities() {
  const [activities, setActivities] = useState([]);

  //const API_URL = process.env.REACT_APP_API_URL || "http://activequest.ddns.net:3002";
  const API_URL = 'http://activequest.ddns.net:3002';

  useEffect(() => {
    fetch(`${API_URL}/activities`)
      .then(res => res.json())
      .then(setActivities);
  }, []);

  return (
    <ScrollView style={{height:'100%'}}>
      <View style={styles.activityContainer}>
        {activities.map(activity=>(
          <ActivityCard key={activity?._id} activity={activity}></ActivityCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  activityContainer:{
    flexDirection:'column-reverse',
    gap:10,
    padding:10
  }
})

export default Activities;