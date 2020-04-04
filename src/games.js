const defaults = {
  boardW: 600,
  boardH: 600
};

function generateDeck({ x0 = 100, y0 = 100 } = defaults) {
  const cards = [];
  function pushCard(text, color) {
    cards.push({
      text,
      type: 'card',
      faceDown: true,
      dimensions: {
        width: 64 * 2,
        height: 89 * 2
      },
      style: {
        color,
        padding: '20px'
      },
      back: {
        style: {
          background: '#ee8080',
          border: '2px solid gray'
        }
      },
      stackId: 1
    });
  }

  [
    ['♥', 'red'],
    ['♠', 'black'],
    ['♦', 'red'],
    ['♣', 'black']
  ].forEach(([suit, color]) => {
    ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Kn', 'Q', 'K', 'A'].forEach((rank) => {
      pushCard(`${suit} ${rank}`, color);
    });
  });

  return {
    name: '52-card deck',
    tokens: cards,
    stacks: {
      1: {
        id: 1,
        position: {
          x: x0,
          y: y0
        }
      }
    }
  };
}

function generateChessboardBackground({ white = 'white', black = '#bbbbbb' } = {}) {
  let tiles = '';
  for (let y = 0; y < 8; ++y) {
    for (let x = 0; x < 8; ++x) {
      const color = ((x + y) % 2) ? black : white;
      tiles += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">${tiles}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function generateChess({ boardW } = defaults) {
  const pieces = [];
  const addPiece = (col, row, text) => {
    const s = boardW / 8;
    pieces.push({
      type: 'symbol',
      text,
      style: {
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
        'background-image': `url('${generateChessboardBackground()}')`,
        'background-repeat': 'no-repeat',
        'background-size': 'cover'
      },
      dimensions: {
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
    newToken.stackPosition = newToken.id;
    tokens[newToken.id] = newToken;
    const stack = game.stacks[newToken.stackId];
    stack.zindex = newToken.id;
  });

  const newGame = { ...game };
  newGame.tokens = tokens;
  newGame.players = {};
  return newGame;
}

function stackEachSeparately(game) {
  const newGame = { ...game };
  let stackId = 1;
  const stacks = {};
  newGame.tokens.forEach((token0) => {
    const token = token0;
    token.stackId = stackId++;
    token.stackPosition = 1;
    const { position } = token;
    delete token.position;
    stacks[token.stackId] = {
      position,
      id: token.stackId
    };
  });
  newGame.stacks = stacks;
  return newGame;
}

module.exports = [
  generateDeck(),
  stackEachSeparately(generateChess())
].map(convertToRuntimeModel);
