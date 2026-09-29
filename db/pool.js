const { Pool } = require("pg");
require("dotenv").config();

module.exports = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  database: process.env.DB_NAME || "inventory_app",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});