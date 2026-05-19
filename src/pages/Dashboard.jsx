// src/pages/Dashboard.jsx

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Dashboard() {

  const navigate = useNavigate();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDailySummaries = async () => {
    const user = auth.currentUser.email;

    if (!user) {
      alert("Please login first.");
      navigate("/");
      return;
    }

    try {
      const summaryQuery = query(
        collection(db, "dailySummary"),
        where("userId", "==", user),
      );

      const snapshot = await getDocs(summaryQuery);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSummaries(data);
    } catch (error) {
      console.error("Error fetching daily summaries:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummaries();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    return timestamp.toDate().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const formatTime = (value) =>{
    if (value === undefined || value === null) return "N/A";

    const str = value;
    const hours = Math.floor(str / 60);
    const formattedMinutes = str % 60;
    return `${hours}h ${String(formattedMinutes).padStart(2, "0")}m`;
  }

  const totalRegularHours = summaries.reduce(
    (total, item) => total + Number(item.regularHours || 0),
    0
  );

  const totalOvertime = summaries.reduce(
    (total, item) => total + Number(item.overtime || 0),
    0
  );

  const totalNightDifferential = summaries.reduce(
    (total, item) => total + Number(item.nightDifferential || 0),
    0
  );

  const totalLate = summaries.reduce(
    (total, item) => total + Number(item.late || 0),
    0
  );

  const totalUndertime = summaries.reduce(
    (total, item) => total + Number(item.undertime || 0),
    0
  );

  if (loading) {
    return (
      <div className="register-page">
        <div className="register-card">
          <div className="register-header">
            <h1>Loading Dashboard...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="dashboard-card">
        <button
          type="button"
          className="close-btn"
          onClick={() => navigate("/")}
        >
          ×
        </button>

        <div className="register-header">
          <h1>Employee Dashboard</h1>
          <p>Daily attendance summary and history</p>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <h3>Regular Hours</h3>
            <p>{formatTime(totalRegularHours)}</p>
          </div>

          <div className="kpi-card">
            <h3>Overtime</h3>
            <p>{formatTime(totalOvertime)}</p>
          </div>

          <div className="kpi-card">
            <h3>Night Diff.</h3>
            <p>{formatTime(totalNightDifferential)}</p>
          </div>

          <div className="kpi-card">
            <h3>Late</h3>
            <p>{formatTime(totalLate)}</p>
          </div>

          <div className="kpi-card">
            <h3>Undertime</h3>
            <p>{formatTime(totalUndertime)}</p>
          </div>
        </div>

        <div className="history-section">
          <h2>History Table</h2>

          {summaries.length === 0 ? (
            <p className="register-message">No daily summary records found.</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Regular Hours</th>
                  <th>OT</th>
                  <th>ND</th>
                  <th>Late</th>
                  <th>Undertime</th>
                </tr>
              </thead>

              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.id}>
                    <td>{formatDate(summary.date)}</td>
                    <td>{formatTime(summary.regularHours)}</td>
                    <td>{formatTime(summary.overtime)}</td>
                    <td>{formatTime(summary.nightDifferential)}</td>
                    <td>{formatTime(summary.late)}</td>
                    <td>{formatTime(summary.undertime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="register-header">
            <button
          type="button"
          className="register-btn"
          onClick={() => navigate("/punch")}
        >
          Back to Punch
        </button>
        </div>
        
      </div>
    </div>
  );
}

export default Dashboard;