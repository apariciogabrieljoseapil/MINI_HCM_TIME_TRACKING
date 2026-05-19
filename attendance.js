import admin from "firebase-admin";

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const calculateNightDifferential = (timeIn, timeOut) => {
  let ndMinutes = 0;

  const current = new Date(timeIn);
  const end = new Date(timeOut);

  while (current < end) {
    const hour = current.getHours();

    if (hour >= 22 || hour < 6) { ndMinutes++;}
    current.setMinutes(current.getMinutes() + 1);
  }

  return ndMinutes ;
};

const computeDailyAttendance = async (db, userId, workDate) => {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    throw new Error("User profile not found.");
  }

  const userData = userDoc.data();
  const schedule = userData.schedule;

  const attendanceSnapshot = await db
    .collection("attendance")
    .where("userId", "==", userId)
    .where("workDate", "==", workDate)  
    .get();

  const punches = attendanceSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((punch) => punch.timestamp.toDate().toDateString() === new Date(workDate).toDateString())
    .sort((a, b) => {
      return a.timestamp.toDate() - b.timestamp.toDate();
    });

  const timeInRecord = punches.find((punch) => punch.type === "time-in");
  const timeOutRecords = punches.filter((punch) => punch.type === "time-out");
  const timeOutRecord = timeOutRecords[timeOutRecords.length - 1];

  if (!timeInRecord || !timeOutRecord) {
    console.log("Missing time-in or time-out.");
    return;
  }

  const sameUser =timeInRecord.userId === userId && timeOutRecord.userId === userId;
  const sameWorkDate =timeInRecord.workDate === workDate && timeOutRecord.workDate === workDate;
  if (!sameUser || !sameWorkDate) {
    console.log(
      `[${userId}] Skipping computation — time-in and time-out do not share the same user or workDate.`
    );
    return;
  }

  const timeIn = timeInRecord.timestamp.toDate();
  const timeOut = timeOutRecord.timestamp.toDate();

  const shiftStartMinutes = timeToMinutes(schedule.start);
  const shiftEndMinutes = timeToMinutes(schedule.end);

  let scheduledMinutes;

  if (shiftEndMinutes <= shiftStartMinutes) {
    scheduledMinutes = 1440 - shiftStartMinutes + shiftEndMinutes;
  } else {
    scheduledMinutes = shiftEndMinutes - shiftStartMinutes;
  }

  const totalWorkedMinutes = Math.floor((timeOut - timeIn) / (1000 * 60));

  let actualInMinutes = timeIn.getHours() * 60 + timeIn.getMinutes();
  let actualOutMinutes = timeOut.getHours() * 60 + timeOut.getMinutes();

  if (timeOut.getDate() !== timeIn.getDate()) {
    actualOutMinutes += 1440;
  }

  let adjustedShiftEndMinutes = shiftEndMinutes;

  if (shiftEndMinutes <= shiftStartMinutes) {
    adjustedShiftEndMinutes += 1440;
  }

  const lateMinutes = Math.max(0, actualInMinutes - shiftStartMinutes);

  const undertimeMinutes = Math.max(0,adjustedShiftEndMinutes - actualOutMinutes);
  const overtimeMinutes = Math.max(0,actualOutMinutes - adjustedShiftEndMinutes);
  const regularMinutes = scheduledMinutes - 60;

  const nightDifferentialminutes = calculateNightDifferential(timeIn, timeOut);

  const summaryId = `${userId}_${workDate}`;

  await db.collection("dailySummary").doc(summaryId).set({
    date: admin.firestore.Timestamp.fromDate(new Date(workDate)),
    late: lateMinutes,
    overtime:overtimeMinutes,
    undertime: undertimeMinutes,
    regularHours: regularMinutes,
    nightDifferential: nightDifferentialminutes,
    userId,
    
    
  });

};

export { computeDailyAttendance };