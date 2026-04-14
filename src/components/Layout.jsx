import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Trophy, CalendarDays, BookOpen, Users, LogIn, LogOut, Shield } from 'lucide-react';
import { useTournament } from '../store/TournamentContext';
import './Layout.css';

export default function Layout() {
  const { user, login, register, logout } = useTournament();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, teamName);
        setIsLogin(true);
        setError('Registered successfully, please log in.');
      }
      if (isLogin) {
        setShowAuth(false);
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="layout-container">
      <header className="glass-panel top-nav animate-fade-in">
        <div className="container flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '15px' }}>
          <div className="logo flex items-center gap-2">
             <Trophy color="var(--accent-magenta)" size={28} />
             <h2 className="title-gradient">VolleyFest '26</h2>
          </div>
          <nav className="nav-links flex gap-6" style={{ flexWrap: 'wrap' }}>
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Trophy size={18} /> Standings
            </NavLink>
            <NavLink to="/schedule" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <CalendarDays size={18} /> Schedule
            </NavLink>
            <NavLink to="/teams" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Users size={18} /> Teams
            </NavLink>
            <NavLink to="/rules" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <BookOpen size={18} /> Rules
            </NavLink>
            
            <div className="auth-section" style={{ marginLeft: '10px', paddingLeft: '10px', borderLeft: '1px solid var(--glass-border)' }}>
              {user ? (
                <div className="flex items-center gap-4">
                  {user.role === 'admin' && (
                    <a href="/tv" target="_blank" rel="noopener noreferrer" className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}>
                      Launch TV Display
                    </a>
                  )}
                  <span className="text-sm font-bold flex items-center gap-1" style={{ fontSize: '0.9rem' }}>
                    {user.role === 'admin' && <Shield size={14} className="accent-magenta" />}
                    {user.username}
                  </span>
                  <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    <LogOut size={14}/> Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuth(!showAuth)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <LogIn size={14}/> Login / Register
                </button>
              )}
            </div>
          </nav>
        </div>
        
        {/* Auth Dropdown Panel */}
        {showAuth && !user && (
          <div className="container animate-fade-in stagger-1" style={{ marginTop: '15px' }}>
            <form onSubmit={handleAuth} className="glass-panel flex gap-4" style={{ padding: '15px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="flex-col gap-2">
                <input required type="text" placeholder="Username" className="input" value={username} onChange={e => setUsername(e.target.value)} />
                <input required type="password" placeholder="Password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              
              {!isLogin && (
                <div className="flex-col gap-2">
                  <input required placeholder="New Team Name" className="input" value={teamName} onChange={e => setTeamName(e.target.value)} />
                </div>
              )}
              
              <div className="flex-col gap-2">
                <button type="submit" className="btn btn-primary">{isLogin ? 'Login' : 'Signup & Register Team'}</button>
                <span style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => {setIsLogin(!isLogin); setError('');}}>
                  {isLogin ? 'Need an account? Register a team here.' : 'Already have a team? Login here.'}
                </span>
                {error && <span className="accent-magenta" style={{ fontSize: '0.8rem' }}>{error}</span>}
              </div>
            </form>
          </div>
        )}
      </header>

      <main className="container main-content">
        <Outlet />
      </main>
    </div>
  );
}
