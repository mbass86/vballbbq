import React, { useState, useEffect } from 'react';
import Standings from './Standings';
import Schedule from './Schedule';
import { Trophy } from 'lucide-react';

export default function TVMode() {
  const [activeView, setActiveView] = useState('standings'); // 'standings' or 'schedule'

  useEffect(() => {
    // Rotate every 15 seconds
    const interval = setInterval(() => {
      setActiveView(prev => (prev === 'standings' ? 'schedule' : 'standings'));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mini header for TV mode */}
      <div className="flex items-center justify-between" style={{ marginBottom: '40px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
        <div className="flex items-center gap-4">
          <Trophy color="var(--accent-magenta)" size={48} />
          <h1 className="title-gradient" style={{ fontSize: '3rem' }}>VolleyFest '26</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 className="subtitle" style={{ fontSize: '1.5rem', margin: 0 }}>
            {activeView === 'standings' ? 'Current Standings' : 'Upcoming Matches & Results'}
          </h2>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className={`transition-opacity duration-1000 ${activeView === 'standings' ? 'opacity-100' : 'hidden'}`}>
          {activeView === 'standings' && <Standings />}
        </div>
        <div className={`transition-opacity duration-1000 ${activeView === 'schedule' ? 'opacity-100' : 'hidden'}`}>
          {activeView === 'schedule' && <Schedule />}
        </div>
      </div>
    </div>
  );
}
