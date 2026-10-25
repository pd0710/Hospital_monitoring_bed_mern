const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    bedId: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    resolved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Alert", alertSchema);