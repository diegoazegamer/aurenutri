import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    whatsapp TEXT,
    birth_date TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    uf TEXT,
    gender TEXT,
    height REAL,
    weight REAL,
    objective TEXT,
    activity_level TEXT,
    dietary_restrictions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Ensure new columns exist (for existing databases)
const columns = [
  { name: 'gender', type: 'TEXT' },
  { name: 'height', type: 'REAL' },
  { name: 'weight', type: 'REAL' },
  { name: 'objective', type: 'TEXT' },
  { name: 'activity_level', type: 'TEXT' },
  { name: 'dietary_restrictions', type: 'TEXT' }
];

for (const col of columns) {
  try {
    db.exec(`ALTER TABLE patients ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column might already exist
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/register", (req, res) => {
    const { name, email, password, whatsapp } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO patients (name, email, password, whatsapp) VALUES (?, ?, ?, ?)");
      const info = stmt.run(name, email, password, whatsapp);
      const user = db.prepare("SELECT * FROM patients WHERE id = ?").get(info.lastInsertRowid);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM patients WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: "Credenciais inválidas" });
    }
  });

  app.post("/api/update-profile", (req, res) => {
    const { 
      id, birth_date, cep, street, number, neighborhood, city, state, uf,
      gender, height, weight, objective, activity_level, dietary_restrictions
    } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE patients 
        SET birth_date = ?, cep = ?, street = ?, number = ?, neighborhood = ?, city = ?, state = ?, uf = ?,
            gender = ?, height = ?, weight = ?, objective = ?, activity_level = ?, dietary_restrictions = ?
        WHERE id = ?
      `);
      stmt.run(
        birth_date, cep, street, number, neighborhood, city, state, uf,
        gender, height, weight, objective, activity_level, dietary_restrictions,
        id
      );
      const user = db.prepare("SELECT * FROM patients WHERE id = ?").get(id);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
