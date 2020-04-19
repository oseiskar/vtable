const Vuex = require('vuex');
const firebase = require('firebase/app');
require('firebase/firestore');
const { firestoreAction, vuexfireMutations } = require('vuexfire');
const firebaserc = require('../.firebaserc');

function firebaseStore(initialState, gameId) {
  firebase.initializeApp({
    projectId: firebaserc.projects.default
  });
  const gameRef = firebase.firestore().collection('games').doc(gameId);

  return gameRef.get().then((doc) => {
    if (doc.exists) {
      if (!initialState) return true;
      throw new Error(`Game ${gameId} already exists, won't overwrite`);
    } else {
      if (initialState) return true;
      throw new Error(`Game with ID ${gameId} not found`);
    }
  }).then(() => {
    const store = new Vuex.Store({
      state: {
        game: {}
      },
      mutations: {
        addItems(state, items) {
          const update = {};
          items.forEach(({ type, id, properties }) => {
            update[`${type}.${id}`] = { id, ...properties };
          });
          gameRef.update(update);
        },
        alterItems(state, items) {
          const update = {};
          items.forEach(({ type, id, properties }) => {
            if (properties === null) {
              update[`${type}.${id}`] = firebase.firestore.FieldValue.delete();
            } else {
              Object.entries(properties).forEach(([key, value]) => {
                update[`${type}.${id}.${key}`] = value === null
                  ? firebase.firestore.FieldValue.delete()
                  : value;
              });
            }
          });
          gameRef.update(update);
        },
        ...vuexfireMutations
      },
      actions: {
        init: firestoreAction((context) => {
          const setState = initialState
            ? gameRef.set({ ...initialState })
            : Promise.resolve(true);

          return setState.then(() => context.bindFirestoreRef('game', gameRef, { maxRefDepth: 10 }));
        })
      }
    });

    store.doInit = () => store.dispatch('init').then(() => {
      console.log(`Bound to Firestore with Game ID ${gameId}`);
      return store;
    });

    return store;
  });
}

module.exports = (playerId, initialState, gameId) => {
  const storePromise = firebaseStore(initialState, gameId);
  return storePromise.then((s) => {
    const store = s;
    store.commitTagged = (mutationType, mutationPayload) => {
      store.commit(mutationType, mutationPayload);
    };
    return store;
  });
};
