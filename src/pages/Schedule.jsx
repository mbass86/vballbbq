import React, { useState } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Clock, MapPin, Lock, Trash2, Pencil, Check, X, Shuffle, CalendarX, ChevronDown, ChevronUp } from 'lucide-react';
import './Pages.css';

// Inline match editor for admin
function MatchEditForm({ match, teams, onSave, onCancel }) {
  const [t1, setT1] = useState(match.team1_id);
  const [t2, setT2] = useState(match.team2_id);
  const [court, setCourt] = useState(match.court);
  const [time, setTime] = useState(match.time);

  const handleSave = () => {
    if (t1 === t2) { alert("Teams must be different"); return; }
    onSave({ team1_id: t1, team2_id: t2, court, time });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Team 1</label>
        <select className="input" style={{ padding: '4px 6px', fontSize: '0.82rem', width: '100%' }} value={t1} onChange={e => setT1(e.target.value)}>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Team 2</label>
        <select className="input" style={{ padding: '4px 6px', fontSize: '0.82rem', width: '100%' }} value={t2} onChange={e => setT2(e.target.value)}>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Court</label>
          <input className="input" style={{ padding: '4px 8px', fontSize: '0.82rem' }} value={court} onChange={e => setCourt(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Time</label>
          <input className="input" style={{ padding: '4px 8px', fontSize: '0.82rem' }} value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.82rem' }} onClick={handleSave}>
          <Check size={13} /> Save
        </button>
        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.82rem' }} onClick={onCancel}>
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// Admin schedule tools panel
function AdminSchedulePanel({ teams, clearSchedule, generateSchedule, addMatch }) {
  const [open, setOpen] = useState(false);
  const [courts, setCourts] = useState(8);
  const [rounds, setRounds] = useState(4);
  const [startTime, setStartTime] = useState('10:00');
  const [interval, setIntervalMin] = useState(60);
  const [loading, setLoading] = useState(false);

  // Add single match state
  const [addOpen, setAddOpen] = useState(false);
  const [newT1, setNewT1] = useState('');
  const [newT2, setNewT2] = useState('');
  const [newCourt, setNewCourt] = useState('Court 1');
  const [newTime, setNewTime] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Pre-select first two teams when panel opens
  const openAdd = () => {
    if (teams.length >= 1) setNewT1(teams[0].id);
    if (teams.length >= 2) setNewT2(teams[1].id);
    setAddOpen(true);
  };

  const handleAddMatch = async (e) => {
    e.preventDefault();
    if (!newT1 || !newT2) { alert('Select both teams'); return; }
    if (newT1 === newT2) { alert('Teams must be different'); return; }
    if (!newTime.trim()) { alert('Enter a time'); return; }
    setAddLoading(true);
    try {
      await addMatch({ team1_id: newT1, team2_id: newT2, court: newCourt, time: newTime });
      setAddOpen(false);
      setNewCourt('Court 1');
      setNewTime('');
    } catch (err) {
      alert(err.message);
    }
    setAddLoading(false);
  };

  const handleGenerate = async () => {
    if (!window.confirm(`This will DELETE the current schedule and generate a new random one with ${courts} courts, ${rounds} rounds. Continue?`)) return;
    setLoading(true);
    try {
      await generateSchedule({ courts: parseInt(courts), rounds: parseInt(rounds), startTime, intervalMinutes: parseInt(interval) });
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const handleClear = async () => {
    if (!window.confirm('Delete ALL matches from the schedule? This cannot be undone.')) return;
    try {
      await clearSchedule();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ marginTop: '16px', padding: 0, overflow: 'hidden', border: '1px solid rgba(255, 77, 109, 0.3)' }}>
      <div
        style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-magenta)' }}>
          ⚙️ Admin Schedule Tools
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '14px', marginBottom: '16px' }}>
            Generate a round-robin schedule randomly distributed across teams. Each round fills all available courts simultaneously.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Courts</label>
              <input className="input" type="number" min="1" max="20" value={courts} onChange={e => setCourts(e.target.value)} style={{ padding: '6px 10px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Rounds (time slots)</label>
              <input className="input" type="number" min="1" max="20" value={rounds} onChange={e => setRounds(e.target.value)} style={{ padding: '6px 10px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Start Time (24h)</label>
              <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ padding: '6px 10px' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Interval (min)</label>
              <input className="input" type="number" min="15" max="240" step="15" value={interval} onChange={e => setIntervalMin(e.target.value)} style={{ padding: '6px 10px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || teams.length < 2} style={{ fontSize: '0.85rem' }}>
              <Shuffle size={15} /> {loading ? 'Generating...' : 'Generate Schedule'}
            </button>
            <button className="btn" onClick={handleClear} style={{ fontSize: '0.85rem', background: 'rgba(255,77,109,0.1)', color: '#ff4d6d', border: '1px solid #ff4d6d' }}>
              <CalendarX size={15} /> Clear All Matches
            </button>
          </div>
          {teams.length < 2 && (
            <p style={{ color: '#ff4d6d', fontSize: '0.82rem', marginTop: '10px' }}>⚠ Need at least 2 registered teams to generate a schedule.</p>
          )}

          {/* Add single match */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
            {!addOpen ? (
              <button
                className="btn"
                onClick={openAdd}
                disabled={teams.length < 2}
                style={{ fontSize: '0.85rem', background: 'rgba(0,210,255,0.08)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}
              >
                + Add Single Match
              </button>
            ) : (
              <form onSubmit={handleAddMatch}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '12px', color: 'var(--accent-blue)' }}>Add Single Match</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Team 1</label>
                    <select className="input" style={{ padding: '6px 8px', fontSize: '0.85rem', width: '100%' }} value={newT1} onChange={e => setNewT1(e.target.value)}>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Team 2</label>
                    <select className="input" style={{ padding: '6px 8px', fontSize: '0.85rem', width: '100%' }} value={newT2} onChange={e => setNewT2(e.target.value)}>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Court</label>
                    <input className="input" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={newCourt} onChange={e => setNewCourt(e.target.value)} placeholder="Court 1" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Time</label>
                    <input className="input" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 11:00 AM" required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }} disabled={addLoading}>
                    <Check size={14} /> {addLoading ? 'Adding...' : 'Add Match'}
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setAddOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const { matches, teams, updateMatchScore, updateMatch, deleteMatch, clearSchedule, generateSchedule, addMatch, user } = useTournament();
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'results' | 'all'
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isCaptain = user?.role === 'team_captain';

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name ?? 'Unknown';

  const isAuthorized = (match) => {
    if (!user) return false;
    if (isAdmin) return true;
    return user.team_id === match.team1_id || user.team_id === match.team2_id;
  };

  const isCompleted = (m) => m.score1 !== null && m.score2 !== null;

  const handleScoreChange = (matchId, teamNum, value) => {
    const numericValue = value === '' ? null : parseInt(value, 10);
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    if (teamNum === 1) updateMatchScore(matchId, numericValue, match.score2);
    else updateMatchScore(matchId, match.score1, numericValue);
  };

  const handleSaveMatchEdit = async (matchId, fields) => {
    try {
      await updateMatch(matchId, fields);
      setEditingMatchId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Remove this match from the schedule?')) return;
    try { await deleteMatch(matchId); } catch (err) { alert(err.message); }
  };

  // Filter by tab first, then optionally by my team
  let filtered = matches.filter(m => {
    if (tab === 'upcoming') return !isCompleted(m);
    if (tab === 'results') return isCompleted(m);
    return true;
  });
  if (myTeamOnly && user?.team_id) {
    filtered = filtered.filter(m => m.team1_id === user.team_id || m.team2_id === user.team_id);
  }

  // Group by time
  const matchesByTime = filtered.reduce((acc, match) => {
    if (!acc[match.time]) acc[match.time] = [];
    acc[match.time].push(match);
    return acc;
  }, {});

  const tabBtn = (value, label) => (
    <button
      className={`btn ${tab === value ? 'btn-primary' : 'btn-secondary'}`}
      onClick={() => setTab(value)}
      style={{ fontSize: '0.85rem' }}
    >
      {label}
    </button>
  );

  return (
    <div className="page-container animate-fade-in stagger-1">
      <div className="page-header">
        <h1 className="title-gradient">Match Schedule & Scoring</h1>
        <p className="subtitle">Scores can be updated by Team Captains involved in the match or Administrators.</p>
      </div>

      {isAdmin && (
        <AdminSchedulePanel teams={teams} clearSchedule={clearSchedule} generateSchedule={generateSchedule} addMatch={addMatch} />
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
        {tabBtn('upcoming', '📅 Upcoming')}
        {tabBtn('results', '🏆 Results')}
        {tabBtn('all', 'All Matches')}

        {/* My team toggle for captains */}
        {(isCaptain) && user?.team_id && (
          <button
            className={`btn ${myTeamOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMyTeamOnly(v => !v)}
            style={{ fontSize: '0.85rem', marginLeft: '12px' }}
          >
            {myTeamOnly ? '✓ My Team Only' : 'My Team Only'}
          </button>
        )}
      </div>

      {Object.keys(matchesByTime).length === 0 && (
        <div className="glass-panel text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
          {tab === 'upcoming' && 'No upcoming matches. All games may have been completed!'}
          {tab === 'results' && 'No completed matches yet.'}
          {tab === 'all' && (isAdmin ? 'No matches. Use the Admin tools above to generate a schedule.' : 'No matches found.')}
        </div>
      )}

      {Object.entries(matchesByTime).map(([time, timeMatches], index) => (
        <div key={time} className={`mt-6 animate-fade-in stagger-${(index % 3) + 1}`}>
          <h2 className="flex items-center gap-2 mb-4" style={{ marginBottom: '16px' }}>
            <Clock size={20} className="accent-blue" />
            {time}
          </h2>

          <div className="matches-grid">
            {timeMatches.map(match => {
              const auth = isAuthorized(match);
              const completed = isCompleted(match);
              const isEditing = editingMatchId === match.id;

              return (
                <div key={match.id} className="glass-panel match-card" style={!auth ? { opacity: 0.9 } : {}}>
                  {isEditing ? (
                    <MatchEditForm
                      match={match}
                      teams={teams}
                      onSave={(fields) => handleSaveMatchEdit(match.id, fields)}
                      onCancel={() => setEditingMatchId(null)}
                    />
                  ) : (
                    <>
                      <div className="match-header">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {match.court}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {completed ? (
                            <span className="accent-success font-bold" style={{ fontSize: '0.8rem' }}>COMPLETED</span>
                          ) : (
                            !auth && <span className="text-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Locked</span>
                          )}
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => setEditingMatchId(match.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }} title="Edit match">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleDeleteMatch(match.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d6d', padding: '2px' }} title="Delete match">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="team-row">
                        <span className="team-name" style={completed && match.score1 > match.score2 ? { color: 'var(--accent-blue)' } : {}}>
                          {getTeamName(match.team1_id)}
                        </span>
                        {auth ? (
                          <input type="number" className="input score-input" value={match.score1 === null ? '' : match.score1} onChange={(e) => handleScoreChange(match.id, 1, e.target.value)} placeholder="-" min="0" />
                        ) : (
                          <span className="score-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', fontWeight: completed ? 700 : 400 }}>
                            {match.score1 === null ? '-' : match.score1}
                          </span>
                        )}
                      </div>

                      <div className="team-row">
                        <span className="team-name" style={completed && match.score2 > match.score1 ? { color: 'var(--accent-blue)' } : {}}>
                          {getTeamName(match.team2_id)}
                        </span>
                        {auth ? (
                          <input type="number" className="input score-input" value={match.score2 === null ? '' : match.score2} onChange={(e) => handleScoreChange(match.id, 2, e.target.value)} placeholder="-" min="0" />
                        ) : (
                          <span className="score-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', fontWeight: completed ? 700 : 400 }}>
                            {match.score2 === null ? '-' : match.score2}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
