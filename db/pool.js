const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

module.exports = new Pool(connectionString ? {
  connectionString,
  ssl: { rejectUnauthorized: false },
} : {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  database: process.env.DB_NAME || "inventory_app",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});