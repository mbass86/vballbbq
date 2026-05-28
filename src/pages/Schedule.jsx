import React, { useState } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Clock, MapPin, Lock, Trash2, Pencil, Check, X, Shuffle, CalendarX, ChevronDown, ChevronUp, Trophy, ArrowRight } from 'lucide-react';
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
    const isOdd = teams.length % 2 !== 0;
    const roundedRounds = isOdd ? teams.length : rounds;
    let confirmMsg = `This will DELETE the current schedule and generate a new balanced schedule distributed across teams with ${courts} courts. Continue?`;
    if (isOdd) {
      confirmMsg = `You have 9 registered teams (odd count). To ensure a mathematically balanced pool play where every team plays exactly the same number of games (8 games, 1 bye round), this will generate a perfect ${teams.length}-round pool play. Continue?`;
    }

    if (!window.confirm(confirmMsg)) return;
    setLoading(true);
    try {
      await generateSchedule({ courts: parseInt(courts), rounds: parseInt(roundedRounds), startTime, intervalMinutes: parseInt(interval) });
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
          ⚙️ Admin Pool Play Tools
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '14px', marginBottom: '16px' }}>
            Generate a mathematically balanced pool play schedule. For odd team counts (e.g. 9), the system automatically schedules the optimal rounds so that every team has an identical number of games.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Courts</label>
              <input className="input" type="number" min="1" max="20" value={courts} onChange={e => setCourts(e.target.value)} style={{ padding: '6px 10px' }} />
            </div>
            {teams.length % 2 === 0 ? (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Rounds (time slots)</label>
                <input className="input" type="number" min="1" max="20" value={rounds} onChange={e => setRounds(e.target.value)} style={{ padding: '6px 10px' }} />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Rounds (Auto-set)</label>
                <input className="input" type="text" disabled value={`${teams.length} (Balanced Pool)`} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }} />
              </div>
            )}
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
              <Shuffle size={15} /> {loading ? 'Generating...' : 'Generate Pool Play'}
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

