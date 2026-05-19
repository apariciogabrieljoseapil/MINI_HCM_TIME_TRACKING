// server.js

import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { computeDailyAttendance } from "./attendance.js";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.ALLOW_ORIGIN ,
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
  })
);
const serviceAccount = JSON.parse(
  readFileSync(
    process.env.HCM_ASSESSMENT,
    "utf8"
  )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
app.get("/api/admin/punches", async (req, res) => {
  try{
    const punchesSnapshot = await db.collection("attendance").orderBy("timestamp", "desc").get();

    const punches = punchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ punches });
   
  } catch (error) {
    console.error("Error fetching punches:", error);
    res.status(500).json({ message: error.message });
  }
});
app.put("/api/admin/punches/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const { type,timestamp,userId,workDate  } = req.body;
    if (!userId || !type || !timestamp || !workDate) {
      return res.status(400).json({
        message: "Missing required fields.",
      });
    }
     await db.collection("attendance").doc(id).update({
      userId,
      type,
      workDate,
      timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
    });
    await computeDailyAttendance(db, userId, workDate);
    console.log(`Punch updated`);
    res.status(200).json({ message: "Punch updated successfully." });
  } catch (error) {
    console.error("Error updating punch:", error);
    res.status(500).json({ message: error.message });
  }
});
app.get("/api/admin/dailySummaries", async (req, res) => {
  try {
    const summariesSnapshot = await db.collection("dailySummary").orderBy("date", "desc").get();
    const reports = summariesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));    
    res.status(200).json({ reports });
     console.log("Fetched daily summaries:");
  } catch (error) {
    console.error("Error fetching daily summaries:", error);
    res.status(500).json({ message: error.message });
  }
});
// Punch In
app.post("/api/punch-in", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId." });
    }

    const now = new Date();
    const workDate = getLocalDate(now);

    const existingTimeIn = await db
      .collection("attendance")
      .where("userId", "==", userId)
      .where("type", "==", "time-in")
      .where("workDate", "==", workDate)
      .get();

    if (!existingTimeIn.empty) {
      return res.status(400).json({
        message: "You have already punched in for today.",
      });
    }
    await db.collection("attendance").add({
      userId,
      type: "time-in",
      timestamp: admin.firestore.Timestamp.fromDate(now),
      workDate,
    });

    res.status(200).json({
      message: "Time-in recorded successfully.",
      workDate,
    });
    console.log(`Punch in`);
  } catch (error) {
    console.error("Punch in error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Punch Out
app.post("/api/punch-out", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId." });
    }

    const timeInSnapshot = await db
      .collection("attendance")
      .where("userId", "==", userId)
      .where("type", "==", "time-in")
      .get();

    if (timeInSnapshot.empty) {
      return res.status(404).json({
        message: "No time-in record found.",
      });
    }

    const timeInRecords = timeInSnapshot.docs
      .map((doc) => doc.data())
      .filter((record) => record.timestamp)
      .sort((a, b) => {
        return b.timestamp.toDate() - a.timestamp.toDate();
      });

    const latestTimeIn = timeInRecords[0];
    const workDate = latestTimeIn.workDate;

    const existingTimeOut = await db
      .collection("attendance")
      .where("userId", "==", userId)
      .where("type", "==", "time-out")
      .where("workDate", "==", workDate)
      .get();

    if (!existingTimeOut.empty) {
      return res.status(400).json({
        message: "You have already punched out for today.",
      });
    }
    const now = new Date();

    await db.collection("attendance").add({
      userId,
      type: "time-out",
      timestamp: admin.firestore.Timestamp.fromDate(now),
      workDate,
    });

    await computeDailyAttendance(db, userId, workDate);

    res.status(200).json({
      message: "Time-out recorded and daily attendance computed.",
      workDate,
    });
    console.log(`Punch out`);
  } catch (error) {
    console.error("Punch out error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get weekly reports for all employees
app.get("/api/admin/weeklySummaries", async (req, res) => {
  try {
    const snapshot = await db.collection("dailySummary").get();
    const getWeekStart = (date) => {
      const d = new Date(date);
      const day = d.getDay(); // Sunday = 0, Monday = 1
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    const getWeekEnd = (weekStart) => {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return end;
    };
    const weeklyMap = new Map();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.userId || !data.date) {
        return;
      }
      const date = data.date.toDate();
      const weekStart = getWeekStart(date);
      const weekEnd = getWeekEnd(weekStart);
      const weekKey = `${data.userId}_${weekStart.toISOString().split("T")[0]}`;
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          userId: data.userId,
          weekStart,
          weekEnd,
          regularHours: 0,
          overtime: 0,
          nightDifferential: 0,
          late: 0,
          undertime: 0,
          days: 0,
        });
      }
      const weekly = weeklyMap.get(weekKey);

      weekly.regularHours += Number(data.regularHours || 0);
      weekly.overtime += Number(data.overtime || 0);
      weekly.nightDifferential += Number(data.nightDifferential || 0);
      weekly.late += Number(data.late || 0);
      weekly.undertime += Number(data.undertime || 0);
      weekly.days += 1;
    });

    const weeklyReport = Array.from(weeklyMap.values()).map((report) => ({
      ...report,
      regularHours: Number(report.regularHours.toFixed(2)),
      overtime: Number(report.overtime.toFixed(2)),
      nightDifferential: Number(report.nightDifferential.toFixed(2)),
      late: Number(report.late.toFixed(2)),
      undertime: Number(report.undertime.toFixed(2)),
    }));
    console.log("Weekly reports generated:");
    res.status(200).json({ weeklyReport });
  } catch (error) {
    // console.error("Weekly reports error:", error);
    res.status(500).json({ message: error.message });
  }
});
app.listen(process.env.PORT , () => {
  console.log("Express server running on http://localhost:" + process.env.PORT);
});
