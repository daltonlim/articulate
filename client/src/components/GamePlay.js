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
  onHandleSpade,
  onHandleSpinnerChoice,
  onSpinSpinner,
  onControlTurnGuess,
  onControlTurnPass,
  onRerollControlCard
}) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSpadeModal, setShowSpadeModal] = useState(false);
  const [spadeHandledForPosition, setSpadeHandledForPosition] = useState(null);
  const [isHandlingSpade, setIsHandlingSpade] = useState(false);
  const [showSpinnerModal, setShowSpinnerModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHandlingSpinner, setIsHandlingSpinner] = useState(false);
  const [showControlTurnModal, setShowControlTurnModal] = useState(false);
  const [isHandlingControlTurn, setIsHandlingControlTurn] = useState(false);

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
      // Timer ended, automatically end the turn
      setIsTimerRunning(false);
      onEndTurn(correctCount);
      const timerSeconds = gameState?.turnDuration ? Math.ceil(gameState.turnDuration / 1000) : 30;
      setTimeRemaining(timerSeconds);
      setCorrectCount(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemaining, gameState, correctCount, onEndTurn]);

  // Check for Control Turn (Final Challenge)
  useEffect(() => {
    if (gameState?.currentTurn?.isControlTurn && gameState?.controlCard && !showControlTurnModal) {
      setShowControlTurnModal(true);
    }
    
    // Clear Control Turn modal if Control Turn ends
    if (!gameState?.currentTurn?.isControlTurn && showControlTurnModal) {
      setShowControlTurnModal(false);
    }
  }, [gameState, showControlTurnModal]);

  // Check for spinner (Orange/Action or Red/Random) after turn ends
  useEffect(() => {
    if (gameState?.pendingSpinner && !showSpinnerModal) {
      // Show spinner modal when pendingSpinner exists
      setShowSpinnerModal(true);
      setIsSpinning(false); // Reset spinning state when modal first shows
    }
    
    // When spinner result arrives, stop showing "Spinning..."
    if (gameState?.spinnerResult) {
      setIsSpinning(false);
    }
    
    // Clear spinner modal if pendingSpinner is cleared (handled on server)
    if (!gameState?.pendingSpinner && showSpinnerModal) {
      setShowSpinnerModal(false);
      setIsSpinning(false);
    }
  }, [gameState, showSpinnerModal]);

  // Check for spade (Wildcard category) after turn ends
  // Note: When a turn ends, currentTeamIndex is already incremented to the next team
  // So we need to check the team that just ended their turn (previous team index)
  useEffect(() => {
    if (gameState?.teams && gameState.currentTeamIndex !== undefined && !gameState.currentTurn && !gameState.winner && !gameState.isBonusTurn && !gameState.pendingSpinner) {
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
    const timerSeconds = gameState?.turnDuration ? Math.ceil(gameState.turnDuration / 1000) : 30;
    setTimeRemaining(timerSeconds);
    setCorrectCount(0);
    onStartTurn();
  };

  const handleEndTurn = () => {
    onEndTurn(correctCount);
    const timerSeconds = gameState?.turnDuration ? Math.ceil(gameState.turnDuration / 1000) : 30;
    setTimeRemaining(timerSeconds);
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

  const handleSpadePass = () => {
    if (isHandlingSpade) return; // Prevent multiple clicks
    setIsHandlingSpade(true);
    
    // Reroll the word instead of clearing it
    onDrawSpadeCard();
    
    // Reset after a short delay to allow server to process
    setTimeout(() => setIsHandlingSpade(false), 500);
  };

  const handleSpinSpinner = () => {
    if (isSpinning || !gameState?.pendingSpinner || gameState?.spinnerResult) return;
    
    // Set spinning state to true and trigger the spin on the server
    setIsSpinning(true);
    onSpinSpinner();
  };

  const handleSpinnerChoice = (choice) => {
    if (isHandlingSpinner) return; // Prevent multiple clicks
    setIsHandlingSpinner(true);
    
    // Close modal immediately
    setShowSpinnerModal(false);
    
    // Send choice to server
    onHandleSpinnerChoice(choice);
    
    // Reset after a short delay to allow server to process
    setTimeout(() => setIsHandlingSpinner(false), 1000);
  };

  const handleControlTurnGuess = (guessingTeamIndex) => {
    if (isHandlingControlTurn) return; // Prevent multiple clicks
    setIsHandlingControlTurn(true);
    
    // Close modal immediately
    setShowControlTurnModal(false);
    
    // Send guess to server
    onControlTurnGuess(guessingTeamIndex);
    
    // Reset after a short delay to allow server to process
    setTimeout(() => setIsHandlingControlTurn(false), 1000);
  };

  const handleControlTurnPass = () => {
    if (isHandlingControlTurn) return; // Prevent multiple clicks
    setIsHandlingControlTurn(true);
    
    // Close modal immediately
    setShowControlTurnModal(false);
    
    // Send pass to server
    onControlTurnPass();
    
    // Reset after a short delay to allow server to process
    setTimeout(() => setIsHandlingControlTurn(false), 1000);
  };

  const handleRerollControlCard = () => {
    if (isHandlingControlTurn) return; // Prevent multiple clicks
    // Don't close modal - just reroll the card
    onRerollControlCard();
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

          {!gameState.currentTurn && !showSpadeModal && !showSpinnerModal && !showControlTurnModal && !gameState.winner && (
            <button 
              onClick={handleStartTurn} 
              className="start-turn-btn"
            >
              {gameState.finalChallenge && gameState.finalChallenge.teamIndex === gameState.currentTeamIndex
                ? "Final Challenge - Start Control Turn" 
                : currentTeam?.position >= gameState.board.totalSpaces 
                  ? "Final Challenge - Start Turn" 
                  : gameState.isBonusTurn 
                    ? "Start Bonus Turn" 
                    : "Start Turn"}
            </button>
          )}

          {gameState.finalChallenge && gameState.finalChallenge.teamIndex === gameState.currentTeamIndex && !gameState.currentTurn && !showControlTurnModal && (
            <div className="final-challenge-notice" style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#FFD700', 
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              🏁 FINAL CHALLENGE: You must win a Control Turn to win the game!
            </div>
          )}

          {gameState.currentTurn && !gameState.currentTurn.isControlTurn && (
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
                <h3>🎯 Spinner - Sabotage Mechanic!</h3>
                <p>You landed on an Orange or Red space! Spin the arrow to get a bonus or sabotage an opponent.</p>
                
                {!gameState.spinnerResult ? (
                  <div>
                    <button
                      onClick={handleSpinSpinner}
                      className="spinner-btn"
                      disabled={isSpinning || isHandlingSpinner}
                      style={{ 
                        backgroundColor: '#FF9800',
                        fontSize: '1.2em',
                        padding: '20px',
                        marginTop: '20px',
                        opacity: (isSpinning || isHandlingSpinner) ? 0.6 : 1,
                        cursor: (isSpinning || isHandlingSpinner) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSpinning ? 'Spinning...' : '🎰 Spin the Arrow!'}
                    </button>
                  </div>
                ) : (
                  <div>
                    {gameState.spinnerResult.type === 'no-bonus' ? (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '1.5em', marginBottom: '10px' }}>❌ No Bonus</div>
                        <p>The arrow landed on Orange or Red. Your turn ends here.</p>
                        <button
                          onClick={() => handleSpinnerChoice('no-bonus')}
                          className="spinner-btn"
                          disabled={isHandlingSpinner}
                          style={{ 
                            backgroundColor: '#999',
                            marginTop: '15px',
                            opacity: isHandlingSpinner ? 0.6 : 1,
                            cursor: isHandlingSpinner ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '1.5em', marginBottom: '15px', fontWeight: 'bold' }}>
                          {gameState.spinnerResult.type === 'wide-green' ? '🟢 Wide Green Segment!' : '🟢 Narrow Green Segment!'}
                        </div>
                        <p style={{ marginBottom: '20px' }}>
                          Move your piece <strong>{gameState.spinnerResult.spaces} spaces forward</strong> OR 
                          move an opponent's piece <strong>{gameState.spinnerResult.spaces} spaces back</strong>.
                        </p>
                        <div className="spinner-options">
                          <button
                            onClick={() => handleSpinnerChoice('forward')}
                            className="spinner-btn"
                            disabled={isHandlingSpinner}
                            style={{ 
                              backgroundColor: '#4CAF50',
                              opacity: isHandlingSpinner ? 0.6 : 1,
                              cursor: isHandlingSpinner ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Move Forward {gameState.spinnerResult.spaces} Spaces
                          </button>
                          <button
                            onClick={() => handleSpinnerChoice('backward')}
                            className="spinner-btn"
                            disabled={isHandlingSpinner}
                            style={{ 
                              backgroundColor: '#F44336',
                              opacity: isHandlingSpinner ? 0.6 : 1,
                              cursor: isHandlingSpinner ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Move Opponent Back {gameState.spinnerResult.spaces} Spaces
                          </button>
                        </div>
                        <div className="spinner-note" style={{ marginTop: '15px', fontSize: '0.9em', color: '#666', fontStyle: 'italic' }}>
                          Note: If you move forward and land on Orange/Red, you won't get another spin (no chain rule).
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                    onClick={handleSpadePass}
                    className="spade-btn pass-btn"
                    disabled={isHandlingSpade}
                    style={{ 
                      backgroundColor: '#999', 
                      marginTop: '10px',
                      opacity: isHandlingSpade ? 0.6 : 1,
                      cursor: isHandlingSpade ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Pass
                  </button>
                </div>
              </div>
            </div>
          )}

          {showControlTurnModal && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ padding: '25px', maxWidth: '600px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1.5em' }}>🏁 Final Challenge - Control Turn</h3>
                <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                  The finishing team must describe this word to <strong>everyone</strong> (both teammates and opponents).
                  There is <strong>no time limit</strong> - it's a race to see who guesses correctly first!
                </p>
                
                {gameState.controlCard && (
                  <div className="control-card-display" style={{ 
                    marginBottom: '20px', 
                    padding: '20px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '8px',
                    border: '3px solid #FFD700'
                  }}>
                    <div style={{ 
                      fontSize: '0.9em', 
                      color: '#666', 
                      marginBottom: '10px',
                      fontStyle: 'italic'
                    }}>
                      Control Entry (♠)
                    </div>
                    <div className="control-card-word" style={{ 
                      fontSize: '2em', 
                      fontWeight: 'bold', 
                      marginTop: '10px',
                      marginBottom: '15px',
                      color: '#000'
                    }}>
                      {gameState.controlCard.word}
                    </div>
                    <div style={{ 
                      marginTop: '10px', 
                      fontSize: '0.9em', 
                      color: '#666',
                      fontStyle: 'italic',
                      marginBottom: '10px'
                    }}>
                      Only the describer can see this word!
                    </div>
                    <button
                      onClick={handleRerollControlCard}
                      className="spade-btn"
                      disabled={isHandlingControlTurn}
                      style={{ 
                        backgroundColor: '#FF9800',
                        color: 'white',
                        padding: '8px 16px',
                        fontSize: '0.9em',
                        marginTop: '10px',
                        opacity: isHandlingControlTurn ? 0.6 : 1,
                        cursor: isHandlingControlTurn ? 'not-allowed' : 'pointer',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold'
                      }}
                    >
                      Pass / Reroll Word
                    </button>
                  </div>
                )}
                
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', lineHeight: '1.6' }}>
                  <strong style={{ fontSize: '1.1em' }}>Rules:</strong>
                  <ul style={{ marginTop: '10px', textAlign: 'left', paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '8px' }}>If the <strong>finishing team</strong> guesses correctly first, they <strong>WIN</strong>!</li>
                    <li style={{ marginBottom: '8px' }}>If an <strong>opponent</strong> guesses correctly first, the finishing team fails and must try again next turn.</li>
                    <li>If no one can guess it, the finishing team fails and must try again next turn.</li>
                  </ul>
                </div>
                
                <div className="control-turn-options" style={{ paddingTop: '10px' }}>
                  <div style={{ marginBottom: '15px', fontWeight: 'bold', fontSize: '1.1em' }}>
                    Which team guessed correctly first?
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                    {gameState.teams.map((team) => (
                      <button
                        key={team.index}
                        onClick={() => handleControlTurnGuess(team.index)}
                        className="spade-btn"
                        disabled={isHandlingControlTurn}
                        style={{ 
                          opacity: isHandlingControlTurn ? 0.6 : 1, 
                          cursor: isHandlingControlTurn ? 'not-allowed' : 'pointer',
                          padding: '12px 20px',
                          fontSize: '1em'
                        }}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleControlTurnPass}
                    className="spade-btn pass-btn"
                    disabled={isHandlingControlTurn}
                    style={{ 
                      backgroundColor: '#999', 
                      marginTop: '5px',
                      padding: '12px 20px',
                      fontSize: '1em',
                      opacity: isHandlingControlTurn ? 0.6 : 1,
                      cursor: isHandlingControlTurn ? 'not-allowed' : 'pointer'
                    }}
                  >
                    No one guessed it
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

