const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "webdb2026",
  multipleStatements: true,
});

module.exports = db;
