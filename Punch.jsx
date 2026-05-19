// src/pages/Punch.jsx

import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Punch() {
  const navigate = useNavigate();

  const punchIn = async () => {
    const user = auth.currentUser.email;

    if (!user) {
      alert("Please login first.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/punch-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert(data.message);
    } catch (error) {
      console.error("Punch in error:", error);
      alert(error.message);
    }
  };

  const punchOut = async () => {
    const user = auth.currentUser.email;

    if (!user) {
      alert("Please login first.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/punch-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert(data.message);
    } catch (error) {
      console.error("Punch out error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <button
          type="button"
          className="close-btn"
          onClick={() => navigate("/employee-dashboard")}
        >
          ×
        </button>

        <div className="register-header">
          <h1>Attendance Punch</h1>
          <p>Record your daily time-in and time-out</p>
        </div>

        <div className="register-form">
          <button className="register-btn" type="button" onClick={punchIn}>
            Punch In
          </button>

          <button className="register-btn" type="button" onClick={punchOut}>
            Punch Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Punch;