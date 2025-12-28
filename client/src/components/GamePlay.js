import React, { useState, useEffect } from 'react';
import './GamePlay.css';

function GamePlay({ 
  gameState, 
  gameId,
  onStartTurn,
  onCorrectGuess,
  onPass,
  onEndTurn,
  onSpinSpinner,
  onHandleSpade
}) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSpinnerModal, setShowSpinnerModal] = useState(false);
  const [showSpadeModal, setShowSpadeModal] = useState(false);

  // Helper functions - defined before use
  const getCategoryForPosition = (position, board) => {
    if (!board || position >= board.totalSpaces) return null;
    const categoryIndex = Math.floor(position / 10) % board.categories.length;
    return board.categories[categoryIndex];
  };

  const getCategoryColor = (category) => {
    if (!gameState?.board) return '#CCCCCC';
    return gameState.board.categoryColors[category] || '#CCCCCC';
  };

  const getSpaceType = (position, board) => {
    if (!board) return 'normal';
    if (position >= board.totalSpaces) return 'finish';
    if (board.spadeSpaces.includes(position)) return 'spade';
    if (board.spinnerSpaces.includes(position)) return 'spinner';
    return 'normal';
  };

  useEffect(() => {
    if (gameState?.currentTurn && gameState.turnTimeRemaining !== null) {
      setTimeRemaining(Math.ceil(gameState.turnTimeRemaining / 1000));
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState?.currentTurn) {
      setCorrectCount(gameState.currentTurn.correctCount);
    } else {
      setCorrectCount(0);
    }
  }, [gameState]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0 && gameState?.currentTurn) {
      // Timer ended, but don't auto-end turn - let user click End Turn
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemaining, gameState]);

  // Check for special spaces after turn ends
  useEffect(() => {
    if (gameState?.teams && gameState.currentTeamIndex !== undefined && !gameState.currentTurn) {
      const currentTeam = gameState.teams[gameState.currentTeamIndex];
      if (currentTeam && !gameState.winner) {
        const spaceType = getSpaceType(currentTeam.position, gameState.board);
        // Only show modals if we're not already showing one
        if (spaceType === 'spinner' && !showSpinnerModal && !showSpadeModal) {
          setShowSpinnerModal(true);
        } else if (spaceType === 'spade' && !showSpadeModal && !showSpinnerModal) {
          setShowSpadeModal(true);
        }
      }
    }
  }, [gameState, showSpinnerModal, showSpadeModal]);

  const handleStartTurn = () => {
    setTimeRemaining(30);
    setCorrectCount(0);
    onStartTurn();
  };

  const handleEndTurn = () => {
    onEndTurn(correctCount);
    setTimeRemaining(30);
    setCorrectCount(0);
    setIsTimerRunning(false);
  };

  const handleCorrect = () => {
    setCorrectCount((prev) => prev + 1);
    onCorrectGuess();
  };

  const handlePass = () => {
    onPass();
  };

  const handleSpin = () => {
    onSpinSpinner();
    setShowSpinnerModal(false);
  };

  const handleSpadeWin = (teamIndex) => {
    onHandleSpade(teamIndex);
    setShowSpadeModal(false);
  };

  if (!gameState) return null;

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  // Use category from current turn, or the team's next category if no turn active
  const currentCategory = gameState.currentTurn?.category || 
    (currentTeam?.nextCategory || null);
  const currentCard = gameState.currentCard;

  return (
    <div className="game-play-container">
      <div className="game-id-display">
        Game ID: <strong>{gameId}</strong>
      </div>

      {!gameState.isStarted && (
        <div className="waiting-message">
          Waiting for game to start...
        </div>
      )}

      {gameState.isStarted && (
        <>
          <div className="current-team-display">
            <h3>Current Team: {currentTeam?.name}</h3>
            <div 
              className="category-badge"
              style={{ backgroundColor: getCategoryColor(currentCategory) }}
            >
              {currentCategory}
            </div>
          </div>

          {!gameState.currentTurn && !showSpinnerModal && !showSpadeModal && !gameState.winner && (
            <button 
              onClick={handleStartTurn} 
              className="start-turn-btn"
            >
              {currentTeam?.position >= gameState.board.totalSpaces 
                ? "Final Challenge - Start Turn" 
                : "Start Turn"}
            </button>
          )}

          {gameState.currentTurn && (
            <div className="turn-active">
              <div className="timer-display">
                <div className={`timer-circle ${timeRemaining <= 5 ? 'warning' : ''}`}>
                  {timeRemaining}
                </div>
                <div className="timer-label">seconds remaining</div>
              </div>

              {currentCard && (
                <div className="card-display">
                  <div className="card-category" style={{ backgroundColor: getCategoryColor(currentCard.category) }}>
                    {currentCard.category}
                  </div>
                  <div className="card-word">
                    {currentCard.word}
                  </div>
                </div>
              )}

              <div className="turn-stats">
                <div className="stat">
                  <span className="stat-label">Correct:</span>
                  <span className="stat-value">{correctCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Passed:</span>
                  <span className="stat-value">{gameState.currentTurn.passedCount || 0}</span>
                </div>
              </div>

              <div className="turn-actions">
                <button 
                  onClick={handleCorrect} 
                  className="action-btn correct-btn"
                >
                  ✓ Correct
                </button>
                <button 
                  onClick={handlePass} 
                  className="action-btn pass-btn"
                >
                  Pass
                </button>
                <button 
                  onClick={handleEndTurn} 
                  className="action-btn end-turn-btn"
                >
                  End Turn ({correctCount} moves)
                </button>
              </div>
            </div>
          )}

          {showSpinnerModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Spinner Space!</h3>
                <p>You landed on a spinner space. Spin to move forward or move an opponent back!</p>
                <div className="spinner-options">
                  <button 
                    onClick={handleSpin}
                    className="spinner-btn wide"
                  >
                    Spin the Spinner!
                  </button>
                  <p className="spinner-note">The spinner will randomly move you forward or move an opponent back</p>
                </div>
              </div>
            </div>
          )}

          {showSpadeModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Spade Space - Free for All!</h3>
                <p>The describer describes the word to everyone. Which team guessed correctly first?</p>
                <div className="spade-options">
                  {gameState.teams.map((team) => (
                    <button
                      key={team.index}
                      onClick={() => handleSpadeWin(team.index)}
                      className="spade-btn"
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gameState.winner && (
            <div className="winner-display">
              <h2>🎉 {gameState.winner.name} Wins! 🎉</h2>
            </div>
          )}
        </>
      )}

      <div className="golden-rules">
        <h4>The Golden Rules</h4>
        <ul>
          <li>No "sounds like" or rhymes</li>
          <li>No "starts with" or letter clues</li>
          <li>No parts of the word</li>
          <li>No translations</li>
        </ul>
      </div>
    </div>
  );
}

export default GamePlay;

