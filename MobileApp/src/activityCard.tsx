import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { LatLng, Region } from 'react-native-maps';

type Waypoint = {
  lat: number;
  lon: number;
};

type Activity = {
  userId: string;
  duration: string;
  distance: number;
  waypoints: Waypoint[];
  startTime: string;
  avgSpeed?: number;
  eventId: string;
};

type User = {
  firstName: string;
  lastName: string;
};

type Props = {
  activity: Activity;
};

const ActivityCard: React.FC<Props> = ({ activity }) => {
  const [expanded, setExpanded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const res = await fetch(`http://activequest.ddns.net:3002/users/${activity.userId}`);
        if (!res.ok) {
          console.warn('Failed to get activity user data');
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.warn('Error fetching user data:', error);
      }
    };

    getUserData();
  }, [activity.userId]);

  const path: LatLng[] = Array.isArray(activity.waypoints)
    ? activity.waypoints.map(wp => ({ latitude: wp.lat, longitude: wp.lon }))
    : [];

  const initialRegion: Region = {
    latitude: path[0]?.latitude ?? 0,
    longitude: path[0]?.longitude ?? 0,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  };

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.insideCard}>
            <View style={styles.dataSection}>
                <Text><Text style={styles.bold}>{user?.firstName} {user?.lastName}</Text></Text>
                <Text><Text style={styles.bold}>Duration:</Text> {activity.duration}</Text>
                <Text><Text style={styles.bold}>Distance:</Text> {(activity.distance / 1000).toFixed(3)} km</Text>
            </View>
            <View>
                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                    <FontAwesome name="map" size={20} color={'black'} />
                </TouchableOpacity>
            </View>
        </View>
        

        {expanded && path.length > 1 && (
          <View style={styles.mapSection}>
            <MapView
              style={styles.map}
              initialRegion={initialRegion}
              scrollEnabled={false}
              zoomEnabled={true}
            >
              <Polyline coordinates={path} strokeColor="blue" strokeWidth={3} />
              <Marker coordinate={path[0]} title="Start" pinColor="green" />
              <Marker coordinate={path[path.length - 1]} title="Finish" pinColor="red" />
            </MapView>
            <Text><Text style={styles.bold}>Start Time:</Text> {new Date(activity.startTime).toLocaleString()}</Text>
            <Text><Text style={styles.bold}>Avg Speed:</Text> {activity.avgSpeed ?? 'N/A'} km/h</Text>
            {/*<Text><Text style={styles.bold}>Event ID:</Text> {activity.eventId}</Text>*/}
          </View>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderColor: '#dddddd',
    borderWidth: 1,
    elevation: 3
  },
  insideCard:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center'
  },
  dataSection: {
    marginBottom: 10,
  },
  mapSection: {
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom:20
  },
  bold: {
    fontWeight: 'bold',
  },
});



export default ActivityCard;
