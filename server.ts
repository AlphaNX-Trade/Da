import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_PATH = path.join(__dirname, 'dasara_zone.db');

// Initialize SQLite database
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    class TEXT NOT NULL,
    section TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participation (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(participant_id, game_id),
    FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

console.log(`[Dasara Zone] SQLite database initialized at ${DB_PATH}`);

const app = express();
app.use(express.json());

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'sqlite-persistent',
    timestamp: new Date().toISOString(),
    name: 'Dasara Zone',
    developer: 'Alpha'
  });
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const gamesCountStmt = db.prepare('SELECT COUNT(*) as count FROM games');
    const participantsCountStmt = db.prepare('SELECT COUNT(*) as count FROM participants');
    const selectionsCountStmt = db.prepare('SELECT COUNT(*) as count FROM participation');

    const gamesCount = (gamesCountStmt.get() as any)?.count || 0;
    const participantsCount = (participantsCountStmt.get() as any)?.count || 0;
    const selectionsCount = (selectionsCountStmt.get() as any)?.count || 0;

    res.json({
      gamesCount,
      participantsCount,
      selectionsCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Games: List
app.get('/api/games', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        g.id, 
        g.name, 
        g.created_at,
        COUNT(p.id) as participant_count
      FROM games g
      LEFT JOIN participation p ON g.id = p.game_id
      GROUP BY g.id
      ORDER BY g.created_at ASC
    `);
    const games = stmt.all();
    res.json(games);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Games: Create
app.post('/api/games', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    const trimmedName = name.trim();

    // Check duplicate
    const checkStmt = db.prepare('SELECT id FROM games WHERE LOWER(name) = LOWER(?)');
    const existing = checkStmt.get(trimmedName);
    if (existing) {
      return res.status(409).json({ error: `Game "${trimmedName}" already exists` });
    }

    const id = 'game_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const createdAt = new Date().toISOString();

    const insertStmt = db.prepare('INSERT INTO games (id, name, created_at) VALUES (?, ?, ?)');
    insertStmt.run(id, trimmedName, createdAt);

    res.status(201).json({
      id,
      name: trimmedName,
      created_at: createdAt,
      participant_count: 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Games: Update
app.put('/api/games/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    const trimmedName = name.trim();

    // Check duplicate with another game
    const checkStmt = db.prepare('SELECT id FROM games WHERE LOWER(name) = LOWER(?) AND id != ?');
    const existing = checkStmt.get(trimmedName, id);
    if (existing) {
      return res.status(409).json({ error: `Another game named "${trimmedName}" already exists` });
    }

    const updateStmt = db.prepare('UPDATE games SET name = ? WHERE id = ?');
    const result = updateStmt.run(trimmedName, id);

    if ((result as any).changes === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ id, name: trimmedName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Games: Delete
app.delete('/api/games/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check if game exists
    const checkStmt = db.prepare('SELECT id, name FROM games WHERE id = ?');
    const game = checkStmt.get(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Cascade delete is handled by SQLite foreign keys, but we can also explicitly clear participation
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM participation WHERE game_id = ?').run(id);
      db.prepare('DELETE FROM games WHERE id = ?').run(id);
      db.exec('COMMIT;');
      res.json({ success: true, message: 'Game and associated participation records deleted' });
    } catch (e: any) {
      db.exec('ROLLBACK;');
      throw e;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Participants: List
app.get('/api/participants', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.age,
        p.class,
        p.section,
        p.created_at,
        COUNT(pt.id) as games_count
      FROM participants p
      LEFT JOIN participation pt ON p.id = pt.participant_id
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `);
    const participants = stmt.all();
    res.json(participants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Participants: Create
app.post('/api/participants', (req, res) => {
  try {
    const { name, age, class: className, section } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Participant name is required' });
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      return res.status(400).json({ error: 'Age must be a positive whole number' });
    }

    if (!className || typeof className !== 'string' || className.trim().length === 0) {
      return res.status(400).json({ error: 'Class is required' });
    }

    const trimmedName = name.trim();
    const trimmedClass = className.trim();
    const trimmedSection = section && typeof section === 'string' ? section.trim() : null;

    const id = 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const createdAt = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO participants (id, name, age, class, section, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(id, trimmedName, parsedAge, trimmedClass, trimmedSection, createdAt);

    res.status(201).json({
      id,
      name: trimmedName,
      age: parsedAge,
      class: trimmedClass,
      section: trimmedSection,
      created_at: createdAt,
      games_count: 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Participants: Update
app.put('/api/participants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, class: className, section } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Participant name is required' });
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      return res.status(400).json({ error: 'Age must be a positive whole number' });
    }

    if (!className || typeof className !== 'string' || className.trim().length === 0) {
      return res.status(400).json({ error: 'Class is required' });
    }

    const trimmedName = name.trim();
    const trimmedClass = className.trim();
    const trimmedSection = section && typeof section === 'string' ? section.trim() : null;

    const updateStmt = db.prepare(`
      UPDATE participants 
      SET name = ?, age = ?, class = ?, section = ?
      WHERE id = ?
    `);
    const result = updateStmt.run(trimmedName, parsedAge, trimmedClass, trimmedSection, id);

    if ((result as any).changes === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({
      id,
      name: trimmedName,
      age: parsedAge,
      class: trimmedClass,
      section: trimmedSection
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Participants: Delete
app.delete('/api/participants/:id', (req, res) => {
  try {
    const { id } = req.params;

    const checkStmt = db.prepare('SELECT id FROM participants WHERE id = ?');
    const participant = checkStmt.get(id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM participation WHERE participant_id = ?').run(id);
      db.prepare('DELETE FROM participants WHERE id = ?').run(id);
      db.exec('COMMIT;');
      res.json({ success: true, message: 'Participant and associated participation records deleted' });
    } catch (e: any) {
      db.exec('ROLLBACK;');
      throw e;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Participation: List all selections
app.get('/api/participation', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, participant_id, game_id, created_at
      FROM participation
    `);
    const records = stmt.all();
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Participation: Toggle selection (Tick / Untick)
app.post('/api/participation/toggle', (req, res) => {
  try {
    const { participant_id, game_id, selected } = req.body;

    if (!participant_id || !game_id) {
      return res.status(400).json({ error: 'participant_id and game_id are required' });
    }

    // Verify both participant and game exist
    const pCheck = db.prepare('SELECT id FROM participants WHERE id = ?').get(participant_id);
    if (!pCheck) {
      return res.status(404).json({ error: 'Participant does not exist' });
    }

    const gCheck = db.prepare('SELECT id FROM games WHERE id = ?').get(game_id);
    if (!gCheck) {
      return res.status(404).json({ error: 'Game does not exist' });
    }

    if (selected) {
      // Add participation record if not already existing
      const existing = db.prepare('SELECT id FROM participation WHERE participant_id = ? AND game_id = ?').get(participant_id, game_id);
      if (!existing) {
        const id = 'pt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const createdAt = new Date().toISOString();
        const insertStmt = db.prepare('INSERT INTO participation (id, participant_id, game_id, created_at) VALUES (?, ?, ?, ?)');
        insertStmt.run(id, participant_id, game_id, createdAt);
        return res.json({ selected: true, record: { id, participant_id, game_id, created_at: createdAt } });
      }
      return res.json({ selected: true, record: existing });
    } else {
      // Remove participation record
      const delStmt = db.prepare('DELETE FROM participation WHERE participant_id = ? AND game_id = ?');
      delStmt.run(participant_id, game_id);
      return res.json({ selected: false, participant_id, game_id });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV: Participants
app.get('/api/export/participants', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT name, age, class, COALESCE(section, '') as section
      FROM participants
      ORDER BY name ASC
    `);
    const rows = stmt.all() as any[];

    let csv = '\uFEFFName,Age,Class,Section\r\n';
    for (const r of rows) {
      const cleanName = `"${String(r.name).replace(/"/g, '""')}"`;
      const cleanClass = `"${String(r.class).replace(/"/g, '""')}"`;
      const cleanSection = `"${String(r.section).replace(/"/g, '""')}"`;
      csv += `${cleanName},${r.age},${cleanClass},${cleanSection}\r\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dasara_zone_participants.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV: Participation Matrix
app.get('/api/export/participation', (req, res) => {
  try {
    const games = (db.prepare('SELECT id, name FROM games ORDER BY created_at ASC').all() as any[]);
    const participants = (db.prepare("SELECT id, name, age, class, COALESCE(section, '') as section FROM participants ORDER BY name ASC").all() as any[]);
    const selections = (db.prepare('SELECT participant_id, game_id FROM participation').all() as any[]);

    const selectionSet = new Set<string>();
    for (const s of selections) {
      selectionSet.add(`${s.participant_id}_${s.game_id}`);
    }

    // Header row
    const gameHeaders = games.map(g => `"${String(g.name).replace(/"/g, '""')}"`).join(',');
    let csv = `\uFEFFName,Age,Class,Section${gameHeaders ? ',' + gameHeaders : ''},Total Games\r\n`;

    // Data rows
    for (const p of participants) {
      const cleanName = `"${String(p.name).replace(/"/g, '""')}"`;
      const cleanClass = `"${String(p.class).replace(/"/g, '""')}"`;
      const cleanSection = `"${String(p.section).replace(/"/g, '""')}"`;

      let gameCount = 0;
      const gameColumns = games.map(g => {
        const isSelected = selectionSet.has(`${p.id}_${g.id}`);
        if (isSelected) gameCount++;
        return isSelected ? 'Yes' : 'No';
      }).join(',');

      csv += `${cleanName},${p.age},${cleanClass},${cleanSection}${gameColumns ? ',' + gameColumns : ''},${gameCount}\r\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dasara_zone_participation.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// App ZIP Download: Packages current source code, database, and configurations
app.get('/api/download-zip', (req, res) => {
  try {
    const scriptPath = path.join(__dirname, 'scripts', 'package-zip.py');
    const zipPath = path.join(__dirname, 'dasara-zone-app.zip');

    // Run packaging script to ensure latest files are bundled
    execSync(`python3 "${scriptPath}"`, { stdio: 'pipe' });

    if (!fs.existsSync(zipPath)) {
      throw new Error('ZIP file could not be generated.');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dasara-zone-app.zip"');
    res.download(zipPath, 'dasara-zone-app.zip', (err) => {
      if (err) {
        console.error('[Dasara Zone] Error streaming ZIP download:', err);
      }
    });
  } catch (err: any) {
    console.error('[Dasara Zone] ZIP creation failed:', err);
    res.status(500).json({ error: 'Failed to create application ZIP: ' + err.message });
  }
});

// Setup Vite middleware for development and static serve for production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dasara Zone] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
