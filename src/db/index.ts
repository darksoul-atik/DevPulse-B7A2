import { Pool } from "pg";
import config from "../config/index.js";

//!Connecting neonDB with using Pool package
export const pool = new Pool({
  connectionString: config.connection_string,
});

//!Creating tables in neonDB database if not exist
export const initDB = async () => {
  try {
    //!USERS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor'
        CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    //!ISSUES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL
        CHECK (CHAR_LENGTH(description) >= 20),
        type VARCHAR(20) NOT NULL
        CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Database Connected Successfully");
  } catch (error) {
    console.log(error);
  }
};