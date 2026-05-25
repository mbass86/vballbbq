import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/tournament.sqlite');

const db = new sqlite3.Database(dbPath);

export function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'team_captain',
        team_id TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        team1_id TEXT,
        team2_id TEXT,
        score1 INTEGER,
        score2 INTEGER,
        court TEXT,
        time TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS roster (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    // Check if admin user exists, if not create
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (!row) {
        const hash = bcrypt.hashSync('password123', 10);
        db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
      }
    });

    // Check if matches table is empty so we can seed it with default data.
    db.get('SELECT COUNT(*) as count FROM matches', (err, row) => {
      if (row.count === 0) {
        seedDefaults();
      }
    });
  });
}

function seedDefaults() {
  const DEFAULT_TEAMS = [
    { id: '1', name: 'Triple Play' },
    { id: '2', name: 'Sunsetters' },
    { id: '3', name: 'Writers Block' },
    { id: '4', name: 'Git it Over' },
    { id: '5', name: 'LS Certified to Route & Serve' },
    { id: '6', name: 'Stacked' },
    { id: '7', name: 'Angry Birds' },
    { id: '8', name: 'DC Spikers' },
    { id: '9', name: 'The Garbage Collectors' },
    { id: '10', name: 'The Quality Custodians' },
    { id: '11', name: "Dung's Yougins" },
    { id: '12', name: 'High CPU' },
    { id: '13', name: 'The Cluster Busters' },
    { id: '14', name: 'The Bit Bumpers' },
    { id: '15', name: 'Kiss my Ace' },
    { id: '16', name: '#1' },
    { id: '17', name: 'Tecs on the Beach' },
    { id: '18', name: 'Underlay Spiker' },
    { id: '19', name: 'Node is Incompatible' },
    { id: '20', name: "The SA's" },
    { id: '21', name: 'Team SwAAT' },
    { id: '22', name: 'SARve, Set, SP-IXR' },
    { id: '23', name: 'CI/CD Spikeline' },
  ];

  const DEFAULT_MATCHES = [
    { id: 'm1', team1_id: '1', team2_id: '2', court: 'Court 1', time: '11:00 AM' },
    { id: 'm2', team1_id: '3', team2_id: '4', court: 'Court 2', time: '11:00 AM' },
    { id: 'm3', team1_id: '5', team2_id: '6', court: 'Court 3', time: '11:00 AM' },
    { id: 'm4', team1_id: '7', team2_id: '8', court: 'Court 4', time: '11:00 AM' },
    { id: 'm5', team1_id: '9', team2_id: '10', court: 'Court 5', time: '11:00 AM' },
    { id: 'm6', team1_id: '11', team2_id: '12', court: 'Court 6', time: '11:00 AM' },
    { id: 'm7', team1_id: '13', team2_id: '14', court: 'Court 7', time: '11:00 AM' },
    { id: 'm8', team1_id: '15', team2_id: '16', court: 'Court 8', time: '11:00 AM' },
  ];

  const insertTeam = db.prepare('INSERT INTO teams (id, name) VALUES (?, ?)');
  DEFAULT_TEAMS.forEach(team => insertTeam.run(team.id, team.name));
  insertTeam.finalize();

  const insertMatch = db.prepare('INSERT INTO matches (id, team1_id, team2_id, court, time) VALUES (?, ?, ?, ?, ?)');
  DEFAULT_MATCHES.forEach(match => insertMatch.run(match.id, match.team1_id, match.team2_id, match.court, match.time));
  insertMatch.finalize();
}

export default db;
