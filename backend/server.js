const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import routes
const patientRoutes = require("./routes/patientRoutes");
const bedRoutes = require("./routes/bedRoutes");

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Smart Hospital Bed Monitoring Backend is running!"
  });
});

// Health-check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    server: "running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

// Patient API routes
app.use("/api/patients", patientRoutes);

// Bed API routes
app.use("/api/beds", bedRoutes);
app.get("/test-server", (req, res) => {
  res.json({ message: "Correct server is running" });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    requestedURL: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Application error:", err.message);

  res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
});

// Server port
const PORT = process.env.PORT || 5000;

// Start server and connect MongoDB
async function startServer() {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGO_URI is missing from the backend .env file"
      );
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();