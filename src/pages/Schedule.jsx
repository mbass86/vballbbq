import React, { useState } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Clock, MapPin, Lock } from 'lucide-react';
import './Pages.css';

export default function Schedule() {
  const { matches, teams, updateMatchScore, user } = useTournament();
  const [viewMode, setViewMode] = useState('all');

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const isAuthorized = (match) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.team_id === match.team1_id || user.team_id === match.team2_id;
  };

  const handleScoreChange = (matchId, teamNum, value) => {
    const numericValue = value === '' ? null : parseInt(value, 10);
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (teamNum === 1) {
      updateMatchScore(matchId, numericValue, match.score2);
    } else {
      updateMatchScore(matchId, match.score1, numericValue);
    }
  };

  const displayedMatches = (viewMode === 'my' && user && user.team_id)
    ? matches.filter(m => m.team1_id === user.team_id || m.team2_id === user.team_id)
    : matches;

  // Group matches by time
  const matchesByTime = displayedMatches.reduce((acc, match) => {
    if (!acc[match.time]) acc[match.time] = [];
    acc[match.time].push(match);
    return acc;
  }, {});

  return (
    <div className="page-container animate-fade-in stagger-1">
      <div className="page-header">
        <h1 className="title-gradient">Match Schedule & Scoring</h1>
        <p className="subtitle">Scores can only be updated by Team Captains involved in the match or Administrators.</p>
      </div>

      {user && user.team_id && user.role !== 'admin' && (
        <div className="flex gap-4" style={{ marginTop: '16px' }}>
          <button 
            className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('all')}
          >
            All Matches
          </button>
          <button 
            className={`btn ${viewMode === 'my' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('my')}
          >
            My Team's Matches
          </button>
        </div>
      )}

      {Object.keys(matchesByTime).length === 0 && (
        <div className="glass-panel text-center" style={{ padding: '40px', marginTop: '20px', color: 'var(--text-secondary)' }}>
          No matches found for your team.
        </div>
      )}

      {Object.entries(matchesByTime).map(([time, timeMatches], index) => (
        <div key={time} className={`mt-6 animate-fade-in stagger-${(index % 3) + 1}`}>
          <h2 className="flex items-center gap-2 mb-4" style={{ marginBottom: '16px' }}>
            <Clock size={20} className="accent-blue" />
            Time: {time}
          </h2>
          
          <div className="matches-grid">
            {timeMatches.map(match => {
              const auth = isAuthorized(match);
              return (
                <div key={match.id} className="glass-panel match-card" style={!auth ? { opacity: 0.9 } : {}}>
                  <div className="match-header">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {match.court}
                    </span>
                    {match.score1 !== null && match.score2 !== null ? (
                      <span className="accent-success font-bold text-xs" style={{ fontSize: '0.8rem' }}>COMPLETED</span>
                    ) : (
                      !auth && <span className="text-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12}/> Locked</span>
                    )}
                  </div>

                  <div className="team-row">
                    <span className="team-name">{getTeamName(match.team1_id)}</span>
                    {auth ? (
                      <input
                        type="number"
                        className="input score-input"
                        value={match.score1 === null ? '' : match.score1}
                        onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                        placeholder="-"
                        min="0"
                      />
                    ) : (
                      <span className="score-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                        {match.score1 === null ? '-' : match.score1}
                      </span>
                    )}
                  </div>

                  <div className="team-row">
                    <span className="team-name">{getTeamName(match.team2_id)}</span>
                    {auth ? (
                      <input
                        type="number"
                        className="input score-input"
                        value={match.score2 === null ? '' : match.score2}
                        onChange={(e) => handleScoreChange(match.id, 2, e.target.value)}
                        placeholder="-"
                        min="0"
                      />
                    ) : (
                      <span className="score-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                        {match.score2 === null ? '-' : match.score2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
