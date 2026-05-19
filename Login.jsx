import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Register.css";
import { useNavigate } from "react-router-dom";
function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
     const userCredential= await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = formData.email;
      const userRef = doc(db, "users", user);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setMessage("User data not found.");
        return;
      }
      const userData = userSnap.data();
      setMessage("Login successful!");

      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.role === "employee") {
        navigate("/employee-dashboard");
      } else {
        setMessage("Invalid user role.");
      }
      
    } catch (error) {
      console.error("Login error code:", error.code);
      console.error("Login error message:", error.message);
         setMessage("Login failed: " + error.code);
    //   setMessage(error.code + " - " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="register-page">
    <div className="register-card">
      <div className="register-header">
        <h1>Welcome</h1>
        <p>Login to access the Mini HCM Time Tracking System</p>
      </div>

      <form onSubmit={handleLogin} className="register-form">
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
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <button type="button" className="secondary-btn"
          onClick={() => navigate("/register")}
        >
          Register
        </button>

        {message && <p className="register-message">{message}</p>}
      </form>
    </div>
  </div>
);
}

export default Login;