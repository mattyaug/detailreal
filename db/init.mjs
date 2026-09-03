import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Copy .env.example to .env.local and set it first.");
  process.exit(1);
}

const sql = await fs.readFile(new URL("./schema.sql", import.meta.url), "utf8");
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Database initialized successfully.");
} finally {
  await client.end();
}
