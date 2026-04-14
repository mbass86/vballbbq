import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-tournament-key';

// Init DB
initDatabase();

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes
app.post('/api/auth/register', (req, res) => {
  const { username, password, teamName } = req.body;
  
  const hash = bcrypt.hashSync(password, 10);
  const teamId = Date.now().toString();

  db.serialize(() => {
    db.run('INSERT INTO teams (id, name) VALUES (?, ?)', [teamId, teamName], function(err) {
      if (err) return res.status(400).json({ error: 'Team name error' });
      
      db.run('INSERT INTO users (username, password_hash, role, team_id) VALUES (?, ?, ?, ?)', 
        [username, hash, 'team_captain', teamId], function(err) {
          if (err) return res.status(400).json({ error: 'Username already exists' });
          res.json({ message: 'User registered successfully', teamId });
      });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });
    
    if (bcrypt.compareSync(password, user.password_hash)) {
      const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role, team_id: user.team_id }, JWT_SECRET);
      res.json({ accessToken, user: { username: user.username, role: user.role, team_id: user.team_id } });
    } else {
      res.status(401).json({ error: 'Incorrect password' });
    }
  });
});

app.get('/api/teams', (req, res) => {
  db.all('SELECT * FROM teams', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/teams', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });
  
  const { name } = req.body;
  const teamId = Date.now().toString();
  
  db.run('INSERT INTO teams (id, name) VALUES (?, ?)', [teamId, name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: teamId, name });
  });
});

app.get('/api/matches', (req, res) => {
  db.all('SELECT * FROM matches', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/matches', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });
  
  const { team1_id, team2_id, court, time } = req.body;
  const matchId = Date.now().toString();
  
  db.run('INSERT INTO matches (id, team1_id, team2_id, court, time) VALUES (?, ?, ?, ?, ?)', 
    [matchId, team1_id, team2_id, court, time], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: matchId, team1_id, team2_id, court, time, score1: null, score2: null });
  });
});

app.put('/api/matches/:id/score', authenticateToken, (req, res) => {
  const matchId = req.params.id;
  const { score1, score2 } = req.body;
  
  db.get('SELECT * FROM matches WHERE id = ?', [matchId], (err, match) => {
    if (err || !match) return res.status(404).json({ error: 'Match not found' });
    
    // Auth Check
    const isAuthorized = req.user.role === 'admin' || 
                         req.user.team_id === match.team1_id || 
                         req.user.team_id === match.team2_id;
                         
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to edit this match score' });
    }
    
    // Convert undefined to null for sqlite
    const s1 = score1 !== undefined ? score1 : match.score1;
    const s2 = score2 !== undefined ? score2 : match.score2;
    
    db.run('UPDATE matches SET score1 = ?, score2 = ? WHERE id = ?', [s1, s2, matchId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: matchId, score1: s1, score2: s2 });
    });
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
