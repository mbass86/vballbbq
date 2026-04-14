import React, { useState } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Users, Plus } from 'lucide-react';
import './Pages.css';

export default function Teams() {
  const { teams, addTeam, user } = useTournament();
  const [newTeamName, setNewTeamName] = useState('');

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      addTeam(newTeamName.trim());
      setNewTeamName('');
    }
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="page-container animate-fade-in stagger-2">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="title-gradient">Teams</h1>
          <p className="subtitle">View the participating teams in the tournament</p>
        </div>
      </div>

      <div className="flex gap-6 mt-6" style={{ flexWrap: 'wrap' }}>
        {isAdmin && (
          <div className="glass-panel" style={{ flex: '1 1 300px', alignSelf: 'flex-start', padding: '24px' }}>
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

        <div className="glass-panel overflow-x-auto" style={{ flex: '2 1 400px' }}>
          <table className="tournament-table">
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Name</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id} className={user?.team_id === team.id ? 'highlight-row' : ''}>
                  <td className="text-secondary" style={{ color: 'var(--text-secondary)' }}>
                    #{team.id}
                    {user?.team_id === team.id && <span className="accent-blue font-bold ml-2 text-xs" style={{ fontSize: '0.7rem' }}>YOUR TEAM</span>}
                  </td>
                  <td className="font-bold">{team.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
