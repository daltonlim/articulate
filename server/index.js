const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const Game = require('./game/Game');
const words = require('../words.json');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active games
const games = new Map();

// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// API Routes
app.get('/api/words', (req, res) => {
  res.json(words);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-game', (data) => {
    const gameId = generateGameId();
    const turnDuration = data.turnDuration ? parseInt(data.turnDuration, 10) * 1000 : 30000; // Convert seconds to milliseconds
    const game = new Game(gameId, data.teamNames || ['Team 1', 'Team 2'], words, turnDuration);
    games.set(gameId, game);
    socket.join(gameId);
    socket.emit('game-created', { gameId, gameState: game.getState() });
    console.log(`Game created: ${gameId}`);
  });

  socket.on('join-game', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    socket.join(gameId);
    socket.emit('game-joined', { gameState: game.getState() });
    io.to(gameId).emit('game-updated', { gameState: game.getState() });
  });

  socket.on('start-game', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.start();
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('start-turn', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.startTurn();
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('correct-guess', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.handleCorrectGuess();
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('pass-word', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.passWord();
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('end-turn', (data) => {
    const { gameId, correctCount } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.endTurn(correctCount);
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('spin-spinner', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      const result = game.spinSpinner();
      io.to(gameId).emit('game-updated', { gameState: game.getState(), spinResult: result });
    }
  });

  socket.on('handle-spinner-choice', (data) => {
    const { gameId, choice } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.handleSpinnerChoice(choice);
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('draw-spade-card', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.drawSpadeCard();
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('handle-spade', (data) => {
    const { gameId, winningTeamIndex } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.handleSpade(winningTeamIndex);
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('control-turn-guess', (data) => {
    const { gameId, guessingTeamIndex } = data;
    const game = games.get(gameId);
    
    if (game) {
      const result = game.handleControlTurnGuess(guessingTeamIndex);
      io.to(gameId).emit('game-updated', { gameState: game.getState(), controlTurnResult: result });
    }
  });

  socket.on('control-turn-pass', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.handleControlTurnPass();
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('reroll-control-card', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (game) {
      game.rerollControlCard();
      io.to(gameId).emit('game-updated', { gameState: game.getState() });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

function generateGameId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

const PORT = process.env.PORT || 3011;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

