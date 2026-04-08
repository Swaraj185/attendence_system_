db = db.getSiblingDB("attendance_system");

db.createCollection("users");
db.createCollection("attendance");

db.users.createIndex({ name: 1 }, { unique: true });
db.attendance.createIndex({ name: 1, date: 1 }, { unique: true });
db.attendance.createIndex({ date: 1 });

/*
users
{
  name: "string",
  createdAt: ISODate("2026-04-07T13:30:00.000Z")
}

attendance
{
  name: "string",
  date: "YYYY-MM-DD",
  time: "HH:MM",
  confidence: 0.92,
  status: "Present"
}
*/
