const io = require('socket.io-client');
const localStore = require('./store-vue.js');

function openConnection(gameId) {
  return new Promise((resolve, reject) => {
    const socket = io.connect();
    socket.on('connect', () => {
      socket.emit('join', gameId);
      resolve(socket);
    });
    socket.on('connect_failed', () => reject(new Error('Connection failed')));
  });
}

function wsError(msg) {
  alert(`${msg}, please check your internet connection and reload the page`);
}

module.exports = (playerId, originalInitialState, gameId) => openConnection(gameId)
  .then((sock) => {
    const socket = sock;
    return new Promise((resolve, reject) => {
      let store;
      if (originalInitialState) {
        const initialStateWithId = { ...originalInitialState, id: gameId };
        store = localStore(initialStateWithId);
        socket.emit('gameMsg', { initialState: initialStateWithId });
      }

      socket.on('gameMsg', ({ mutation, error, initialState }) => {
        if (initialState) {
          if (store) {
            console.log('ignoring initial state: already initialized');
          } else {
            console.log('initializing with remote state');
            const { game } = initialState;
            store = localStore(game);
            resolve(store);
          }
        }
        if (mutation) {
          if (!store) return reject(new Error('not initialized'));
          const { type, payload } = mutation;
          store.commit(type, payload);
        }
        if (error) {
          wsError(`Error: ${error}`);
        }
        return null;
      });

      // TODO: which one, or both?
      socket.on('disconnect', () => wsError('Connection lost'));
      socket.on('reconnect_failed', () => wsError('Connection lost'));
      socket.on('error', wsError);

      if (store) resolve(store);
    }).then((s) => {
      const store = s;
      store.commitTagged = (type, payload) => {
        // store.commit(type, payload);
        socket.emit('gameMsg', { mutation: { type, payload } });
      };
      return store;
    });
  });
