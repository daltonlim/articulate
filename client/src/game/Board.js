class Board {
  constructor() {
    this.totalSpaces = 60; // Total spaces on the board
    // Category cycle order: Object -> Action -> Wildcard -> World -> Person -> Random -> Nature
    this.categories = ['Object', 'Action', 'Wildcard', 'World', 'Person', 'Random', 'Nature'];
    this.categoryColors = {
      'Object': '#64B5F6',      // Light Blue
      'Action': '#FF9800',      // Orange
      'Wildcard': '#FFFFFF',    // White (Spades)
      'World': '#1976D2',       // Navy Blue
      'Person': '#FFEB3B',      // Yellow
      'Random': '#F44336',      // Red
      'Nature': '#4CAF50'       // Green
    };
    
    this.finishSpace = this.totalSpaces;
  }

  getCategoryAtPosition(position) {
    if (position >= this.totalSpaces) return null;
    // Cycle through categories per space in order: Object -> Action -> Wildcard -> World -> Person -> Random -> Nature
    const categoryIndex = position % this.categories.length;
    return this.categories[categoryIndex];
  }

  getColorAtPosition(position) {
    const category = this.getCategoryAtPosition(position);
    return this.categoryColors[category] || '#CCCCCC';
  }

  getState() {
    return {
      totalSpaces: this.totalSpaces,
      categories: this.categories,
      categoryColors: this.categoryColors,
      finishSpace: this.finishSpace
    };
  }
}

export default Board;


