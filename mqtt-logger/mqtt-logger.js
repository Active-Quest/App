require('dotenv').config();
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const Activity = require('../backend/models/activityModel');

//Load ENV Vars
const mqttHost = process.env.MQTT_HOST;
const mqttTopic = process.env.MQTT_TOPIC;
const mongoUri = process.env.MONGO_URI;

//Validate Required Config
if (!mqttHost || !mqttTopic || !mongoUri) {
  console.error('Missing required environment variables: MONGO_URI, MQTT_HOST, or MQTT_TOPIC');
  process.exit(1);
}

//Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

//Connect to MQTT Broker
const mqttClient = mqtt.connect(`mqtt://${mqttHost}`);

mqttClient.on('connect', () => {
  console.log(`Connected to MQTT broker at ${mqttHost}`);
  mqttClient.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error(`MQTT subscription error: ${err.message}`);
    } else {
      console.log(`Subscribed to topic: ${mqttTopic}`);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const gps = JSON.parse(message.toString());

    const activity = new Activity({
      userId: new mongoose.Types.ObjectId(),   //Zamenjaj
      eventId: new mongoose.Types.ObjectId(),  //Zamenjaj
      startTime: new Date(),
      duration: '0:01',
      distance: '0.00',
      waypoints: [{
        lat: gps.latitude?.toString() || '',
        lon: gps.longitude?.toString() || '',
        alt: gps.altitude?.toString() || '',
        time: new Date()
      }],
      avgSpeed: 0
    });

    await activity.save();
    console.log('Activity saved to MongoDB');
  } catch (err) {
    console.error('Failed to save message:', err.message);
  }
});
