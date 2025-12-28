import React, { useState, useEffect } from 'react';
import './GamePlay.css';

function GamePlay({ 
  gameState, 
  gameId,
  onStartTurn,
  onCorrectGuess,
  onPass,
  onEndTurn,
  onDrawSpadeCard,
  onHandleSpade
}) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSpadeModal, setShowSpadeModal] = useState(false);
  const [spadeHandledForPosition, setSpadeHandledForPosition] = useState(null);
  const [isHandlingSpade, setIsHandlingSpade] = useState(false);

  // Helper functions - defined before use
  const getCategoryForPosition = (position, board, categoryCycle) => {
    if (!board || position >= board.totalSpaces) return null;
    const cycle = categoryCycle || ['Object', 'Action', 'Wildcard', 'World', 'Person', 'Random', 'Nature'];
    const categoryIndex = position % cycle.length;
    return cycle[categoryIndex];
  };

  const getCategoryColor = (category) => {
    if (!gameState?.board) return '#CCCCCC';
    return gameState.board.categoryColors[category] || '#CCCCCC';
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

  // Check for spade (Wildcard category) after turn ends
  // Note: When a turn ends, currentTeamIndex is already incremented to the next team
  // So we need to check the team that just ended their turn (previous team index)
  useEffect(() => {
    if (gameState?.teams && gameState.currentTeamIndex !== undefined && !gameState.currentTurn && !gameState.winner && !gameState.isBonusTurn) {
      // The team that just ended their turn is at the previous index
      const previousTeamIndex = (gameState.currentTeamIndex - 1 + gameState.teams.length) % gameState.teams.length;
      const teamThatJustMoved = gameState.teams[previousTeamIndex];
      
      if (teamThatJustMoved) {
        const category = getCategoryForPosition(teamThatJustMoved.position, gameState.board, gameState.categoryCycle);
        const positionKey = `${previousTeamIndex}-${teamThatJustMoved.position}`;
        
        // Reset handled position if team has moved to a different position
        if (spadeHandledForPosition && !spadeHandledForPosition.startsWith(`${previousTeamIndex}-`)) {
          setSpadeHandledForPosition(null);
        }
        
        // Show spade modal when landing on Wildcard category and spadeCard exists
        // Only show if: category is Wildcard, modal is not already showing, we haven't handled it for this position yet
        if (category === 'Wildcard' && !showSpadeModal && spadeHandledForPosition !== positionKey) {
          if (gameState.spadeCard) {
            // Spade card already drawn, show the modal
            setShowSpadeModal(true);
          } else if (!spadeHandledForPosition) {
            // Draw a random word for the spade (only if we haven't handled a spade recently)
            onDrawSpadeCard();
          }
        }
      }
    }
    
    // Clear spade modal if spadeCard is cleared (handled on server)
    if (!gameState?.spadeCard && showSpadeModal) {
      setShowSpadeModal(false);
    }
  }, [gameState, showSpadeModal, spadeHandledForPosition]);

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

  const handleSpadeWin = (teamIndex) => {
    if (isHandlingSpade) return; // Prevent multiple clicks
    setIsHandlingSpade(true);
    
    // Close modal immediately to prevent re-triggering
    setShowSpadeModal(false);
    
    // Mark this position as handled to prevent re-opening the modal
    if (gameState?.teams && gameState.currentTeamIndex !== undefined) {
      const previousTeamIndex = (gameState.currentTeamIndex - 1 + gameState.teams.length) % gameState.teams.length;
      const teamThatJustMoved = gameState.teams[previousTeamIndex];
      if (teamThatJustMoved) {
        const positionKey = `${previousTeamIndex}-${teamThatJustMoved.position}`;
        setSpadeHandledForPosition(positionKey);
      }
    }
    
    onHandleSpade(teamIndex);
    
    // Reset after a short delay to allow server to process
    setTimeout(() => setIsHandlingSpade(false), 1000);
  };

  const handleSpadeSkip = () => {
    if (isHandlingSpade) return; // Prevent multiple clicks
    setIsHandlingSpade(true);
    
    // Close modal immediately to prevent re-triggering
    setShowSpadeModal(false);
    
    // Mark this position as handled to prevent re-opening the modal
    if (gameState?.teams && gameState.currentTeamIndex !== undefined) {
      const previousTeamIndex = (gameState.currentTeamIndex - 1 + gameState.teams.length) % gameState.teams.length;
      const teamThatJustMoved = gameState.teams[previousTeamIndex];
      if (teamThatJustMoved) {
        const positionKey = `${previousTeamIndex}-${teamThatJustMoved.position}`;
        setSpadeHandledForPosition(positionKey);
      }
    }
    
    onHandleSpade(null); // Pass null to skip
    
    // Reset after a short delay to allow server to process
    setTimeout(() => setIsHandlingSpade(false), 1000);
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
            <h3>
              Current Team: {currentTeam?.name}
              {gameState.isBonusTurn && (
                <span style={{ 
                  marginLeft: '10px', 
                  fontSize: '0.7em', 
                  color: '#FFD700',
                  fontWeight: 'bold'
                }}>
                  ⭐ BONUS TURN
                </span>
              )}
            </h3>
            <div 
              className="category-badge"
              style={{ backgroundColor: getCategoryColor(currentCategory) }}
            >
              {currentCategory}
            </div>
          </div>

          {!gameState.currentTurn && !showSpadeModal && !gameState.winner && (
            <button 
              onClick={handleStartTurn} 
              className="start-turn-btn"
            >
              {currentTeam?.position >= gameState.board.totalSpaces 
                ? "Final Challenge - Start Turn" 
                : gameState.isBonusTurn 
                  ? "Start Bonus Turn" 
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

          {showSpadeModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Spade Space - Free for All!</h3>
                <p>The describer describes the word to everyone. Which team guessed correctly first?</p>
                
                {gameState.spadeCard && (
                  <div className="spade-card-display" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <div className="spade-card-category" style={{ 
                      backgroundColor: getCategoryColor(gameState.spadeCard.category),
                      padding: '5px 10px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '10px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {gameState.spadeCard.category}
                    </div>
                    <div className="spade-card-word" style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '10px' }}>
                      {gameState.spadeCard.word}
                    </div>
                  </div>
                )}
                
                <div className="spade-options">
                  {gameState.teams.map((team) => (
                    <button
                      key={team.index}
                      onClick={() => handleSpadeWin(team.index)}
                      className="spade-btn"
                      disabled={isHandlingSpade}
                      style={{ opacity: isHandlingSpade ? 0.6 : 1, cursor: isHandlingSpade ? 'not-allowed' : 'pointer' }}
                    >
                      {team.name}
                    </button>
                  ))}
                  <button
                    onClick={handleSpadeSkip}
                    className="spade-btn skip-btn"
                    disabled={isHandlingSpade}
                    style={{ 
                      backgroundColor: '#999', 
                      marginTop: '10px',
                      opacity: isHandlingSpade ? 0.6 : 1,
                      cursor: isHandlingSpade ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Skip
                  </button>
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

