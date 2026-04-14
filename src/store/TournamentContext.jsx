import React, { createContext, useContext, useState, useEffect } from 'react';

const TournamentContext = createContext();
const API_URL = 'http://localhost:3001/api';

export function useTournament() {
  return useContext(TournamentContext);
}

export function TournamentProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vball_token'));

  useEffect(() => {
    fetchData();
    if (token) {
      // Decode JWT roughly to get user info if we wanted, or we could just fetch /me.
      // Easiest is to parse from localStorage if saved.
      const savedUser = localStorage.getItem('vball_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const tRes = await fetch(`${API_URL}/teams`);
      const { ...teamsData } = await tRes.json();
      setTeams(Object.values(teamsData)); // Fix if API returns obj. Endpoint returns array: rows
      
      const mRes = await fetch(`${API_URL}/matches`);
      const matchesData = await mRes.json();
      setMatches(matchesData);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const login = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('vball_token', data.accessToken);
    localStorage.setItem('vball_user', JSON.stringify(data.user));
  };
  
  const register = async (username, password, teamName) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, teamName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData(); // Refresh teams
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vball_token');
    localStorage.removeItem('vball_user');
  };

  const updateMatchScore = async (matchId, score1, score2) => {
    try {
      const res = await fetch(`${API_URL}/matches/${matchId}/score`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score1, score2 })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return false;
      }
      
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, score1: data.score1, score2: data.score2 } : m
        )
      );
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const addMatch = async (match) => {
    // Only Admin
    const res = await fetch(`${API_URL}/matches`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(match)
    });
    fetchData();
  };

  const addTeam = async (name) => {
    // Only Admin
    const res = await fetch(`${API_URL}/teams`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    fetchData();
  };

  const getStandings = () => {
    const stats = {};
    if (!teams || teams.length === 0) return [];
    
    teams.forEach(t => {
      stats[t.id] = { id: t.id, name: t.name, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, pointDiff: 0, played: 0 };
    });

    matches.forEach(m => {
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

    return Object.values(stats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointDiff - a.pointDiff;
    });
  };

  const value = {
    teams,
    matches,
    user,
    login,
    register,
    logout,
    updateMatchScore,
    addMatch,
    addTeam,
    getStandings,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}
