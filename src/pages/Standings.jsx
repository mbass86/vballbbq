import React, { useState } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Trophy, Pencil, Check, X } from 'lucide-react';
import './Pages.css';

// Inline score editor for a single result row
function ScoreEditor({ match, teams, onSave, onCancel }) {
  const getTeamName = (id) => teams.find(t => t.id === id)?.name ?? 'Unknown';
  const [s1, setS1] = useState(match.score1 ?? '');
  const [s2, setS2] = useState(match.score2 ?? '');

  return (
    <tr style={{ background: 'rgba(0,210,255,0.05)' }}>
      <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 600 }}>
        {getTeamName(match.team1_id)} vs {getTeamName(match.team2_id)}
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '8px' }}>{match.time} · {match.court}</span>
      </td>
      <td style={{ padding: '8px' }}>
        <input className="input score-input" type="number" min="0" value={s1} onChange={e => setS1(e.target.value)} style={{ width: '54px', padding: '4px 6px', fontSize: '0.9rem' }} />
      </td>
      <td style={{ padding: '8px' }}>
        <input className="input score-input" type="number" min="0" value={s2} onChange={e => setS2(e.target.value)} style={{ width: '54px', padding: '4px 6px', fontSize: '0.9rem' }} />
      </td>
      <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
        <button onClick={() => onSave(s1 === '' ? null : parseInt(s1), s2 === '' ? null : parseInt(s2))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', padding: '2px 6px' }}><Check size={14} /></button>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px 4px' }}><X size={14} /></button>
      </td>
    </tr>
  );
}

export default function Standings() {
  const { getStandings, matches, teams, updateMatchScore, user } = useTournament();
  const standings = getStandings();
  const isAdmin = user?.role === 'admin';

  const [editingMatchId, setEditingMatchId] = useState(null);

  const completedMatches = matches.filter(m => m.score1 !== null && m.score2 !== null);
  const getTeamName = (id) => teams.find(t => t.id === id)?.name ?? 'Unknown';

  const handleSaveScore = async (matchId, score1, score2) => {
    await updateMatchScore(matchId, score1, score2);
    setEditingMatchId(null);
  };

  const winner = (m) => {
    if (m.score1 > m.score2) return m.team1_id;
    if (m.score2 > m.score1) return m.team2_id;
    return null; // tie
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="title-gradient">Tournament Standings</h1>
          <p className="subtitle">Top 8 teams advance to playoffs · Standings update automatically from match results</p>
        </div>
      </div>

      {/* Standings table */}
      <div className="glass-panel mt-6 overflow-x-auto">
        <table className="tournament-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Played</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>Pts For</th>
              <th>Pts Agnst</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => {
              const isTop8 = index < 8;
              return (
                <tr key={team.id} className={isTop8 ? "highlight-row" : ""}>
                  <td className="font-bold">
                    {index + 1}
                    {isTop8 && <Trophy size={14} className="ml-2 inline-block accent-gold" />}
                  </td>
                  <td className="font-bold">{team.name}</td>
                  <td>{team.played}</td>
                  <td className="accent-success font-bold">{team.wins}</td>
                  <td>{team.losses}</td>
                  <td>{team.ties}</td>
                  <td>{team.pointsFor}</td>
                  <td>{team.pointsAgainst}</td>
                  <td className={team.pointDiff > 0 ? 'accent-success font-bold' : team.pointDiff < 0 ? 'accent-magenta' : ''}>
                    {team.pointDiff > 0 ? '+' : ''}{team.pointDiff}
                  </td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>No results yet. Scores will appear here once matches are completed.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Match Results section — visible to everyone, editable by admins */}
      {completedMatches.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
            🏆 Match Results
            {isAdmin && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '8px' }}>Click ✏ to correct a score</span>}
          </h2>
          <div className="glass-panel overflow-x-auto">
            <table className="tournament-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Court</th>
                  <th>Team 1</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  <th>Team 2</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {completedMatches.map(m => {
                  const w = winner(m);
                  if (editingMatchId === m.id) {
                    return (
                      <ScoreEditor
                        key={m.id}
                        match={m}
                        teams={teams}
                        onSave={(s1, s2) => handleSaveScore(m.id, s1, s2)}
                        onCancel={() => setEditingMatchId(null)}
                      />
                    );
                  }
                  return (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.time}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.court}</td>
                      <td className="font-bold" style={w === m.team1_id ? { color: 'var(--accent-blue)' } : {}}>
                        {w === m.team1_id && '🏆 '}{getTeamName(m.team1_id)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{m.score1}</td>
                      <td className="font-bold" style={w === m.team2_id ? { color: 'var(--accent-blue)' } : {}}>
                        {w === m.team2_id && '🏆 '}{getTeamName(m.team2_id)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{m.score2}</td>
                      {isAdmin && (
                        <td>
                          <button
                            onClick={() => setEditingMatchId(m.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
                            title="Edit score"
                          >
                            <Pencil size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
