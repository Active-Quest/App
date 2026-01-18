const mongoose = require("mongoose");

const SensorDataSchema = new mongoose.Schema({
  device: String,
  sensor: String,
  activity: Number,
  unit: String,
  ts: Number,
  receivedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SensorData", SensorDataSchema);
