import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameBoard from './components/GameBoard';
import GameSetup from './components/GameSetup';
import GamePlay from './components/GamePlay';
import Game from './game/Game';
import './App.css';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3011', {
  autoConnect: false,
  reconnection: false
});

function App() {
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useServer, setUseServer] = useState(false);
  const [localGame, setLocalGame] = useState(null);
  const [words, setWords] = useState(null);

  // Load words.json
  useEffect(() => {
    fetch('/words.json')
      .then(response => response.json())
      .then(data => setWords(data))
      .catch(error => {
        console.error('Failed to load words.json:', error);
        alert('Failed to load words. Please ensure words.json is in the public folder.');
      });
  }, []);

  // Try to connect to server, but allow offline play
  useEffect(() => {
    // Try to connect to server
    socket.connect();
    
    socket.on('connect', () => {
      setIsConnected(true);
      setUseServer(true);
      console.log('Connected to server');
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setUseServer(false);
      console.log('Server not available, using local mode');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setUseServer(false);
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
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('game-created');
      socket.off('game-joined');
      socket.off('game-updated');
      socket.off('error');
    };
  }, []);

  // Helper function to update game state for local games
  const updateLocalGameState = () => {
    if (localGame && !useServer) {
      setGameState(localGame.getState());
    }
  };

  const createGame = (teamNames, turnDuration) => {
    if (useServer && isConnected) {
      socket.emit('create-game', { teamNames, turnDuration });
    } else {
      // Create local game
      if (!words) {
        alert('Words not loaded yet. Please wait...');
        return;
      }
      const gameId = Math.random().toString(36).substring(2, 9).toUpperCase();
      const game = new Game(gameId, teamNames, words, turnDuration * 1000);
      setLocalGame(game);
      setGameId(gameId);
      setGameState(game.getState());
    }
  };

  const joinGame = (gameIdToJoin) => {
    if (useServer && isConnected) {
      socket.emit('join-game', { gameId: gameIdToJoin });
      setGameId(gameIdToJoin);
    } else {
      alert('Server mode required to join games. Please start a new game in local mode.');
    }
  };

  const startGame = () => {
    if (useServer && isConnected) {
      socket.emit('start-game', { gameId });
    } else if (localGame) {
      localGame.start();
      updateLocalGameState();
    }
  };

  const startTurn = () => {
    if (useServer && isConnected) {
      socket.emit('start-turn', { gameId });
    } else if (localGame) {
      localGame.startTurn();
      updateLocalGameState();
    }
  };

  const handleCorrectGuess = () => {
    if (useServer && isConnected) {
      socket.emit('correct-guess', { gameId });
    } else if (localGame) {
      localGame.handleCorrectGuess();
      updateLocalGameState();
    }
  };

  const handlePass = () => {
    if (useServer && isConnected) {
      socket.emit('pass-word', { gameId });
    } else if (localGame) {
      localGame.passWord();
      updateLocalGameState();
    }
  };

  const endTurn = (correctCount) => {
    if (useServer && isConnected) {
      socket.emit('end-turn', { gameId, correctCount });
    } else if (localGame) {
      localGame.endTurn(correctCount);
      updateLocalGameState();
    }
  };

  const spinSpinner = () => {
    if (useServer && isConnected) {
      socket.emit('spin-spinner', { gameId });
    } else if (localGame) {
      localGame.spinSpinner();
      updateLocalGameState();
    }
  };

  const drawSpadeCard = () => {
    if (useServer && isConnected) {
      socket.emit('draw-spade-card', { gameId });
    } else if (localGame) {
      localGame.drawSpadeCard();
      updateLocalGameState();
    }
  };

  const handleSpade = (winningTeamIndex) => {
    if (useServer && isConnected) {
      socket.emit('handle-spade', { gameId, winningTeamIndex });
    } else if (localGame) {
      localGame.handleSpade(winningTeamIndex);
      updateLocalGameState();
    }
  };

  const handleSpinnerChoice = (choice) => {
    if (useServer && isConnected) {
      socket.emit('handle-spinner-choice', { gameId, choice });
    } else if (localGame) {
      localGame.handleSpinnerChoice(choice);
      updateLocalGameState();
    }
  };

  if (!gameState) {
    return (
      <div className="App">
        <GameSetup 
          onCreateGame={createGame}
          onJoinGame={joinGame}
          isConnected={isConnected || !useServer}
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
          onHandleSpinnerChoice={handleSpinnerChoice}
        />
      </div>
    </div>
  );
}

export default App;

