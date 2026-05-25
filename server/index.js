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

// Update match details (admin: teams, court, time)
app.put('/api/matches/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });
  const { id } = req.params;
  const { team1_id, team2_id, court, time } = req.body;

  db.get('SELECT * FROM matches WHERE id = ?', [id], (err, match) => {
    if (err || !match) return res.status(404).json({ error: 'Match not found' });
    db.run(
      'UPDATE matches SET team1_id = ?, team2_id = ?, court = ?, time = ? WHERE id = ?',
      [team1_id ?? match.team1_id, team2_id ?? match.team2_id, court ?? match.court, time ?? match.time, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, team1_id: team1_id ?? match.team1_id, team2_id: team2_id ?? match.team2_id, court: court ?? match.court, time: time ?? match.time, score1: match.score1, score2: match.score2 });
      }
    );
  });
});

// Delete a single match (admin)
app.delete('/api/matches/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });
  db.run('DELETE FROM matches WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Match deleted' });
  });
});

// Delete all matches (admin)
app.delete('/api/matches', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });
  db.run('DELETE FROM matches', [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All matches deleted' });
  });
});

// Generate schedule (admin)
app.post('/api/schedule/generate', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });

  const { courts, startTime, intervalMinutes, rounds } = req.body;
  if (!courts || courts < 1) return res.status(400).json({ error: 'courts must be >= 1' });

  db.all('SELECT * FROM teams', [], (err, teams) => {
    if (err) return res.status(500).json({ error: err.message });
    if (teams.length < 2) return res.status(400).json({ error: 'Need at least 2 teams' });

    // Shuffle teams randomly
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    // Pad to even number with null (bye)
    if (shuffled.length % 2 !== 0) shuffled.push(null);
    const n = shuffled.length;

    // Build time slots
    const numRounds = rounds || (n - 1);
    const interval = intervalMinutes || 60;
    const [startH, startM] = (startTime || '10:00').split(':').map(Number);

    const timeSlots = Array.from({ length: numRounds }, (_, i) => {
      const totalMin = startH * 60 + startM + i * interval;
      const h = Math.floor(totalMin / 60) % 24;
      const m = totalMin % 60;
      const suffix = h < 12 ? 'AM' : 'PM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
    });

    // Generate round-robin using rotation algorithm
    const list = [...shuffled];
    const matches = [];

    for (let round = 0; round < numRounds; round++) {
      const roundPairs = [];
      for (let i = 0; i < n / 2; i++) {
        const t1 = list[i];
        const t2 = list[n - 1 - i];
        if (t1 && t2) roundPairs.push({ t1, t2 });
      }
      // Limit to available courts
      roundPairs.slice(0, courts).forEach((pair, idx) => {
        matches.push({
          id: `g-${Date.now()}-${round}-${idx}`,
          team1_id: pair.t1.id,
          team2_id: pair.t2.id,
          court: `Court ${idx + 1}`,
          time: timeSlots[round]
        });
      });
      // Rotate: keep element 0 fixed, rotate the rest
      const last = list.pop();
      list.splice(1, 0, last);
    }

    // Clear existing matches then insert new ones
    db.run('DELETE FROM matches', [], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      const stmt = db.prepare('INSERT INTO matches (id, team1_id, team2_id, court, time) VALUES (?, ?, ?, ?, ?)');
      matches.forEach(m => stmt.run(m.id, m.team1_id, m.team2_id, m.court, m.time));
      stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(matches);
      });
    });
  });
});

// Delete a team (admin only, or captain of that team)
app.delete('/api/teams/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';
  const isOwnCaptain = req.user.role === 'team_captain' && req.user.team_id === id;
  if (!isAdmin && !isOwnCaptain) return res.status(403).json({ error: 'Not authorized to delete this team' });
  // Also delete associated users, roster rows, and matches
  db.serialize(() => {
    db.run('DELETE FROM roster WHERE team_id = ?', [id]);
    db.run('DELETE FROM users WHERE team_id = ?', [id]);
    db.run('DELETE FROM matches WHERE team1_id = ? OR team2_id = ?', [id, id]);
    db.run('DELETE FROM teams WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Team deleted' });
    });
  });
});

// Get roster for a team (public)
app.get('/api/teams/:id/roster', (req, res) => {
  db.all('SELECT * FROM roster WHERE team_id = ? ORDER BY name', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a player to roster (captain of that team, or admin)
app.post('/api/teams/:id/roster', authenticateToken, (req, res) => {
  const teamId = req.params.id;
  const isAdmin = req.user.role === 'admin';
  const isOwnCaptain = req.user.role === 'team_captain' && req.user.team_id === teamId;
  if (!isAdmin && !isOwnCaptain) return res.status(403).json({ error: 'Not authorized' });

  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  db.run('INSERT INTO roster (team_id, name, email) VALUES (?, ?, ?)', [teamId, name, email || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, team_id: teamId, name, email: email || null });
  });
});

// Update a roster player (captain of that team, or admin)
app.put('/api/roster/:playerId', authenticateToken, (req, res) => {
  const { playerId } = req.params;
  const { name, email } = req.body;

  db.get('SELECT * FROM roster WHERE id = ?', [playerId], (err, player) => {
    if (err || !player) return res.status(404).json({ error: 'Player not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwnCaptain = req.user.role === 'team_captain' && req.user.team_id === player.team_id;
    if (!isAdmin && !isOwnCaptain) return res.status(403).json({ error: 'Not authorized' });

    db.run('UPDATE roster SET name = ?, email = ? WHERE id = ?', 
      [name || player.name, email !== undefined ? email : player.email, playerId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: parseInt(playerId), team_id: player.team_id, name: name || player.name, email: email !== undefined ? email : player.email });
    });
  });
});

// Delete a roster player (captain of that team, or admin)
app.delete('/api/roster/:playerId', authenticateToken, (req, res) => {
  const { playerId } = req.params;

  db.get('SELECT * FROM roster WHERE id = ?', [playerId], (err, player) => {
    if (err || !player) return res.status(404).json({ error: 'Player not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwnCaptain = req.user.role === 'team_captain' && req.user.team_id === player.team_id;
    if (!isAdmin && !isOwnCaptain) return res.status(403).json({ error: 'Not authorized' });

    db.run('DELETE FROM roster WHERE id = ?', [playerId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Player removed' });
    });
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on port ${PORT}`);
});
