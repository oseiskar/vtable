const localStore = require('./store-vue.js');

function openWebSocket(gameId) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return new Promise((resolve, reject) => {
    const websocket = new WebSocket(`${protocol}://${window.location.host}/games/${gameId}`);
    websocket.onopen = () => resolve(websocket);
    websocket.onerror = reject;
  });
}

function wsError(msg) {
  alert(`${msg}, please check your internet connection and reload the page`);
}

module.exports = (playerId, originalInitialState, gameId) => openWebSocket(gameId)
  .then((ws) => {
    const websocket = ws;
    return new Promise((resolve, reject) => {
      let store;
      if (originalInitialState) {
        const initialStateWithId = { ...originalInitialState, id: gameId };
        store = localStore(initialStateWithId);
        websocket.send(JSON.stringify({ initialState: initialStateWithId }));
      }

      websocket.onmessage = ({ data }) => {
        console.log(`received ${data} over websocket`);
        const { mutation, error, initialState } = JSON.parse(data);
        if (initialState) {
          if (store) {
            throw new Error('already initialized');
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
      };

      websocket.onclose = () => wsError('Connection lost');
      websocket.onerror = wsError;

      if (store) resolve(store);
    }).then((s) => {
      const store = s;
      store.commitTagged = (type, payload) => {
        store.commit(type, payload);
        websocket.send(JSON.stringify({ mutation: { type, payload } }));
      };
      return store;
    });
  });
