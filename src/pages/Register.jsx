// src/pages/Register.jsx

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Register.css";
import { useNavigate } from "react-router-dom";
function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    timezone: "Asia/Manila",
    role: "employee",
    scheduleStart: "09:00",
    scheduleEnd: "18:00",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      const userdoc =formData.email
      await setDoc(doc(db, "users", userdoc), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        timezone: formData.timezone,
        schedule: {
          start: formData.scheduleStart,
          end: formData.scheduleEnd,
        },
        createdAt: new Date(),
      });

      setMessage("Registration successful!");

      setFormData({
        name: "",
        email: "",
        password: "",
        timezone: "Asia/Manila",
        role: "employee",
        scheduleStart: "09:00",
        scheduleEnd: "18:00",
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
       
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Register an employee account for the Mini HCM System</p>
           <button
          type="button"
          className="close-btn"
          onClick={() => navigate("/")}
        >
          ×
        </button>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Timezone</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
              >
                <option value="Asia/Manila">Asia/Manila</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Shift Start</label>
              <input
                type="time"
                name="scheduleStart"
                value={formData.scheduleStart}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Shift End</label>
              <input
                type="time"
                name="scheduleEnd"
                value={formData.scheduleEnd}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>

          {message && <p className="register-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Register;