import React, { useState } from 'react';
import './GameSetup.css';

function GameSetup({ onCreateGame, onJoinGame, isConnected }) {
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2']);
  const [joinGameId, setJoinGameId] = useState('');
  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [timerDuration, setTimerDuration] = useState(30); // Timer duration in seconds

  const handleCreateGame = (e) => {
    e.preventDefault();
    // Ensure timer duration is valid (default to 30 if invalid)
    const validTimerDuration = (typeof timerDuration === 'number' && timerDuration >= 10 && timerDuration <= 120) 
      ? timerDuration 
      : 30;
    onCreateGame(teamNames, validTimerDuration);
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (joinGameId.trim()) {
      onJoinGame(joinGameId.trim().toUpperCase());
    }
  };

  const addTeam = () => {
    setTeamNames([...teamNames, `Team ${teamNames.length + 1}`]);
  };

  const removeTeam = (index) => {
    if (teamNames.length > 2) {
      setTeamNames(teamNames.filter((_, i) => i !== index));
    }
  };

  const updateTeamName = (index, name) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
  };

  return (
    <div className="game-setup">
      <div className="setup-card">
        <h1>🎯 Articulate!</h1>
        <p className="subtitle">The Fast-Talking Description Game</p>
        
        {!isConnected && (
          <div className="connection-status">
            <span className="status-indicator offline"></span>
            Playing in local mode (no server required)
          </div>
        )}
        {isConnected && (
          <div className="connection-status">
            <span className="status-indicator online"></span>
            Connected to server
          </div>
        )}

        <div className="mode-selector">
          <button 
            className={mode === 'create' ? 'active' : ''}
            onClick={() => setMode('create')}
          >
            Create Game
          </button>
          <button 
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            Join Game
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreateGame} className="setup-form">
            <h2>Create New Game</h2>
            <div className="teams-section">
              <label>Teams:</label>
              {teamNames.map((name, index) => (
                <div key={index} className="team-input">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateTeamName(index, e.target.value)}
                    placeholder={`Team ${index + 1}`}
                  />
                  {teamNames.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeTeam(index)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTeam} className="add-team-btn">
                + Add Team
              </button>
            </div>
            <div className="timer-section">
              <label htmlFor="timer-duration">Timer Duration (seconds):</label>
              <input
                id="timer-duration"
                type="number"
                min="10"
                max="120"
                value={timerDuration}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setTimerDuration('');
                  } else {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
                      setTimerDuration(numValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (isNaN(value) || value < 10) {
                    setTimerDuration(10);
                  } else if (value > 120) {
                    setTimerDuration(120);
                  } else {
                    setTimerDuration(value);
                  }
                }}
                className="timer-input"
              />
            </div>
            <button type="submit" className="primary-btn">
              Create Game
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinGame} className="setup-form">
            <h2>Join Existing Game</h2>
            <div className="join-section">
              <label>Game ID:</label>
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                placeholder="Enter Game ID"
                maxLength={6}
                className="game-id-input"
              />
            </div>
            <button type="submit" className="primary-btn" disabled={!isConnected || !joinGameId.trim()}>
              Join Game
            </button>
          </form>
        )}

        <div className="quick-rules">
          <h3>Quick Rules</h3>
          <ul>
            <li>Describe words to your team within the timer</li>
            <li>No "sounds like", "starts with", or parts of the word</li>
            <li>Move forward based on correct guesses</li>
            <li>First team to reach Finish wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GameSetup;

