import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameBoard from './components/GameBoard';
import GameSetup from './components/GameSetup';
import GamePlay from './components/GamePlay';
import './App.css';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3011');

function App() {
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('game-created', (data) => {
      setGameId(data.gameId);
      setGameState(data.gameState);
    });

    socket.on('game-joined', (data) => {
      setGameState(data.gameState);
    });

    socket.on('game-updated', (data) => {
      setGameState(data.gameState);
    });

    socket.on('error', (data) => {
      console.error('Game error:', data.message);
      alert(data.message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game-created');
      socket.off('game-joined');
      socket.off('game-updated');
      socket.off('error');
    };
  }, []);

  const createGame = (teamNames, turnDuration) => {
    socket.emit('create-game', { teamNames, turnDuration });
  };

  const joinGame = (gameIdToJoin) => {
    socket.emit('join-game', { gameId: gameIdToJoin });
    setGameId(gameIdToJoin);
  };

  const startGame = () => {
    socket.emit('start-game', { gameId });
  };

  const startTurn = () => {
    socket.emit('start-turn', { gameId });
  };

  const handleCorrectGuess = () => {
    socket.emit('correct-guess', { gameId });
  };

  const handlePass = () => {
    socket.emit('pass-word', { gameId });
  };

  const endTurn = (correctCount) => {
    socket.emit('end-turn', { gameId, correctCount });
  };

  const spinSpinner = () => {
    socket.emit('spin-spinner', { gameId });
  };

  const drawSpadeCard = () => {
    socket.emit('draw-spade-card', { gameId });
  };

  const handleSpade = (winningTeamIndex) => {
    socket.emit('handle-spade', { gameId, winningTeamIndex });
  };

  if (!gameState) {
    return (
      <div className="App">
        <GameSetup 
          onCreateGame={createGame}
          onJoinGame={joinGame}
          isConnected={isConnected}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <div className="game-container">
        <GameBoard 
          gameState={gameState}
          onStartGame={startGame}
          onStartTurn={startTurn}
          onCorrectGuess={handleCorrectGuess}
          onPass={handlePass}
          onEndTurn={endTurn}
          onSpinSpinner={spinSpinner}
          onDrawSpadeCard={drawSpadeCard}
          onHandleSpade={handleSpade}
        />
        <GamePlay 
          gameState={gameState}
          gameId={gameId}
          onStartTurn={startTurn}
          onCorrectGuess={handleCorrectGuess}
          onPass={handlePass}
          onEndTurn={endTurn}
          onSpinSpinner={spinSpinner}
          onDrawSpadeCard={drawSpadeCard}
          onHandleSpade={handleSpade}
        />
      </div>
    </div>
  );
}

export default App;

