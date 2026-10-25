const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    // Unique hospital bed ID
    bedId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Patient details
    patientId: {
      type: String,
      default: "",
      trim: true,
    },

    patientName: {
      type: String,
      default: "",
      trim: true,
    },

    age: {
      type: Number,
      default: null,
      min: 0,
      max: 130,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },

    // Room number
    roomNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // Bed availability status
    status: {
      type: String,
      enum: ["Available", "Occupied", "Alert"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bed", bedSchema);