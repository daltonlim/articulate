# Articulate! Board Game - Web Edition

A web-based implementation of the popular Articulate! board game using Node.js, Express, Socket.io, and React.

## Features

- 🎯 Real-time multiplayer gameplay
- 🎨 Beautiful, modern UI with color-coded categories
- ⏱️ 30-second timer for each turn
- 🎲 Special spaces: Spade (Free-for-All) and Spinner spaces
- 📱 Responsive design for desktop and mobile
- 🔄 Real-time game state synchronization

## Game Rules

### Core Mechanics
- Teams take turns describing words to their teammates
- Each turn lasts 30 seconds
- Teams move forward based on the number of correct guesses
- First team to reach the Finish space wins

### Categories
- **Object**: Physical items (e.g., "Toaster")
- **Nature**: Animals, plants, geological features (e.g., "Glacier")
- **Random**: Abstract concepts or verbs (e.g., "Confusion")
- **Person**: Famous figures, fictional characters, professions (e.g., "Elvis")
- **Action**: Verbs or activities (e.g., "Swimming")
- **World**: Places, landmarks, nationalities (e.g., "London")

### The Golden Rules (No Cheating!)
- ❌ No "sounds like" or rhymes
- ❌ No "starts with" or letter clues
- ❌ No parts of the word
- ❌ No translations

### Special Spaces
- **Spade Spaces**: Free-for-All round - describer describes to everyone, first team to guess wins
- **Spinner Spaces**: Spin to move forward 2-3 spaces or move an opponent back 2-3 spaces

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Install server dependencies:**
```bash
npm install
```

2. **Install client dependencies:**
```bash
cd client
npm install
cd ..
```

## Running the Application

### Development Mode

Run both server and client concurrently:
```bash
npm run dev
```

Or run them separately:

**Terminal 1 - Server:**
```bash
npm run server
```

**Terminal 2 - Client:**
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Mode

1. Build the React app:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The application will be available at http://localhost:3001

## How to Play

1. **Create or Join a Game**
   - Create a new game with 2+ teams
   - Or join an existing game using the Game ID

2. **Start the Game**
   - Click "Start Game" once all players are ready

3. **Take Your Turn**
   - Click "Start Turn" when it's your team's turn
   - Describe the word shown on the card to your teammates
   - Click "✓ Correct" when they guess correctly
   - Click "Pass" if you want to skip a word
   - Click "End Turn" when the timer runs out or you're done

4. **Special Spaces**
   - If you land on a Spade space, a Free-for-All round begins
   - If you land on a Spinner space, you can spin to move forward or move an opponent back

5. **Win the Game**
   - Be the first team to reach the Finish space!

## Project Structure

```
articulate-game/
├── server/
│   ├── index.js          # Express server and Socket.io setup
│   └── game/
│       ├── Game.js       # Main game logic
│       ├── Board.js      # Board and space management
│       ├── Team.js       # Team management
│       └── Card.js       # Card representation
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameSetup.js    # Game creation/joining
│   │   │   ├── GameBoard.js    # Visual board display
│   │   │   └── GamePlay.js     # Turn management and gameplay
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── words.json            # Word database by category
└── package.json
```

## Technologies Used

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React, CSS3
- **Real-time Communication**: WebSockets (Socket.io)

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!


