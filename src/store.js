const Vue = require('vue');
const Vuex = require('vuex');

module.exports = () => new Vuex.Store({
  state: {
    players: [],
    tokens: []
  },
  mutations: {
    addPlayer(state, { player }) {
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
