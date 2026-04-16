const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "StrongPassword123!",
  database: "stage_one_db"
});

db.connect((err) => {
  if (err) {
    console.log("❌ MySQL Connection Failed:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

module.exports = db;
