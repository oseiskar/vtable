function generateDeck(size = 52) {
  const cards = [];
  for (let i = 0; i < size; ++i) {
    cards.push({
      id: i + 1,
      position: { x: 10 + i * 3, y: 10 + i * 5 }
    });
  }
  return cards;
}

module.exports = [
  {
    name: '52 Cards',
    tokens: generateDeck()
  },
  {
    name: 'Chess',
    tokens: [{ id: 2, position: { x: 500, y: 100 } }, { id: 1, position: { x: 10, y: 100 } }]
  }
];
