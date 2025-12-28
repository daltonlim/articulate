import Board from './Board';
import Team from './Team';
import Card from './Card';

class Game {
  constructor(gameId, teamNames, words, turnDuration = 30000) {
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
    this.turnDuration = turnDuration; // Timer duration in milliseconds (default 30 seconds)
    this.pendingSpinner = null; // Track if spinner should be shown (team index and landing position)
    this.spinnerResult = null; // Store the result of the spinner spin
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
      
      // Check if landing position triggers spinner (Orange/Action or Red/Random)
      const landingCategory = this.getCategoryAtPosition(newPosition);
      if (landingCategory === 'Action' || landingCategory === 'Random') {
        // Trigger spinner - store team index and position
        this.pendingSpinner = {
          teamIndex: this.currentTeamIndex,
          landingPosition: newPosition
        };
        // Don't advance to next team yet - wait for spinner to be resolved
      } else {
        // No spinner, proceed normally
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
    }
    
    this.currentTurn = null;
    this.currentCard = null;
  }

  getCategoryAtPosition(position) {
    if (position >= this.board.totalSpaces) return null;
    const categoryIndex = position % this.categoryCycle.length;
    return this.categoryCycle[categoryIndex];
  }

  spinSpinner() {
    if (!this.pendingSpinner) return null;
    
    const teamIndex = this.pendingSpinner.teamIndex;
    const currentTeam = this.teams[teamIndex];
    
    // Spinner segments (matching physical spinner design):
    // - Wide Green: 2 spaces (~37.5% chance, ~3/8 of circle)
    // - Narrow Green: 3 spaces (~12.5% chance, ~1/8 of circle)
    // - Orange/Red: No bonus (~50% chance, ~1/2 of circle)
    const random = Math.random();
    let result;
    
    if (random < 0.375) {
      // Wide Green Segment - 2 spaces
      result = { type: 'wide-green', spaces: 2 };
    } else if (random < 0.5) {
      // Narrow Green Segment - 3 spaces
      result = { type: 'narrow-green', spaces: 3 };
    } else {
      // Orange or Red Segment - No bonus
      result = { type: 'no-bonus', spaces: 0 };
    }
    
    this.spinnerResult = result;
    return result;
  }

  handleSpinnerChoice(choice) {
    // choice: 'forward' or 'backward'
    if (!this.pendingSpinner || !this.spinnerResult) return;
    
    const teamIndex = this.pendingSpinner.teamIndex;
    const currentTeam = this.teams[teamIndex];
    
    // If no bonus, just end the spinner
    if (this.spinnerResult.type === 'no-bonus') {
      this.pendingSpinner = null;
      this.spinnerResult = null;
      
      // Move to next team in normal rotation (advance from the team that used the spinner)
      if (this.isBonusTurn && this.nextTeamAfterBonus !== null) {
        this.currentTeamIndex = this.nextTeamAfterBonus;
        this.isBonusTurn = false;
        this.nextTeamAfterBonus = null;
      } else {
        // Advance from the team that used the spinner
        this.currentTeamIndex = (teamIndex + 1) % this.teams.length;
      }
      return;
    }
    
    const spaces = this.spinnerResult.spaces;
    const landingPosition = this.pendingSpinner.landingPosition;
    
    if (choice === 'forward') {
      // Move own team forward
      const newPosition = Math.min(landingPosition + spaces, this.board.totalSpaces);
      currentTeam.position = newPosition;
      
      // Check if reached finish
      if (newPosition >= this.board.totalSpaces) {
        // Team wins if they got at least one word in their turn
        // (We can't check this here, so we'll let them continue)
        currentTeam.position = this.board.totalSpaces;
      }
      
      // Advance category
      currentTeam.currentCategoryIndex = (currentTeam.currentCategoryIndex + spaces) % this.categoryCycle.length;
      
      // No chain rule: Even if new position is Orange/Red, no additional spin
    } else if (choice === 'backward') {
      // Move an opponent backward
      // Find the opponent with highest position (usually the leader)
      let opponentToMove = null;
      let maxPosition = -1;
      
      for (let i = 0; i < this.teams.length; i++) {
        if (i !== teamIndex && this.teams[i].position > maxPosition) {
          maxPosition = this.teams[i].position;
          opponentToMove = this.teams[i];
        }
      }
      
      if (opponentToMove) {
        // Can't move opponent back past Start (position 0)
        const newPosition = Math.max(0, opponentToMove.position - spaces);
        opponentToMove.position = newPosition;
        
        // Adjust category index for opponent (moving backward)
        // This is a bit tricky - we'll just recalculate based on position
        opponentToMove.currentCategoryIndex = newPosition % this.categoryCycle.length;
      }
    }
    
    // Clear spinner state
    this.pendingSpinner = null;
    this.spinnerResult = null;
    
    // Move to next team in normal rotation (advance from the team that used the spinner)
    if (this.isBonusTurn && this.nextTeamAfterBonus !== null) {
      this.currentTeamIndex = this.nextTeamAfterBonus;
      this.isBonusTurn = false;
      this.nextTeamAfterBonus = null;
    } else {
      // Advance from the team that used the spinner
      this.currentTeamIndex = (teamIndex + 1) % this.teams.length;
    }
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
      turnDuration: this.turnDuration,
      categoryCycle: this.categoryCycle,
      pendingSpinner: this.pendingSpinner,
      spinnerResult: this.spinnerResult
    };
  }
}

export default Game;

