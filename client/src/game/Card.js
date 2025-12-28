class Card {
  constructor(category, word) {
    this.category = category;
    this.word = word;
  }

  getState() {
    return {
      category: this.category,
      word: this.word
    };
  }
}

export default Card;

