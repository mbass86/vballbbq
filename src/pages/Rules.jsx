import React from 'react';
import { BookOpen } from 'lucide-react';
import './Pages.css';

export default function Rules() {
  return (
    <div className="page-container animate-fade-in stagger-3">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="title-gradient">Volleyball Basic Rules</h1>
          <p className="subtitle">Tournament guidelines and scoring rules</p>
        </div>
      </div>

      <div className="rules-grid mt-6">
        <div className="glass-panel rule-card">
          <h3>The Serve</h3>
          <ul>
            <li>First serve is determined by a volley</li>
            <li>Ball may be served underhand or overhand &mdash; Jump Serving is <strong>NOT allowed</strong></li>
            <li>A player must not block, spike, or attack a serve</li>
          </ul>
        </div>

        <div className="glass-panel rule-card">
          <h3>Rotation</h3>
          <ul>
            <li>Team will rotate each time they win the serve</li>
            <li>Players shall rotate in a clockwise manner</li>
            <li>There shall be 6 players on each side</li>
          </ul>
        </div>

        <div className="glass-panel rule-card">
          <h3>Playing The Game (Volley)</h3>
          <ul>
            <li>Players cannot spike UNLESS it is agreed upon by both teams before the beginning of the match.</li>
            <li>Maximum of three hits per side.</li>
            <li>Player may not hit the ball twice in succession (A block is not considered a hit).</li>
            <li>Ball may be played off the net during a volley and on serve.</li>
            <li>A ball touching a boundary line is good.</li>
            <li>A legal hit is contact with the ball by a player body above and including the waist which does not allow the ball to visibly come to a rest.</li>
            <li>If two or more players contact the ball simultaneously, it is considered one play and the players involved may not participate in the next play.</li>
          </ul>
        </div>

        <div className="glass-panel rule-card">
          <h3>Scoring</h3>
          <ul>
            <li>There will be a point scored on every serve of the ball.</li>
            <li>Offense will score on a defense miss or out of bounds hit.</li>
            <li>Defense will score on an offensive miss, out of bounds hit, or serve into the net.</li>
            <li>Game will be played to 25 pts or 15 minutes.</li>
            <li>If teams are tied at the 15 minute mark, they will both be credited with a win.</li>
            <li>The quarter finals teams will be determined by number of games won. If there is a tie between teams for number of games won we will go to point differential.</li>
          </ul>
        </div>

        <div className="glass-panel rule-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="accent-magenta">Basic Violations</h3>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <li>Players are to call balls in or out of bounds - if there is a dispute, resume play by re-serving the ball with no point awarded.</li>
            <li>Players are to call their own fouls. Obvious fouls are: carries, double hits, touching the net, going under the net and contacting another player.</li>
            <li>If a player touches the net or crosses under the plane of the net at any time it is considered a foul and will result in a point for the opposing team.</li>
            <li>Failure to serve the ball over the net successfully.</li>
            <li>Hitting the ball illegally (Carrying, Palming, Throwing, etc.).</li>
            <li>Touches of the net with any part of the body while the ball is in play. If the ball is driven into the net with such force that it causes the net to contact an opposing player, no foul will be called, and the ball shall continue to be in play.</li>
            <li>Reaching under the net (if it interferes with the ball or opposing player).</li>
            <li>Reaching over the net, except when: Executing a follow-through, or Blocking a ball which is in the opponents court but is being returned (the blocker must not contact the ball until after the opponent who is attempting to return the ball makes contact) - except to block the third play.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
