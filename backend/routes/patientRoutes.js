const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const Bed = require("../models/Bed");

// Get all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add patient and update bed status
router.post("/", async (req, res) => {
  console.log("UPDATED PATIENT ROUTE IS RUNNING");
  try {
    const { name, age, gender, bedId, condition } = req.body;

    if (!name || age === undefined || !bedId) {
      return res.status(400).json({
        message: "Name, age and bedId are required"
      });
    }

    // Find the bed
    const bed = await Bed.findOne({ bedId });

    if (!bed) {
      return res.status(404).json({
        message: "Bed not found"
      });
    }

    // Check availability
    if (bed.status !== "Available") {
      return res.status(400).json({
        message: "Bed is not available"
      });
    }

    // Check existing patient
    const existingPatient = await Patient.findOne({ bedId });

    if (existingPatient) {
      return res.status(400).json({
        message: "A patient is already assigned to this bed"
      });
    }

    // Save patient
    const patient = new Patient({
      name,
      age,
      gender,
      bedId,
      condition
    });

    const savedPatient = await patient.save();

    // Update bed
    bed.status = "Occupied";

    if (bed.schema.path("patientName")) {
      bed.patientName = name;
    }

    await bed.save();

    // Success response
    res.status(201).json({
      message: "Patient added and bed marked Occupied successfully",
      patient: savedPatient,
      bed: bed
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;