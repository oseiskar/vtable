const Vue = require('vue');
const Vuex = require('vuex');

module.exports = (playerId, initialState) => {
  const store = new Vuex.Store({
    state: initialState,
    mutations: {
      addPlayer(state, player) {
        state.players.push(player);
      },
      addToken(state, token) {
        state.tokens.push(token);
      },
      move(state, {
        tokenId, properties
      }) {
        const token = state.tokens.find((tok) => tok.id === tokenId);
        if (!token) {
          console.warn(`unable to find token with ID ${tokenId}`);
          return;
        }
        Object.entries(properties).forEach(([key, value]) => {
          Vue.set(token, key, value);
        });
      }
    }
  });
  store.commitTagged = (mutationType, mutationPayload) => {
    const payload = { ...mutationPayload, source: playerId };
    store.commit(mutationType, payload);
  };
  let maxZIndex = 10000;
  store.subscribeTagged = (func) => {
    store.subscribe(({ type, payload }) => {
      // hacky
      const zindex = (payload.properties && payload.properties.zindex) || 0;
      maxZIndex = Math.max(maxZIndex, zindex);
      if (payload.source === playerId) {
        func(type, payload);
      }
    });
  };
  store.nextZIndex = () => maxZIndex + 1;
  return store;
};
