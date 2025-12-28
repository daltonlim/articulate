class Board {
  constructor() {
    this.totalSpaces = 60; // Total spaces on the board
    this.categories = ['Object', 'Nature', 'Random', 'Person', 'Action', 'World'];
    this.categoryColors = {
      'Object': '#64B5F6',      // Light Blue
      'Action': '#FF9800',      // Orange
      'Wildcard': '#FFFFFF',    // White (Spades)
      'Random': '#F44336',      // Red
      'World': '#1976D2',       // Navy Blue
      'Person': '#FFEB3B',      // Yellow
      'Nature': '#4CAF50'       // Green
    };
    
    // Define special spaces
    this.spadeSpaces = [5, 15, 25, 35, 45, 55]; // White/Spade spaces
    this.spinnerSpaces = [10, 20, 30, 40, 50]; // Orange/Spinner spaces
    this.finishSpace = this.totalSpaces;
  }

  getCategoryAtPosition(position) {
    if (position >= this.totalSpaces) return null;
    // Each category gets 10 spaces in rotation
    const categoryIndex = Math.floor(position / 10) % this.categories.length;
    return this.categories[categoryIndex];
  }

  getSpaceTypeAtPosition(position) {
    if (position >= this.totalSpaces) return 'finish';
    if (this.spadeSpaces.includes(position)) return 'spade';
    if (this.spinnerSpaces.includes(position)) return 'spinner';
    return 'normal';
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
      spadeSpaces: this.spadeSpaces,
      spinnerSpaces: this.spinnerSpaces,
      finishSpace: this.finishSpace
    };
  }
}

module.exports = Board;

