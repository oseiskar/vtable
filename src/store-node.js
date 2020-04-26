const io = require('socket.io-client');
const localStore = require('./store-vue.js');

function openConnection(gameId) {
  return new Promise((resolve, reject) => {
    const socket = io(window.location.href, { reconnectionAttempts: 4 });
    socket.on('connect', () => {
      socket.emit('join', gameId);
      resolve(socket);
    });
    socket.on('connect_failed', () => reject(new Error('Connection failed')));
  });
}

module.exports = (playerId, originalInitialState, gameId) => openConnection(gameId)
  .then((sock) => {
    const socket = sock;
    return new Promise((resolve, reject) => {
      let store;
      if (originalInitialState) {
        const initialStateWithId = { ...originalInitialState, id: gameId };
        socket.emit('gameMsg', { initialState: { game: initialStateWithId } });
      }

      function errorHandler(event, message, permanent) {
        console.warn(event);
        if (store) {
          if (store.onConnectionStatus) {
            store.onConnectionStatus({
              connected: false,
              message,
              permanent
            });
          }
        } else if (permanent) {
          reject(new Error(event));
        }
      }

      socket.on('gameMsg', ({ mutation, error, initialState }) => {
        if (initialState) {
          if (store) {
            console.log('reinitializing!');
            store.commit('reinitialize', initialState);
            if (store.onConnectionStatus) {
              store.onConnectionStatus({ connected: true });
            }
          } else {
            console.log('initializing with remote state');
            store = localStore(initialState);
            resolve(store);
          }
        }
        if (mutation) {
          if (!store) return reject(new Error('not initialized'));
          const { type, payload } = mutation;
          store.commit(type, payload);
        }
        if (error) {
          errorHandler('game_error', `Game error: ${error}`, true);
        }
        return null;
      });

      function addErrorHandler(event, message, permanent) {
        socket.on(event, () => errorHandler(event, message, permanent));
      }

      addErrorHandler('disconnect', 'Disconnected', false);
      addErrorHandler('error', 'Connection unstable', false);
      addErrorHandler('reconnect_failed', 'Connection lost', true);
    }).then((s) => {
      const store = s;
      store.commitTagged = (type, payload) => {
        // store.commit(type, payload);
        socket.emit('gameMsg', { mutation: { type, payload } });
      };
      return store;
    });
  });
