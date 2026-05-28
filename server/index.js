import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './database.js';
import nodemailer from 'nodemailer';
import cron from 'node-cron';

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
  const { username, password, teamName, email } = req.body;
  
  const hash = bcrypt.hashSync(password, 10);
  const teamId = Date.now().toString();

  db.serialize(() => {
    db.run('INSERT INTO teams (id, name) VALUES (?, ?)', [teamId, teamName], function(err) {
      if (err) return res.status(400).json({ error: 'Team name error' });
      
      db.run('INSERT INTO users (username, password_hash, role, team_id, email) VALUES (?, ?, ?, ?, ?)', 
        [username, hash, 'team_captain', teamId, email || null], function(err) {
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
  const query = `
    SELECT t.id, t.name, u.email AS captain_email, COUNT(r.id) AS player_count
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id AND u.role = 'team_captain'
    LEFT JOIN roster r ON r.team_id = t.id
    GROUP BY t.id, t.name, u.email
  `;
  db.all(query, [], (err, rows) => {
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
    const originalCount = shuffled.length;
    const isOdd = originalCount % 2 !== 0;

    // Pad to even number with null (bye) for the circle rotation
    if (isOdd) shuffled.push(null);
    const n = shuffled.length;

    // Build balanced time slots
    // If odd team count, rounds MUST be a multiple of originalCount to balance byes.
    // We default to a full round-robin (originalCount rounds).
    let numRounds = rounds || (n - 1);
    if (isOdd) {
      if (!rounds || rounds % originalCount !== 0) {
        // Enforce a multiple of originalCount (usually 1x originalCount, i.e., full round-robin)
        numRounds = originalCount;
      }
    }

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
          time: timeSlots[round],
          stage: 'pool'
        });
      });
      // Rotate: keep element 0 fixed, rotate the rest
      const last = list.pop();
      list.splice(1, 0, last);
    }

    // Clear existing matches then insert new ones
    db.run('DELETE FROM matches', [], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      const stmt = db.prepare('INSERT INTO matches (id, team1_id, team2_id, court, time, stage) VALUES (?, ?, ?, ?, ?, ?)');
      matches.forEach(m => stmt.run(m.id, m.team1_id, m.team2_id, m.court, m.time, 'pool'));
      stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(matches);
      });
    });
  });
});

