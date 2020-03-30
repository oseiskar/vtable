const defaults = {
  x0: 100,
  y0: 100,
  boardW: 600,
  boardH: 600
};

function generateDeck({
  x0, y0, size = 52, dx = 2, dy = 3
} = defaults) {
  const cards = [];
  for (let i = 0; i < size; ++i) {
    cards.push({
      position: { x: x0 + i * dx, y: y0 + i * dy },
      type: 'card'
    });
  }
  return {
    name: '52 Cards',
    tokens: cards
  };
}

function generateChess({
  x0, y0, boardW
} = defaults) {
  const pieces = [];
  const addPiece = (col, row, text) => {
    const s = boardW / 8;
    pieces.push({
      type: 'symbol',
      text,
      _style: {
        'font-size': `${s}px`,
        'line-height': `${s}px`
      },
      position: {
        x: col * s,
        y: row * s
      }
    });
  };

  [['black', 0, 1], ['white', 7, 6]].forEach(([color, back, front]) => {
    const b = color === 'black';
    addPiece(0, back, b ? '♜' : '♖');
    addPiece(1, back, b ? '♞' : '♘');
    addPiece(2, back, b ? '♝' : '♗');
    addPiece(3, back, b ? '♛' : '♕');
    addPiece(4, back, b ? '♚' : '♔');
    addPiece(5, back, b ? '♝' : '♗');
    addPiece(6, back, b ? '♞' : '♘');
    addPiece(7, back, b ? '♜' : '♖');
    for (let col = 0; col < 8; ++col) addPiece(col, front, b ? '♟' : '♙');
  });

  return {
    name: 'Chess',
    tokens: pieces,
    board: {
      _style: {
        background: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAAAAADhZOFXAAAAE0lEQVQI12M4/R8CGaD0aQayRAANwDlBHsu/3AAAAABJRU5ErkJggg==')",
        'image-rendering': 'crisp-edges',
        'background-repeat': 'no-repeat',
        'background-size': 'cover'
      },
      dimensions: {
        x0,
        y0,
        width: boardW,
        height: boardW
      }
    }
  };
}

function convertToRuntimeModel(game) {
  const tokens = {};
  let tokenId = 1;
  game.tokens.forEach((token) => {
    const newToken = {
      ...token
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
  generateDeck(),
  generateChess()
].map(convertToRuntimeModel);
