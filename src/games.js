function generateDeck(size = 52) {
  const cards = [];
  for (let i = 0; i < size; ++i) {
    cards.push({
      position: { x: 10 + i * 3, y: 10 + i * 5 }
    });
  }
  return cards;
}

function convertToRuntimeModel(game) {
  const tokens = {};
  let tokenId = 1;
  game.tokens.forEach((token) => {
    const newToken = {
      ...token,
      type: 'card'
    };
    newToken.id = tokenId++;
    newToken.zindex = newToken.id;
    tokens[newToken.id] = newToken;
  });
  const newGame = { ...game };
  newGame.tokens = tokens;
  newGame.players = {};
  return newGame;
}

module.exports = [
  {
    name: '52 Cards',
    tokens: generateDeck()
  },
  {
    name: 'Chess',
    tokens: [{ position: { x: 500, y: 100 } }, { position: { x: 10, y: 100 } }]
  }
].map(convertToRuntimeModel);
