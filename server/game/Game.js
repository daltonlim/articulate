const Board = require('./Board');
const Team = require('./Team');
const Card = require('./Card');

class Game {
  constructor(gameId, teamNames, words) {
    this.gameId = gameId;
    this.words = words;
    this.board = new Board();
    this.teams = teamNames.map((name, index) => new Team(index, name));
    this.currentTeamIndex = 0;
    this.currentTurn = null;
    this.isStarted = false;
    this.winner = null;
    this.currentCard = null;
    this.spadeCard = null; // Card for spade/wildcard space
    this.isBonusTurn = false; // Track if current turn is a bonus turn from spade
    this.nextTeamAfterBonus = null; // Track which team should play after bonus turn
    this.turnStartTime = null;
    this.turnDuration = 30000; // 30 seconds in milliseconds
    // Category cycle order: Object -> Action -> Wildcard -> World -> Person -> Random -> Nature
    // Wildcard picks any random word from any category
    this.categoryCycle = ['Object', 'Action', 'Wildcard', 'World', 'Person', 'Random', 'Nature'];
  }

  start() {
    this.isStarted = true;
    this.currentTeamIndex = 0;
    // All teams start at position 0 and begin with Object category (index 0)
    this.teams.forEach(team => {
      team.position = 0;
      team.currentCategoryIndex = 0; // Start with Object
    });
  }

  startTurn() {
    if (!this.isStarted) return;
    
    const currentTeam = this.teams[this.currentTeamIndex];
    // Use the team's current category from the cycle, not board position
    const currentCategory = this.categoryCycle[currentTeam.currentCategoryIndex];
    
    this.currentCard = this.drawCard(currentCategory);
    this.turnStartTime = Date.now();
    this.currentTurn = {
      teamIndex: this.currentTeamIndex,
      category: currentCategory,
      correctCount: 0,
      passedCount: 0,
      startTime: this.turnStartTime
    };
  }

  drawCard(category) {
    // Wildcard picks a random word from any category
    if (category === 'Wildcard') {
      // Get all categories except Wildcard
      const allCategories = Object.keys(this.words).filter(cat => cat !== 'Wildcard');
      // Pick a random category
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
      const wordsInCategory = this.words[randomCategory] || [];
      if (wordsInCategory.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * wordsInCategory.length);
      return new Card(category, wordsInCategory[randomIndex]);
    }
    
    // Regular categories use their own words
    const wordsInCategory = this.words[category] || [];
    if (wordsInCategory.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * wordsInCategory.length);
    return new Card(category, wordsInCategory[randomIndex]);
  }

  handleCorrectGuess() {
    if (!this.currentTurn) return;
    
    this.currentTurn.correctCount++;
    // Draw a new card for the same category (use the turn's category)
    const currentCategory = this.currentTurn.category;
    this.currentCard = this.drawCard(currentCategory);
  }

  passWord() {
    if (!this.currentTurn) return;
    
    this.currentTurn.passedCount++;
    // Draw a new card for the same category (use the turn's category)
    const currentCategory = this.currentTurn.category;
    this.currentCard = this.drawCard(currentCategory);
  }

  endTurn(correctCount) {
    if (!this.currentTurn) return;
    
    const currentTeam = this.teams[this.currentTeamIndex];
    
    // Use the correct count from the turn if not provided
    const moves = correctCount !== undefined ? correctCount : this.currentTurn.correctCount;
    
    // Move the team forward on the board
    const newPosition = currentTeam.position + moves;
    
    // Advance category in cycle by the number of correct answers
    // If they got 3 correct, advance 3 positions in the cycle
    currentTeam.currentCategoryIndex = (currentTeam.currentCategoryIndex + moves) % this.categoryCycle.length;
    
    // Check if team reached or passed finish
    if (newPosition >= this.board.totalSpaces) {
      // Team must successfully describe at least one word to win
      if (moves > 0) {
        this.winner = currentTeam;
        this.isStarted = false;
        currentTeam.position = this.board.totalSpaces;
      } else {
        // They reached finish but didn't get any words - stay at finish, try again next turn
        currentTeam.position = this.board.totalSpaces;
        this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
      }
    } else {
      currentTeam.position = newPosition;
      
      // If this was a bonus turn, move to the next team after bonus
      // Otherwise, move to next team in normal rotation
      if (this.isBonusTurn && this.nextTeamAfterBonus !== null) {
        this.currentTeamIndex = this.nextTeamAfterBonus;
        this.isBonusTurn = false;
        this.nextTeamAfterBonus = null;
      } else {
        // Move to next team in normal rotation
        this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
      }
    }
    
    this.currentTurn = null;
    this.currentCard = null;
  }

  spinSpinner() {
    const currentTeam = this.teams[this.currentTeamIndex];
    const spinResult = Math.random() < 0.5 ? 'wide' : 'narrow';
    const spaces = 2 + Math.floor(Math.random() * 2); // 2 or 3 spaces
    
    if (spinResult === 'wide') {
      // Move own team forward
      currentTeam.position = Math.min(
        currentTeam.position + spaces,
        this.board.totalSpaces
      );
    } else {
      // Move opponent backward
      const opponentIndex = (this.currentTeamIndex + 1) % this.teams.length;
      const opponent = this.teams[opponentIndex];
      opponent.position = Math.max(0, opponent.position - spaces);
    }
    
    return { type: spinResult, spaces };
  }

  drawSpadeCard() {
    // Draw a random word for the spade/wildcard space
    this.spadeCard = this.drawCard('Wildcard');
  }

  handleSpade(winningTeamIndex) {
    // If winningTeamIndex is null/undefined, skip (no team wins)
    if (winningTeamIndex !== null && winningTeamIndex !== undefined) {
      // The winning team gets a bonus turn (no position advancement)
      // After the bonus turn, continue with the next team in rotation
      // (currentTeamIndex is already the next team after the one that landed on spade)
      this.nextTeamAfterBonus = this.currentTeamIndex;
      this.isBonusTurn = true;
      this.currentTeamIndex = winningTeamIndex;
    }
    
    // Clear the spade card after handling
    this.spadeCard = null;
  }

  getState() {
    return {
      gameId: this.gameId,
      board: this.board.getState(),
      teams: this.teams.map(team => {
        const teamState = team.getState();
        // Add the next category for each team
        teamState.nextCategory = this.categoryCycle[team.currentCategoryIndex];
        return teamState;
      }),
      currentTeamIndex: this.currentTeamIndex,
      currentTurn: this.currentTurn,
      currentCard: this.currentCard ? this.currentCard.getState() : null,
      spadeCard: this.spadeCard ? this.spadeCard.getState() : null,
      isBonusTurn: this.isBonusTurn,
      isStarted: this.isStarted,
      winner: this.winner ? this.winner.getState() : null,
      turnTimeRemaining: this.turnStartTime 
        ? Math.max(0, this.turnDuration - (Date.now() - this.turnStartTime))
        : null,
      categoryCycle: this.categoryCycle
    };
  }
}

module.exports = Game;