// Generate top-8 single elimination playoffs bracket (admin)
app.post('/api/playoffs/generate', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });

  // 1. Calculate pool standings to get top 8 seeds
  const queryTeams = `
    SELECT t.id, t.name, COUNT(r.id) AS player_count
    FROM teams t
    LEFT JOIN roster r ON r.team_id = t.id
    GROUP BY t.id, t.name
  `;

  db.all(queryTeams, [], (err, teamsList) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all("SELECT * FROM matches WHERE stage = 'pool' OR stage IS NULL", [], (err, poolMatches) => {
      if (err) return res.status(500).json({ error: err.message });

      // Compute standings
      const stats = {};
      teamsList.forEach(t => {
        stats[t.id] = { id: t.id, name: t.name, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0, played: 0 };
      });

      poolMatches.forEach(m => {
        if (m.score1 !== null && m.score2 !== null) {
          const s1 = parseInt(m.score1, 10);
          const s2 = parseInt(m.score2, 10);
          if (!stats[m.team1_id] || !stats[m.team2_id]) return;

          stats[m.team1_id].played += 1;
          stats[m.team2_id].played += 1;
          stats[m.team1_id].pointsFor += s1;
          stats[m.team1_id].pointsAgainst += s2;
          stats[m.team1_id].pointDiff += (s1 - s2);
          
          stats[m.team2_id].pointsFor += s2;
          stats[m.team2_id].pointsAgainst += s1;
          stats[m.team2_id].pointDiff += (s2 - s1);

          if (s1 > s2) {
            stats[m.team1_id].wins += 1;
            stats[m.team2_id].losses += 1;
          } else if (s2 > s1) {
            stats[m.team2_id].wins += 1;
            stats[m.team1_id].losses += 1;
          } else {
            stats[m.team1_id].ties += 1;
            stats[m.team2_id].ties += 1;
          }
        }
      });

      const sortedStandings = Object.values(stats).sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.pointDiff - a.pointDiff;
      });

      if (sortedStandings.length < 8) {
        return res.status(400).json({ error: 'Need at least 8 teams to generate playoffs bracket' });
      }

      const top8 = sortedStandings.slice(0, 8);

      // Define standard bracket seedings: 1v8, 4v5, 2v7, 3v6
      const qfPairs = [
        { id: 'qf1', t1: top8[0], t2: top8[7], label: 'QF 1 (1 vs 8)' },
        { id: 'qf2', t1: top8[3], t2: top8[4], label: 'QF 2 (4 vs 5)' },
        { id: 'qf3', t1: top8[1], t2: top8[6], label: 'QF 3 (2 vs 7)' },
        { id: 'qf4', t1: top8[2], t2: top8[5], label: 'QF 4 (3 vs 6)' }
      ];

      db.serialize(() => {
        // Delete existing playoffs matches
        db.run("DELETE FROM matches WHERE stage IN ('quarterfinal', 'semifinal', 'final', 'bronze')", [], (err) => {
          if (err) return res.status(500).json({ error: err.message });

          const stmt = db.prepare('INSERT INTO matches (id, team1_id, team2_id, court, time, stage) VALUES (?, ?, ?, ?, ?, ?)');
          qfPairs.forEach((p, index) => {
            stmt.run(p.id, p.t1.id, p.t2.id, `Court ${index + 1}`, 'Playoffs Round 1', 'quarterfinal');
          });
          stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Playoffs quarterfinals successfully generated' });
          });
        });
      });
    });
  });
});

