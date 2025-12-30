class Team {
  constructor(index, name) {
    this.index = index;
    this.name = name;
    this.position = 0; // Start at position 0
    this.score = 0;
    this.currentCategoryIndex = 0; // Track position in category cycle
  }

  move(spaces) {
    this.position = Math.max(0, Math.min(this.position + spaces, 60));
  }

  getState() {
    return {
      index: this.index,
      name: this.name,
      position: this.position,
      score: this.score,
      currentCategoryIndex: this.currentCategoryIndex
    };
  }
}

export default Team;


