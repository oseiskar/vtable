const Vue = require('vue');
const Vuex = require('vuex');
const firebase = require('firebase/app');
require('firebase/firestore');
const { firestoreAction, vuexfireMutations } = require('vuexfire');
const firebaserc = require('../.firebaserc');

function firebaseStore(initialState) {
  const gameId = initialState.id;
  firebase.initializeApp({
    projectId: firebaserc.projects.default
  });
  const gameRef = firebase.firestore().collection('games').doc(gameId);

  const store = new Vuex.Store({
    state: {
      game: {}
    },
    mutations: {
      addPlayer(state, player) {
        gameRef.update({ [`players.${player.id}`]: player });
      },
      addToken(state, token) {
        gameRef.update({ [`tokens.${token.id}`]: token });
      },
      move(state, {
        tokenId, properties
      }) {
        const update = {};
        Object.entries(properties).forEach(([key, value]) => {
          update[`tokens.${tokenId}.${key}`] = value;
        });
        gameRef.update(update);
      },
      ...vuexfireMutations
    },
    actions: {
      init: firestoreAction((context) => gameRef
        .set(initialState)
        .then(() => context.bindFirestoreRef('game', gameRef, { maxRefDepth: 10 })))
    }
  });

  store.doInit = () => store.dispatch('init').then(() => {
    console.log(`Bound to Firestore with Game ID ${gameId}`);
    return store;
  });

  return store;
}

function localStore(initialState) {
  const store = new Vuex.Store({
    state: {
      game: initialState
    },
    mutations: {
      addPlayer(state, player) {
        Vue.set(state.game.players, player.id, player);
      },
      addToken(state, token) {
        Vue.set(state.game.tokens, token.id, token);
      },
      move(state, {
        tokenId, properties
      }) {
        const token = state.game.tokens[tokenId];
        if (!token) {
          console.error(`unable to find token with ID ${tokenId}`);
          return;
        }
        Object.entries(properties).forEach(([key, value]) => {
          Vue.set(token, key, value);
        });
      }
    }
  });

  store.doInit = () => Promise.resolve(true);
  return store;
}

module.exports = (playerId, initialState) => {
  const store = initialState.id ? firebaseStore(initialState) : localStore(initialState);
  store.commitTagged = (mutationType, mutationPayload) => {
    const payload = { ...mutationPayload, source: playerId };
    // console.log(payload);
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