// Single bracket node card component
function BracketCard({ match, title, teams, auth, onScoreChange, isAdmin, onEditClick, onDeleteClick }) {
  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name ?? 'TBD';
  const completed = match?.score1 !== null && match?.score2 !== null;

  return (
    <div className="glass-panel match-card" style={{ padding: '16px', border: completed ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.1)', width: '280px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent-magenta)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{match?.court || 'TBD'}</span>
          {isAdmin && match && (
            <div style={{ display: 'flex', gap: '2px' }}>
              <button onClick={() => onEditClick(match.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}><Pencil size={11} /></button>
              <button onClick={() => onDeleteClick(match.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d6d', padding: '2px' }}><Trash2 size={11} /></button>
            </div>
          )}
        </div>
      </div>

      <div className="team-row" style={{ marginBottom: '8px' }}>
        <span className="team-name" style={completed && match.score1 > match.score2 ? { color: 'var(--accent-blue)', fontWeight: 700 } : {}}>
          {getTeamName(match?.team1_id)}
        </span>
        {auth && match ? (
          <input type="number" className="input score-input" value={match.score1 === null ? '' : match.score1} onChange={(e) => onScoreChange(match.id, 1, e.target.value)} placeholder="-" min="0" style={{ width: '48px', padding: '3px 6px' }} />
        ) : (
          <span className="score-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '3px 8px', minWidth: '32px', textAlign: 'center', fontWeight: completed ? 700 : 400 }}>
            {match?.score1 === null || !match ? '-' : match.score1}
          </span>
        )}
      </div>

      <div className="team-row">
        <span className="team-name" style={completed && match.score2 > match.score1 ? { color: 'var(--accent-blue)', fontWeight: 700 } : {}}>
          {getTeamName(match?.team2_id)}
        </span>
        {auth && match ? (
          <input type="number" className="input score-input" value={match.score2 === null ? '' : match.score2} onChange={(e) => onScoreChange(match.id, 2, e.target.value)} placeholder="-" min="0" style={{ width: '48px', padding: '3px 6px' }} />
        ) : (
          <span className="score-input" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '3px 8px', minWidth: '32px', textAlign: 'center', fontWeight: completed ? 700 : 400 }}>
            {match?.score2 === null || !match ? '-' : match.score2}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Schedule() {
  const { matches, teams, updateMatchScore, updateMatch, deleteMatch, clearSchedule, generateSchedule, addMatch, generatePlayoffs, advancePlayoffs, user } = useTournament();
  
  const [view, setView] = useState('pool'); // 'pool' | 'playoffs'
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'results' | 'all'
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [playoffLoading, setPlayoffLoading] = useState(false);

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

  // Playoff specific logic
  const playoffMatches = matches.filter(m => ['quarterfinal', 'semifinal', 'final', 'bronze'].includes(m.stage));
  const hasPlayoffs = playoffMatches.length > 0;

  const qf1 = playoffMatches.find(m => m.id === 'qf1');
  const qf2 = playoffMatches.find(m => m.id === 'qf2');
  const qf3 = playoffMatches.find(m => m.id === 'qf3');
  const qf4 = playoffMatches.find(m => m.id === 'qf4');
  const sf1 = playoffMatches.find(m => m.id === 'sf1');
  const sf2 = playoffMatches.find(m => m.id === 'sf2');
  const gold = playoffMatches.find(m => m.id === 'final_gold');
  const bronze = playoffMatches.find(m => m.id === 'final_bronze');

  const handleGeneratePlayoffs = async () => {
    const poolCompleted = matches.filter(m => (!m.stage || m.stage === 'pool') && !isCompleted(m)).length === 0;
    if (!poolCompleted) {
      if (!window.confirm('⚠ Warning: Not all Pool Play matches are completed yet. Generating playoffs now will use current partial standings. Proceed?')) return;
    }
    setPlayoffLoading(true);
    try {
      await generatePlayoffs();
      alert('Playoffs Quarterfinals generated successfully!');
    } catch (err) {
      alert(err.error || err.message);
    }
    setPlayoffLoading(false);
  };

  const handleAdvancePlayoffs = async () => {
    setPlayoffLoading(true);
    try {
      const res = await advancePlayoffs();
      alert(res.message);
    } catch (err) {
      alert(err.error || err.message);
    }
    setPlayoffLoading(false);
  };

  // Pool matches filtering
  let poolFiltered = matches.filter(m => !m.stage || m.stage === 'pool');
  let filtered = poolFiltered.filter(m => {
    if (tab === 'upcoming') return !isCompleted(m);
    if (tab === 'results') return isCompleted(m);
    return true;
  });
  if (myTeamOnly && user?.team_id) {
    filtered = filtered.filter(m => m.team1_id === user.team_id || m.team2_id === user.team_id);
  }

  // Group pool matches by time
  const poolMatchesByTime = filtered.reduce((acc, match) => {
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
      {/* View Switcher: Pool vs Playoffs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="title-gradient">{view === 'pool' ? 'Pool Play Matches' : 'Playoffs Bracket'}</h1>
          <p className="subtitle">
            {view === 'pool' ? 'View schedules and score pool play matches.' : 'Single-elimination playoffs for top 8 seeds.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
          <button className={`btn ${view === 'pool' ? 'btn-primary' : ''}`} style={{ padding: '6px 16px', fontSize: '0.85rem', border: 'none' }} onClick={() => setView('pool')}>
            📅 Pool Play
          </button>
          <button className={`btn ${view === 'playoffs' ? 'btn-primary' : ''}`} style={{ padding: '6px 16px', fontSize: '0.85rem', border: 'none' }} onClick={() => setView('playoffs')}>
            🏆 Playoffs
          </button>
        </div>
      </div>

      {view === 'pool' ? (
        <>
          {isAdmin && (
            <AdminSchedulePanel teams={teams} clearSchedule={clearSchedule} generateSchedule={generateSchedule} addMatch={addMatch} />
          )}

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
            {tabBtn('upcoming', '📅 Upcoming')}
            {tabBtn('results', '🏆 Results')}
            {tabBtn('all', 'All Matches')}

            {isCaptain && user?.team_id && (
              <button
                className={`btn ${myTeamOnly ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMyTeamOnly(v => !v)}
                style={{ fontSize: '0.85rem', marginLeft: '12px' }}
              >
                {myTeamOnly ? '✓ My Team Only' : 'My Team Only'}
              </button>
            )}
          </div>

          {Object.keys(poolMatchesByTime).length === 0 && (
            <div className="glass-panel text-center" style={{ padding: '40px', color: 'var(--text-secondary)', marginTop: '24px' }}>
              {tab === 'upcoming' && 'No upcoming pool play matches. All pool games are completed!'}
              {tab === 'results' && 'No completed pool play matches yet.'}
              {tab === 'all' && (isAdmin ? 'No pool play matches scheduled. Use the Admin tools above to generate pool play.' : 'No pool play matches scheduled.')}
            </div>
          )}

          {Object.entries(poolMatchesByTime).map(([time, timeMatches], index) => (
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
        </>
      ) : (
        <div style={{ marginTop: '24px' }}>
          {isAdmin && (
            <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', border: '1px solid rgba(0,210,255,0.2)' }}>
              <div>
                <span className="font-bold text-gradient" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⚙️ Playoffs Controller
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Generate brackets, advance winners, and manage playoff stages directly.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleGeneratePlayoffs} disabled={playoffLoading} style={{ fontSize: '0.85rem' }}>
                  🏆 Generate Playoffs
                </button>
                {hasPlayoffs && (
                  <button className="btn btn-primary" onClick={handleAdvancePlayoffs} disabled={playoffLoading} style={{ fontSize: '0.85rem', background: '#dd6b20', borderColor: '#dd6b20' }}>
                    <ArrowRight size={15} /> Advance Bracket
                  </button>
                )}
              </div>
            </div>
          )}

          {!hasPlayoffs ? (
            <div className="glass-panel text-center animate-fade-in stagger-2" style={{ padding: '60px 40px', color: 'var(--text-secondary)' }}>
              <Trophy size={48} className="accent-magenta" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Bracket Not Generated Yet</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.88rem' }}>
                Once Pool Play matches are completed, the top 8 teams qualify for single elimination playoffs.
              </p>
              {isAdmin && (
                <button className="btn btn-primary" onClick={handleGeneratePlayoffs} disabled={playoffLoading} style={{ marginTop: '24px' }}>
                  Generate Playoff Bracket
                </button>
              )}
            </div>
          ) : (
            <div className="playoff-bracket-wrapper animate-fade-in stagger-2" style={{ overflowX: 'auto', padding: '20px 0' }}>
              <div style={{ display: 'flex', gap: '48px', minWidth: '960px', padding: '10px' }}>
                {/* Column 1: Quarterfinals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center' }}>
                  <h4 style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Quarterfinals</h4>
                  <BracketCard match={qf1} title="QF 1 (1 vs 8)" teams={teams} auth={qf1 && isAuthorized(qf1)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                  <BracketCard match={qf2} title="QF 2 (4 vs 5)" teams={teams} auth={qf2 && isAuthorized(qf2)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                  <BracketCard match={qf3} title="QF 3 (2 vs 7)" teams={teams} auth={qf3 && isAuthorized(qf3)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                  <BracketCard match={qf4} title="QF 4 (3 vs 6)" teams={teams} auth={qf4 && isAuthorized(qf4)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                </div>

                {/* Column 2: Semifinals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '120px', justifyContent: 'center' }}>
                  <h4 style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Semifinals</h4>
                  <BracketCard match={sf1} title="Semifinal 1" teams={teams} auth={sf1 && isAuthorized(sf1)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                  <BracketCard match={sf2} title="Semifinal 2" teams={teams} auth={sf2 && isAuthorized(sf2)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                </div>

                {/* Column 3: Finals (Gold & Bronze) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', justifyContent: 'center' }}>
                  <h4 style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Championship</h4>
                  <BracketCard match={gold} title="🥇 Gold Game (1st Place)" teams={teams} auth={gold && isAuthorized(gold)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                  <BracketCard match={bronze} title="🥉 Bronze Game (3rd Place)" teams={teams} auth={bronze && isAuthorized(bronze)} onScoreChange={handleScoreChange} isAdmin={isAdmin} onEditClick={setEditingMatchId} onDeleteClick={handleDeleteMatch} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render overlay form if editing pool match */}
      {editingMatchId && !playoffMatches.find(m => m.id === editingMatchId) && (
        <div style={{ display: 'none' /* Handled inline for pool matches card */ }} />
      )}
    </div>
  );
}