// Advance bracket stage automatically (admin)
app.post('/api/playoffs/advance', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });

  // Find all current playoff matches
  db.all("SELECT * FROM matches WHERE stage IN ('quarterfinal', 'semifinal', 'final', 'bronze')", [], (err, playoffMatches) => {
    if (err) return res.status(500).json({ error: err.message });

    const qf = playoffMatches.filter(m => m.stage === 'quarterfinal');
    const sf = playoffMatches.filter(m => m.stage === 'semifinal');

    const getWinner = (m) => {
      if (m.score1 === null || m.score2 === null) return null;
      return m.score1 > m.score2 ? m.team1_id : m.team2_id;
    };

    const getLoser = (m) => {
      if (m.score1 === null || m.score2 === null) return null;
      return m.score1 < m.score2 ? m.team1_id : m.team2_id;
    };

    // Case 1: Advancing from Quarterfinals to Semifinals
    if (qf.length === 4 && sf.length === 0) {
      const qfWinners = qf.map(getWinner);
      if (qfWinners.includes(null)) {
        return res.status(400).json({ error: 'All 4 Quarterfinals must have scores entered before advancing to Semifinals' });
      }

      db.serialize(() => {
        db.run("DELETE FROM matches WHERE stage IN ('semifinal', 'final', 'bronze')");
        const stmt = db.prepare('INSERT INTO matches (id, team1_id, team2_id, court, time, stage) VALUES (?, ?, ?, ?, ?, ?)');
        // S1: QF1 vs QF2
        stmt.run('sf1', qfWinners[0], qfWinners[1], 'Court 1', 'Semifinals', 'semifinal');
        // S2: QF3 vs QF4
        stmt.run('sf2', qfWinners[2], qfWinners[3], 'Court 2', 'Semifinals', 'semifinal');
        stmt.finalize((err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Semifinals bracket successfully populated' });
        });
      });
      return;
    }

    // Case 2: Advancing from Semifinals to Finals (Gold & Bronze Games)
    if (sf.length === 2) {
      const sfWinners = sf.map(getWinner);
      const sfLosers = sf.map(getLoser);

      if (sfWinners.includes(null)) {
        return res.status(400).json({ error: 'Both Semifinals must have scores entered before advancing to Finals' });
      }

      db.serialize(() => {
        db.run("DELETE FROM matches WHERE stage IN ('final', 'bronze')");
        const stmt = db.prepare('INSERT INTO matches (id, team1_id, team2_id, court, time, stage) VALUES (?, ?, ?, ?, ?, ?)');
        // Gold Medal Match
        stmt.run('final_gold', sfWinners[0], sfWinners[1], 'Court 1', 'Gold Match', 'final');
        // Bronze Medal Match
        stmt.run('final_bronze', sfLosers[0], sfLosers[1], 'Court 2', 'Bronze Match', 'bronze');
        stmt.finalize((err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Finals (Gold and Bronze games) successfully populated' });
        });
      });
      return;
    }

    res.status(400).json({ error: 'No matching playoff round to advance. Make sure all games in the current round are completed.' });
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

// Configure mail transporter dynamically
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('SMTP environment variables not fully configured. Email reminders will be dry-run (logged only).');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function sendWeeklyReminders(manualRecipient = null) {
  const query = `
    SELECT t.name as team_name, u.email as captain_email, COUNT(r.id) as player_count
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id AND u.role = 'team_captain'
    LEFT JOIN roster r ON r.team_id = t.id
    GROUP BY t.id, t.name, u.email
  `;

  db.all(query, [], async (err, rows) => {
    if (err) {
      console.error('Failed to query teams for reminders:', err);
      return;
    }

    const incompleteTeams = rows.filter(row => row.player_count < 4);

    if (incompleteTeams.length === 0) {
      console.log('No incomplete teams found to remind.');
      return;
    }

    const transporter = getMailTransporter();

    for (const team of incompleteTeams) {
      const recipient = manualRecipient || team.captain_email;
      if (!recipient) {
        console.log(`Skipping team ${team.team_name} because no captain email is configured.`);
        continue;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || '"VolleyFest" <no-reply@vballbbq.com>',
        to: recipient,
        subject: `⚠️ Action Required: Complete your roster for ${team.team_name}!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #e53e3e; margin-top: 0;">Your roster is incomplete!</h2>
            <p>Hello Captain,</p>
            <p>This is a reminder that your team <strong>${team.team_name}</strong> currently only has <strong>${team.player_count}</strong> players registered.</p>
            <p style="font-size: 16px; font-weight: bold; color: #2d3748; background-color: #fffaf0; padding: 10px; border-left: 4px solid #dd6b20; border-radius: 4px;">
              A complete team requires at least <strong>4 players</strong>.
            </p>
            <p>The VolleyFest tournament is scheduled for <strong>June 18th this year</strong>. Please log in and complete your team's roster before the tournament starts to secure your spot.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #718096; text-align: center;">If you have already completed your roster or received this in error, please disregard this email.</p>
          </div>
        `
      };

      try {
        if (transporter) {
          await transporter.sendMail(mailOptions);
          console.log(`[EMAIL] Sent reminder to ${recipient} for team ${team.team_name}`);
        } else {
          console.log(`[EMAIL DRY-RUN] Roster reminder for ${team.team_name} to ${recipient}: ${team.player_count}/4 players.`);
        }
      } catch (sendErr) {
        console.error(`Failed to send email to ${recipient}:`, sendErr);
      }
    }
  });
}

// Schedule weekly reminder (Every Sunday at 9:00 AM)
cron.schedule('0 9 * * 0', () => {
  const today = new Date();
  const tournamentDate = new Date('2026-06-18');
  if (today < tournamentDate) {
    console.log('Running scheduled weekly roster reminders...');
    sendWeeklyReminders();
  } else {
    console.log('Tournament date has passed, skipping weekly reminders.');
  }
});

// Admin endpoint to manually trigger reminders
app.post('/api/admin/send-reminders', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });
  const { testEmail } = req.body;
  sendWeeklyReminders(testEmail || null);
  res.json({ message: 'Reminder process triggered successfully' });
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
