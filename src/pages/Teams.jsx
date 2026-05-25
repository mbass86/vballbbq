import React, { useState, useEffect } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Users, Plus, Trash2, ChevronDown, ChevronUp, UserPlus, Mail, Pencil, Check, X, ShieldAlert } from 'lucide-react';
import './Pages.css';

function RosterPanel({ team, user, getRoster, addPlayer, updatePlayer, deletePlayer }) {
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const isAdmin = user?.role === 'admin';
  const isOwnCaptain = user?.role === 'team_captain' && user?.team_id === team.id;
  const canEdit = isAdmin || isOwnCaptain;

  useEffect(() => {
    getRoster(team.id).then(data => {
      setRoster(data);
      setLoading(false);
    });
  }, [team.id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const player = await addPlayer(team.id, newName.trim(), newEmail.trim());
      setRoster(prev => [...prev, player]);
      setNewName('');
      setNewEmail('');
      setAdding(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditEmail(player.email || '');
  };

  const handleUpdate = async (playerId) => {
    try {
      const updated = await updatePlayer(playerId, editName.trim(), editEmail.trim());
      setRoster(prev => prev.map(p => p.id === playerId ? updated : p));
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (playerId) => {
    if (!window.confirm('Remove this player from the roster?')) return;
    try {
      await deletePlayer(playerId);
      setRoster(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading roster...</div>;

  return (
    <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '0', padding: '16px 20px', background: 'rgba(0,0,0,0.2)' }}>
      {roster.length === 0 && !adding && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: canEdit ? '12px' : '0' }}>
          No players added yet.
        </p>
      )}

      {roster.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: canEdit ? '12px' : '0' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px 8px 0' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '4px 8px 8px 0' }}>Email</th>
              {canEdit && <th style={{ width: '70px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {roster.map(player => (
              <tr key={player.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {editingId === player.id ? (
                  <>
                    <td style={{ padding: '6px 8px 6px 0' }}>
                      <input
                        className="input"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 8px 6px 0' }}>
                      <input
                        className="input"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </td>
                    <td style={{ padding: '6px 0', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleUpdate(player.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', padding: '2px 4px' }}
                        title="Save"
                      ><Check size={14} /></button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px 4px' }}
                        title="Cancel"
                      ><X size={14} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '8px 8px 8px 0', fontSize: '0.9rem', fontWeight: '500' }}>{player.name}</td>
                    <td style={{ padding: '8px 8px 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {player.email ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} /> {player.email}
                        </span>
                      ) : '—'}
                    </td>
                    {canEdit && (
                      <td style={{ padding: '8px 0', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => startEdit(player)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px 4px' }}
                          title="Edit player"
                        ><Pencil size={13} /></button>
                        <button
                          onClick={() => handleDelete(player.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d6d', padding: '2px 4px' }}
                          title="Remove player"
                        ><Trash2 size={13} /></button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canEdit && (
        adding ? (
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Name *</label>
              <input
                className="input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                placeholder="Player name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div style={{ flex: '2 1 180px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email</label>
              <input
                className="input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                placeholder="player@email.com"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                <Check size={14} /> Add
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            className="btn"
            style={{ padding: '6px 14px', fontSize: '0.82rem', background: 'rgba(0,210,255,0.08)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}
            onClick={() => setAdding(true)}
          >
            <UserPlus size={13} /> Add Player
          </button>
        )
      )}
    </div>
  );
}

function AdminRemindersPanel({ incompleteTeams, sendReminders }) {
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTest, setShowTest] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSend = async (email = null) => {
    setSending(true);
    try {
      await sendReminders(email);
      alert(email ? `Test email triggered successfully to ${email}!` : 'Roster reminders sent to all incomplete team captains!');
      setTestEmail('');
      setShowTest(false);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-panel" style={{ borderLeft: '4px solid #dd6b20', background: 'rgba(221, 107, 32, 0.05)', padding: '16px 20px', marginBottom: '20px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#dd6b20', margin: 0, fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} /> {incompleteTeams.length} Incomplete Teams Detected
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            These teams have fewer than the required 4 players. You can notify them manually or wait for the automatic weekly email process.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide List' : 'Show List'}
          </button>
          <button 
            className="btn btn-primary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#dd6b20', borderColor: '#dd6b20' }}
            onClick={() => handleSend(null)}
            disabled={sending}
          >
            Send Reminders
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setShowTest(!showTest)}
          >
            Test Email
          </button>
        </div>
      </div>

      {showTest && (
        <div style={{ marginTop: '12px', padding: '12px 0 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="email" 
            className="input" 
            placeholder="Recipient email..." 
            value={testEmail} 
            onChange={e => setTestEmail(e.target.value)} 
            style={{ padding: '6px 10px', fontSize: '0.82rem', flex: '1 1 200px' }}
          />
          <button 
            className="btn btn-primary" 
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => handleSend(testEmail)}
            disabled={sending || !testEmail.trim()}
          >
            Send Test
          </button>
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {incompleteTeams.map(t => (
              <li key={t.id} style={{ color: 'var(--text-secondary)' }}>
                <strong>{t.name}</strong> — {t.player_count || 0}/4 players {t.captain_email ? `(Captain: ${t.captain_email})` : '(No Captain Email)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Teams() {
  const { teams, addTeam, deleteTeam, getRoster, addPlayer, updatePlayer, deletePlayer, sendReminders, user, logout } = useTournament();
  const [newTeamName, setNewTeamName] = useState('');
  const [expandedTeam, setExpandedTeam] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isCaptain = user?.role === 'team_captain';

  // Auto-expand own team for captains
  useEffect(() => {
    if (isCaptain && user?.team_id) setExpandedTeam(user.team_id);
  }, [user]);

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      addTeam(newTeamName.trim());
      setNewTeamName('');
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Delete "${team.name}" and all their matches? This cannot be undone.`)) return;
    try {
      await deleteTeam(team.id);
      // If a captain deleted their own team, their account was also removed — log them out
      if (user?.role === 'team_captain') {
        logout();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleExpand = (teamId) => {
    setExpandedTeam(prev => prev === teamId ? null : teamId);
  };

  const myTeam = teams.find(t => t.id === user?.team_id);
  const isMyTeamIncomplete = myTeam && (myTeam.player_count || 0) < 4;
  const incompleteTeams = teams.filter(t => (t.player_count || 0) < 4);

  return (
    <div className="page-container animate-fade-in stagger-2">
      <div className="page-header flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="title-gradient">Teams & Rosters</h1>
          <p className="subtitle">View teams and their registered players</p>
        </div>
      </div>

      {isCaptain && isMyTeamIncomplete && (
        <div className="glass-panel" style={{ borderLeft: '4px solid #ff4d6d', background: 'rgba(255, 77, 109, 0.06)', padding: '16px 20px', marginBottom: '20px', borderRadius: '8px' }}>
          <h4 className="accent-magenta font-bold flex items-center gap-2" style={{ margin: 0, fontSize: '0.95rem' }}>
            ⚠️ Roster Incomplete!
          </h4>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Your team <strong>{myTeam.name}</strong> currently only has <strong>{myTeam.player_count || 0}/4</strong> players. A minimum of 4 players is required to play. Please expand your roster below before the tournament on <strong>June 18th</strong>.
          </p>
        </div>
      )}

      {isAdmin && incompleteTeams.length > 0 && (
        <AdminRemindersPanel incompleteTeams={incompleteTeams} sendReminders={sendReminders} />
      )}

      <div className="flex gap-6 mt-6" style={{ flexWrap: 'wrap' }}>
        {isAdmin && (
          <div className="glass-panel" style={{ flex: '1 1 280px', alignSelf: 'flex-start', padding: '24px' }}>
            <h2 className="flex items-center gap-2 mb-4" style={{ marginBottom: '16px' }}>
               <Users size={20} className="accent-magenta" /> Add New Team
            </h2>
            <form onSubmit={handleAddTeam} className="flex-col gap-4">
              <input
                type="text"
                className="input"
                placeholder="Team Name..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!newTeamName.trim()}>
                <Plus size={18} /> Add Team (Admin)
              </button>
            </form>
          </div>
        )}

        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {teams.map(team => {
            const isExpanded = expandedTeam === team.id;
            const isMyTeam = user?.team_id === team.id;
            const isIncomplete = (team.player_count || 0) < 4;

            return (
              <div
                key={team.id}
                className="glass-panel"
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  border: isMyTeam 
                    ? '1px solid var(--accent-blue)' 
                    : isIncomplete 
                      ? '1px solid rgba(255, 77, 109, 0.4)' 
                      : undefined,
                  boxShadow: isIncomplete ? '0 0 15px rgba(255, 77, 109, 0.05)' : undefined
                }}
              >
                {/* Team Header Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleExpand(team.id)}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="font-bold" style={{ fontSize: '1rem' }}>{team.name}</span>
                    {isMyTeam && (
                      <span className="accent-blue font-bold" style={{ fontSize: '0.7rem' }}>YOUR TEAM</span>
                    )}
                    {isIncomplete && (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255, 77, 109, 0.1)', color: '#ff4d6d', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,77,109,0.2)', fontWeight: '600' }}>
                        ⚠️ Roster Incomplete ({team.player_count || 0}/4)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(isAdmin || (isCaptain && isMyTeam)) && (
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'rgba(255,77,109,0.1)', color: '#ff4d6d', border: '1px solid #ff4d6d' }}
                        onClick={e => { e.stopPropagation(); handleDeleteTeam(team); }}
                        title="Delete team"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {/* Expandable Roster Panel */}
                {isExpanded && (
                  <RosterPanel
                    team={team}
                    user={user}
                    getRoster={getRoster}
                    addPlayer={addPlayer}
                    updatePlayer={updatePlayer}
                    deletePlayer={deletePlayer}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
