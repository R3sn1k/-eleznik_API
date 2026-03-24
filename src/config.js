const path = require("path");

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "super-secret-school-project-key",
  dbPath: path.join(__dirname, "..", "data", "db.json"),
};
