import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { hashPassword } from './auth';

const dbPath = path.join(process.cwd(), 'sales-mtd.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Ensure schema & migrations exist
const migrationsDir = path.join(process.cwd(), 'migrations');
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      try {
        db.exec(stmt);
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.warn(`Migration notice [${file}]:`, e.message);
        }
      }
    }
  }
}

// Seed default users if empty or missing usernames
const defaultPass = hashPassword('admin123');
const managerPass = hashPassword('manager123');
const viewerPass = hashPassword('viewer123');
const now = new Date().toISOString();

const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, username, password_hash, full_name, role, is_active, created_at, updated_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);
  
  insertUser.run('u-admin', 'admin@makro.co.th', 'admin', defaultPass, 'System Administrator', 'ADMIN', now, now, now);
  insertUser.run('u-manager', 'manager@makro.co.th', 'manager', managerPass, 'Sales Manager', 'MANAGER', now, now, now);
  insertUser.run('u-viewer', 'viewer@makro.co.th', 'viewer', viewerPass, 'Executive Viewer', 'VIEWER', now, now, now);

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run('aud-init', 'system@makro.co.th', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'sales-mtd-db', 'Database initialized and seeded default users with usernames & passwords', now);
} else {
  // Update existing seeded users if missing username or password
  db.prepare("UPDATE users SET username = ?, password_hash = ? WHERE email = ? AND (username IS NULL OR username = '')")
    .run('admin', defaultPass, 'admin@makro.co.th');
  db.prepare("UPDATE users SET username = ?, password_hash = ? WHERE email = ? AND (username IS NULL OR username = '')")
    .run('manager', managerPass, 'manager@makro.co.th');
  db.prepare("UPDATE users SET username = ?, password_hash = ? WHERE email = ? AND (username IS NULL OR username = '')")
    .run('viewer', viewerPass, 'viewer@makro.co.th');
}

export default db;
