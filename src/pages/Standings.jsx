import React from 'react';
import { useTournament } from '../store/TournamentContext';
import { Trophy } from 'lucide-react';
import './Pages.css';

export default function Standings() {
  const { getStandings } = useTournament();
  const standings = getStandings();

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="title-gradient">Tournament Standings</h1>
          <p className="subtitle">Top 8 teams advance to playoffs</p>
        </div>
      </div>

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
          </tbody>
        </table>
      </div>
    </div>
  );
}
