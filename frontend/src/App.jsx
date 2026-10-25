import { useEffect, useState, useCallback } from "react";
import "./App.css";

// Backend API URL
const API_URL = "http://localhost:5000/api/beds";

function App() {
  // Store all beds
  const [beds, setBeds] = useState([]);

  // Loading and error messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Track which bed is being updated
  const [updatingBed, setUpdatingBed] = useState("");

  // Track patient form submission
  const [savingPatient, setSavingPatient] = useState(false);

  // Patient form fields
  const [form, setForm] = useState({
    bedId: "",
    patientId: "",
    patientName: "",
    age: "",
    gender: "",
    roomNumber: "",
  });

  // --------------------------------------------------
  // 1. FETCH ALL BEDS FROM BACKEND
  // --------------------------------------------------

  const fetchBeds = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch beds");
      }

      // Backend should return an array of beds
      if (!Array.isArray(data)) {
        throw new Error("Invalid bed data received from backend");
      }

      setBeds(data);
      setError("");
    } catch (err) {
      console.error("Fetch beds error:", err);
      setError(
        "Unable to load beds. Please check whether the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // 2. LOAD BEDS AND REFRESH EVERY 5 SECONDS
  // --------------------------------------------------

  useEffect(() => {
    fetchBeds();

    const timer = setInterval(() => {
      fetchBeds();
    }, 5000);

    return () => clearInterval(timer);
  }, [fetchBeds]);

  // --------------------------------------------------
  // 3. HANDLE FORM INPUT CHANGES
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // 4. ADD PATIENT TO A BED
  // --------------------------------------------------

  const handlePatientSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    // Basic validation
    if (
      !form.bedId.trim() ||
      !form.patientId.trim() ||
      !form.patientName.trim() ||
      !form.age ||
      !form.gender ||
      !form.roomNumber.trim()
    ) {
      setError("Please fill in all patient details.");
      return;
    }

    const selectedBed = beds.find(
      (bed) => bed.bedId === form.bedId
    );

    if (!selectedBed) {
      setError("Bed ID not found. Please select an existing bed.");
      return;
    }

    if (selectedBed.status === "Occupied") {
      setError("This bed is already occupied.");
      return;
    }

    const ageNumber = Number(form.age);

    if (
      !Number.isInteger(ageNumber) ||
      ageNumber < 0 ||
      ageNumber > 130
    ) {
      setError("Please enter a valid age between 0 and 130.");
      return;
    }

    setSavingPatient(true);

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(form.bedId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: form.patientId.trim(),
            patientName: form.patientName.trim(),
            age: ageNumber,
            gender: form.gender,
            roomNumber: form.roomNumber.trim(),
            status: "Occupied",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save patient details"
        );
      }

      setSuccessMessage(
        `Patient ${form.patientName} has been assigned to bed ${form.bedId}.`
      );

      // Clear form
      setForm({
        bedId: "",
        patientId: "",
        patientName: "",
        age: "",
        gender: "",
        roomNumber: "",
      });

      // Refresh bed list
      await fetchBeds();
    } catch (err) {
      console.error("Save patient error:", err);
      setError(err.message || "Unable to save patient details.");
    } finally {
      setSavingPatient(false);
    }
  };

  // --------------------------------------------------
  // 5. UPDATE BED STATUS
  // --------------------------------------------------

  const updateBedStatus = async (bedId, newStatus) => {
    setError("");
    setSuccessMessage("");
    setUpdatingBed(bedId);

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(bedId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update bed status");
      }

      setSuccessMessage(
        `Bed ${bedId} status updated to ${newStatus}.`
      );

      await fetchBeds();
    } catch (err) {
      console.error("Update status error:", err);
      setError(err.message || "Unable to update bed status.");
    } finally {
      setUpdatingBed("");
    }
  };

  // --------------------------------------------------
  // 6. DISCHARGE PATIENT
  // --------------------------------------------------

  const dischargePatient = async (bedId) => {
    const confirmed = window.confirm(
      `Are you sure you want to discharge the patient from ${bedId}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setUpdatingBed(bedId);

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(bedId)}/discharge`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to discharge patient"
        );
      }

      setSuccessMessage(
        `Patient discharged successfully from ${bedId}. The bed is now Available.`
      );

      // Reload updated data from MongoDB
      await fetchBeds();
    } catch (err) {
      console.error("Discharge error:", err);
      setError(err.message || "Unable to discharge patient.");
    } finally {
      setUpdatingBed("");
    }
  };

  // --------------------------------------------------
  // 7. DASHBOARD COUNTS
  // --------------------------------------------------

  const totalBeds = beds.length;

  const availableBeds = beds.filter(
    (bed) => bed.status === "Available"
  ).length;

  const occupiedBeds = beds.filter(
    (bed) => bed.status === "Occupied"
  ).length;

  const alertBeds = beds.filter(
    (bed) => bed.status === "Alert"
  ).length;

  // --------------------------------------------------
  // 8. USER INTERFACE
  // --------------------------------------------------

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1>Smart Hospital Bed Monitoring System</h1>
          <p>
            IoT-Based Patient and Bed Management Dashboard
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchBeds}
        >
          Refresh Data
        </button>
      </header>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="success-message">
          {successMessage}

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Close success message"
          >
            ×
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="error-message">
          {error}

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      {/* DASHBOARD SUMMARY */}
      <section className="summary-section">
        <div className="summary-card">
          <h3>Total Beds</h3>
          <p>{totalBeds}</p>
        </div>

        <div className="summary-card available-card">
          <h3>Available Beds</h3>
          <p>{availableBeds}</p>
        </div>

        <div className="summary-card occupied-card">
          <h3>Occupied Beds</h3>
          <p>{occupiedBeds}</p>
        </div>

        <div className="summary-card alert-card">
          <h3>Alert Beds</h3>
          <p>{alertBeds}</p>
        </div>
      </section>

      {/* ADD PATIENT FORM */}
      <section className="form-section">
        <h2>Assign Patient to Bed</h2>

        <form onSubmit={handlePatientSubmit}>
          {/* BED ID */}
          <div className="form-group">
            <label htmlFor="bedId">Select Bed ID</label>

            <select
              id="bedId"
              name="bedId"
              value={form.bedId}
              onChange={handleChange}
              required
            >
              <option value="">Select a bed</option>

              {beds
                .filter((bed) => bed.status === "Available")
                .map((bed) => (
                  <option key={bed._id || bed.bedId} value={bed.bedId}>
                    {bed.bedId}
                    {bed.roomNumber
                      ? ` - Room ${bed.roomNumber}`
                      : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* PATIENT ID */}
          <div className="form-group">
            <label htmlFor="patientId">Patient ID</label>

            <input
              id="patientId"
              type="text"
              name="patientId"
              placeholder="Enter patient ID"
              value={form.patientId}
              onChange={handleChange}
              required
            />
          </div>

          {/* PATIENT NAME */}
          <div className="form-group">
            <label htmlFor="patientName">Patient Name</label>

            <input
              id="patientName"
              type="text"
              name="patientName"
              placeholder="Enter patient name"
              value={form.patientName}
              onChange={handleChange}
              required
            />
          </div>

          {/* AGE */}
          <div className="form-group">
            <label htmlFor="age">Age</label>

            <input
              id="age"
              type="number"
              name="age"
              placeholder="Enter age"
              value={form.age}
              onChange={handleChange}
              min="0"
              max="130"
              required
            />
          </div>

          {/* GENDER */}
          <div className="form-group">
            <label htmlFor="gender">Gender</label>

            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* ROOM NUMBER */}
          <div className="form-group">
            <label htmlFor="roomNumber">Room Number</label>

            <input
              id="roomNumber"
              type="text"
              name="roomNumber"
              placeholder="Enter room number"
              value={form.roomNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="submit-button"
            disabled={savingPatient}
          >
            {savingPatient ? "Saving Patient..." : "Assign Patient"}
          </button>
        </form>
      </section>

      {/* BED DETAILS TABLE */}
      <section className="table-section">
        <div className="table-heading">
          <h2>Hospital Bed Details</h2>

          <span>
            Auto-refresh: Every 5 seconds
          </span>
        </div>

        {loading ? (
          <p className="loading-message">
            Loading bed details...
          </p>
        ) : beds.length === 0 ? (
          <div className="empty-message">
            <p>No beds found in the database.</p>
            <p>
              Please add bed records to MongoDB first.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Bed ID</th>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {beds.map((bed) => (
                  <tr key={bed._id || bed.bedId}>
                    <td>{bed.bedId}</td>

                    <td>
                      {bed.patientId || "Not Assigned"}
                    </td>

                    <td>
                      {bed.patientName || "Not Assigned"}
                    </td>

                    <td>{bed.age ?? "—"}</td>

                    <td>{bed.gender || "—"}</td>

                    <td>
                      {bed.roomNumber || "Not Assigned"}
                    </td>

                    {/* BED STATUS */}
                    <td>
                      <select
                        className={`status ${(
                          bed.status || "Available"
                        ).toLowerCase()}`}
                        value={bed.status || "Available"}
                        disabled={updatingBed === bed.bedId}
                        onChange={(event) =>
                          updateBedStatus(
                            bed.bedId,
                            event.target.value
                          )
                        }
                      >
                        <option value="Available">
                          Available
                        </option>

                        <option value="Occupied">
                          Occupied
                        </option>

                        <option value="Alert">
                          Alert
                        </option>
                      </select>
                    </td>

                    {/* DISCHARGE BUTTON */}
                    <td>
                      {bed.status === "Occupied" ? (
                        <button
                          type="button"
                          className="discharge-button"
                          disabled={updatingBed === bed.bedId}
                          onClick={() =>
                            dischargePatient(bed.bedId)
                          }
                        >
                          {updatingBed === bed.bedId
                            ? "Processing..."
                            : "Discharge"}
                        </button>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <p>
          Smart Hospital Bed Monitoring System | MERN Stack
        </p>
        <p>
          Note: This is a project dashboard. It is not a
          substitute for a certified medical monitoring system.
        </p>
      </footer>
    </div>
  );
}

export default App;