const express = require("express");
const router = express.Router();

router.get("/test/check", (req, res) => {
  res.status(200).json({
    message: "Bed routes are working correctly"
  });
});

const Bed = require("../models/Bed");
// TEST BED ROUTE
router.get("/test/check", (req, res) => {
  res.json({
    message: "Bed routes are working correctly"
  });
});

// ==========================================
// 1. GET ALL BEDS
// GET http://localhost:5000/api/beds
// ==========================================
router.get("/", async (req, res) => {
  try {
    const beds = await Bed.find().sort({ createdAt: 1 });

    res.status(200).json(beds);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch beds",
      error: error.message,
    });
  }
});

// ==========================================
// 2. GET ONE BED BY BED ID
// GET /api/beds/BED-001
// ==========================================
router.get("/:bedId", async (req, res) => {
  try {
    const bed = await Bed.findOne({
      bedId: req.params.bedId,
    });

    if (!bed) {
      return res.status(404).json({
        message: "Bed not found",
      });
    }

    res.status(200).json(bed);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bed",
      error: error.message,
    });
  }
});

// ==========================================
// 3. ADD NEW BED
// POST /api/beds
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      bedId,
      patientId,
      patientName,
      age,
      gender,
      roomNumber,
      status,
    } = req.body;

    if (!bedId) {
      return res.status(400).json({
        message: "bedId is required",
      });
    }

    const existingBed = await Bed.findOne({ bedId });

    if (existingBed) {
      return res.status(409).json({
        message: "This bed ID already exists",
      });
    }

    const newBed = new Bed({
      bedId,
      patientId,
      patientName,
      age,
      gender,
      roomNumber,
      status,
    });

    const savedBed = await newBed.save();

    res.status(201).json({
      message: "Bed added successfully",
      bed: savedBed,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to add bed",
      error: error.message,
    });
  }
});

// ==========================================
// 4. UPDATE BED STATUS
// PATCH /api/beds/BED-001/status
// ==========================================
router.patch("/:bedId/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Available",
      "Occupied",
      "Alert",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Use Available, Occupied, or Alert",
      });
    }

    const updatedBed = await Bed.findOneAndUpdate(
      { bedId: req.params.bedId },
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBed) {
      return res.status(404).json({
        message: "Bed not found",
      });
    }

    res.status(200).json({
      message: "Bed status updated successfully",
      bed: updatedBed,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update bed status",
      error: error.message,
    });
  }
});

// ==========================================
// 5. UPDATE BED AND PATIENT DETAILS
// PUT /api/beds/BED-001
// ==========================================
router.put("/:bedId", async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      age,
      gender,
      roomNumber,
      status,
    } = req.body;

    const updates = {};

    if (patientId !== undefined) {
      updates.patientId = patientId;
    }

    if (patientName !== undefined) {
      updates.patientName = patientName;
    }

    if (age !== undefined) {
      updates.age = age;
    }

    if (gender !== undefined) {
      updates.gender = gender;
    }

    if (roomNumber !== undefined) {
      updates.roomNumber = roomNumber;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    const updatedBed = await Bed.findOneAndUpdate(
      { bedId: req.params.bedId },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBed) {
      return res.status(404).json({
        message: "Bed not found",
      });
    }

    res.status(200).json({
      message: "Bed and patient details updated successfully",
      bed: updatedBed,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update bed",
      error: error.message,
    });
  }
});

// ==========================================
// 6. DISCHARGE PATIENT
// PATCH /api/beds/BED-001/discharge
// ==========================================
router.patch("/:bedId/discharge", async (req, res) => {
  try {
    const updatedBed = await Bed.findOneAndUpdate(
      { bedId: req.params.bedId },
      {
        $set: {
          patientId: "",
          patientName: "",
          age: null,
          gender: "",
          status: "Available",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBed) {
      return res.status(404).json({
        message: "Bed not found",
      });
    }

    res.status(200).json({
      message: "Patient discharged and bed is now available",
      bed: updatedBed,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to discharge patient",
      error: error.message,
    });
  }
});

// ==========================================
// 7. DELETE BED
// DELETE /api/beds/BED-001
// ==========================================
router.delete("/:bedId", async (req, res) => {
  try {
    const deletedBed = await Bed.findOneAndDelete({
      bedId: req.params.bedId,
    });

    if (!deletedBed) {
      return res.status(404).json({
        message: "Bed not found",
      });
    }

    res.status(200).json({
      message: "Bed deleted successfully",
      bed: deletedBed,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete bed",
      error: error.message,
    });
  }
});

// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;