import React from 'react';
import './GameBoard.css';

function GameBoard({ gameState, onStartGame }) {
  if (!gameState) return null;

  const { board, teams, currentTeamIndex, isStarted, winner, categoryCycle } = gameState;
  
  // Default category cycle order: Object -> Action -> Wildcard -> World -> Person -> Random -> Nature
  // Colors: Object (Light Blue), Action (Orange), Wildcard (White), World (Navy Blue), Person (Yellow), Random (Red), Nature (Green)
  const cycle = categoryCycle || ['Object', 'Action', 'Wildcard', 'World', 'Person', 'Random', 'Nature'];

  const getCategoryForPosition = (position) => {
    if (position >= board.totalSpaces) return null;
    // Each position cycles through categories: 0=Object, 1=Action, 2=Random, 3=World, 4=Person, 5=Nature, 6=Object, etc.
    const categoryIndex = position % cycle.length;
    return cycle[categoryIndex];
  };

  const getSpaceTypeForPosition = (position, board) => {
    if (position >= board.totalSpaces) return 'finish';
    if (board.spadeSpaces.includes(position)) return 'spade';
    if (board.spinnerSpaces.includes(position)) return 'spinner';
    return 'normal';
  };

  const renderBoard = () => {
    const spaces = [];
    const totalSpaces = board.totalSpaces;

    for (let i = 0; i <= totalSpaces; i++) {
      const spaceType = getSpaceTypeForPosition(i, board);
      
      // Use modulo to determine color based on category cycle position
      // Each category gets 10 spaces: 0-9, 10-19, 20-29, etc.
      let color = '#CCCCCC';
      if (i === totalSpaces) {
        color = '#FFD700'; // Gold for finish
      } else if (spaceType === 'spade') {
        color = 'white'; // White for spade spaces
      } else if (spaceType === 'spinner') {
        color = '#FF9800'; // Orange for spinner spaces
      } else {
        // Use modulo to cycle through categories: 0=Object, 1=Action, 2=Random, 3=World, 4=Person, 5=Nature, 6=Object, etc.
        const categoryIndex = i % cycle.length;
        const category = cycle[categoryIndex];
        color = board.categoryColors[category] || '#CCCCCC';
      }
      
      const category = getCategoryForPosition(i);
      
      const teamPieces = teams.filter(team => team.position === i);
      
      spaces.push(
        <div
          key={i}
          className={`board-space ${spaceType} ${i === totalSpaces ? 'finish' : ''}`}
          style={{ backgroundColor: color }}
          title={`${category} - Position ${i}`}
        >
          {i === 0 && <span className="start-label">START</span>}
          {i === totalSpaces && <span className="finish-label">FINISH</span>}
          {spaceType === 'spade' && <span className="spade-icon">♠</span>}
          {spaceType === 'spinner' && <span className="spinner-icon">⟲</span>}
          {teamPieces.map(team => (
            <div
              key={team.index}
              className={`team-piece team-${team.index} ${team.index === currentTeamIndex ? 'current' : ''}`}
              title={team.name}
            >
              {team.index + 1}
            </div>
          ))}
        </div>
      );
    }

    return spaces;
  };

  return (
    <div className="game-board-container">
      <div className="board-header">
        <h2>Game Board</h2>
        {!isStarted && !winner && (
          <button onClick={onStartGame} className="start-game-btn">
            Start Game
          </button>
        )}
        {winner && (
          <div className="winner-announcement">
            🎉 {winner.name} Wins! 🎉
          </div>
        )}
      </div>
      
      <div className="board-wrapper">
        <div className="board-track">
          {renderBoard()}
        </div>
      </div>

      <div className="teams-status">
        {teams.map((team, index) => (
          <div
            key={team.index}
            className={`team-status ${index === currentTeamIndex ? 'current' : ''}`}
          >
            <div className="team-name">{team.name}</div>
            <div className="team-position">Position: {team.position}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameBoard;

