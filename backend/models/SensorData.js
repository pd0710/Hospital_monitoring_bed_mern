const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    bedId: {
      type: String,
      required: true
    },

    temperature: {
      type: Number
    },

    heartRate: {
      type: Number
    },

    spo2: {
      type: Number
    },

    occupancy: {
      type: Boolean
    },

    fallDetected: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SensorData", sensorDataSchema);