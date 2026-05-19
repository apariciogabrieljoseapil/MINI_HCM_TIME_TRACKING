import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
const PORT= import.meta.env.VITE_API_BASE_URL;

console.log("Admin Dashboard running on port:", PORT);
function AdminDashboard() {
  const navigate = useNavigate();
  
 const [punches, setPunches] = useState([]);
 const [reports, setReports] = useState([]);
 const [editingPunch, setEditingPunch] = useState(null);
 const [weeklyReport, setWeeklyReport] = useState([]);
 const [activeView, setActiveView] = useState("punches");
  const fetchPunches = async () => {
    try {
      const response = await fetch(`${PORT}/admin/punches`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }
      setPunches(data.punches);
    } catch (error) {
      alert(error.message);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${PORT}/admin/dailySummaries`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }
    //   console.log("Fetched reports:", data);
      setReports(data.reports);
    } catch (error) {
      alert(error.message);
    }
  };
 const fetchWeeklyReports = async () => {
    try {
      const response = await fetch(
        `${PORT}/admin/weeklySummaries`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }
    // console.log("Fetched weekly reports:", data);
      setWeeklyReport(data.weeklyReport);
    } catch (error) {
      alert(error.message);
    }
  };
  useEffect(() => {
    fetchPunches();
    fetchReports();
    fetchWeeklyReports();
  }, []);



 const toDate = (dateValue) => {
  if (!dateValue) return null;
  // Firestore Timestamp object from API: { _seconds, _nanoseconds }
  if (dateValue._seconds !== undefined) {
    return new Date(dateValue._seconds * 1000);
  }
  // Already a number (Unix ms) or ISO string
  return new Date(dateValue);
};
const formatDateTime = (dateValue) => {
  const date = toDate(dateValue);
  if (!date || isNaN(date)) return "—";

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const formatDateForInput = (dateValue) => {
  const date = toDate(dateValue);
  if (!date || isNaN(date)) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};
const handleEditClick = (punch) => {
  setEditingPunch({
    ...punch,
    timestamp: formatDateForInput(punch.timestamp), // ✅ now handles Firestore format
  });
};
 const handleEditChange = (e) => {
    setEditingPunch({
      ...editingPunch,
      [e.target.name]: e.target.value,
    });
  };
  const formatTime = (value) =>{
    if (value === undefined || value === null) return "N/A";

    const str = value;
    const hours = Math.floor(str / 60);
    const formattedMinutes = str % 60;
    return `${hours}h ${String(formattedMinutes).padStart(2, "0")}m`;
  }
  const savePunchEdit = async () => {
    try {
      const response = await fetch(
        `${PORT}/admin/punches/${editingPunch.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: editingPunch.userId,
            type: editingPunch.type,
            timestamp: editingPunch.timestamp,
            workDate: editingPunch.workDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert(data.message);
      setEditingPunch(null);
      fetchPunches();
      fetchReports();
    } catch (error) {
      alert(error.message);
    }
  };
 
  return (
  <div className="admin-page">
    <aside className="admin-sidebar">
      <h2>Admin Panel</h2>

      <button
        type="button"
        className={activeView === "punches" ? "sidebar-btn active" : "sidebar-btn"}
        onClick={() => setActiveView("punches")}
      >
        Punches
      </button>

      <button
        type="button"
        className={activeView === "weekly" ? "sidebar-btn active" : "sidebar-btn"}
        onClick={() => setActiveView("weekly")}
      >
        Weekly Reports
      </button>

      <button
        type="button"
        className={activeView === "daily" ? "sidebar-btn active" : "sidebar-btn"}
        onClick={() => setActiveView("daily")}
      >
        Daily Reports
      </button>

      <button
        type="button"
        className="sidebar-btn logout"
        onClick={() => navigate("/")}
      >
        Close
      </button>
    </aside>

    <main className="admin-content">
      <div className="dashboard-card">
        <div className="register-header">
          <h1>Admin Dashboard</h1>
          <p>View and manage employee punches, weekly reports, and daily reports</p>
        </div>

        {activeView === "punches" && (
          <>
            <div className="history-section">
              <h2>Employee Punches</h2>

              <table className="history-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Type</th>
                    <th>Work Date</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {punches.map((punch) => (
                    <tr key={punch.id}>
                      <td>{punch.userId}</td>
                      <td>{punch.type}</td>
                      <td>{punch.workDate}</td>
                      <td>{formatDateTime(punch.timestamp)}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleEditClick(punch)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editingPunch && (
              <div className="edit-box">
                <h2>Edit Punch</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={editingPunch.type}
                      onChange={handleEditChange}
                    >
                      <option value="time-in">time-in</option>
                      <option value="time-out">time-out</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Work Date</label>
                    <input
                      type="date"
                      name="workDate"
                      value={editingPunch.workDate}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Timestamp</label>
                  <input
                    type="datetime-local"
                    name="timestamp"
                    value={editingPunch.timestamp}
                    onChange={handleEditChange}
                  />
                </div>

                <button
                  type="button"
                  className="register-btn"
                  onClick={savePunchEdit}
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingPunch(null)}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}

        {activeView === "weekly" && (
          <div className="history-section">
            <h2>Weekly Reports</h2>

            <table className="history-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Week Start</th>
                  <th>Week End</th>
                  <th>Days</th>
                  <th>Regular Hours</th>
                  <th>OT</th>
                  <th>ND</th>
                  <th>Late</th>
                  <th>Undertime</th>
                </tr>
              </thead>

              <tbody>
                {weeklyReport.map((report, index) => (
                  <tr key={`${report.userId}-${index}`}>
                    <td>{report.userId}</td>
                    <td>{formatDateTime(report.weekStart)}</td>
                    <td>{formatDateTime(report.weekEnd)}</td>
                    <td>{report.days}</td>
                    <td>{formatTime(report.regularHours)}</td>
                    <td>{formatTime(report.overtime)}</td>
                    <td>{formatTime(report.nightDifferential)}</td>
                    <td>{formatTime(report.late)}</td>
                    <td>{formatTime(report.undertime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === "daily" && (
          <div className="history-section">
            <h2>Daily Reports</h2>

            <table className="history-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Date</th>
                  <th>Regular Hours</th>
                  <th>OT</th>
                  <th>ND</th>
                  <th>Late</th>
                  <th>Undertime</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.userId}</td>
                    <td>{formatDateTime(report.date)}</td>
                    <td>{formatTime(report.regularHours)}</td>
                    <td>{formatTime(report.overtime)}</td>
                    <td>{formatTime(report.nightDifferential)}</td>
                    <td>{formatTime(report.late)}</td>
                    <td>{formatTime(report.undertime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          className="register-btn"
          onClick={() => {
            fetchPunches();
            fetchReports();
            fetchWeeklyReports();
          }}
        >
          Refresh Data
        </button>
      </div>
    </main>
  </div>
);
}

export default AdminDashboard;