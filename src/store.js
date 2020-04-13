const Vue = require('vue');
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
            ? gameRef.set({ ...initialState, id: gameId })
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

function localStore(initialState) {
  const store = new Vuex.Store({
    state: {
      game: initialState
    },
    mutations: {
      addItems(state, items) {
        items.forEach(({ type, id, properties }) => {
          Vue.set(state.game[type], id, { id, ...properties });
        });
      },
      alterItems(state, items) {
        items.forEach(({ type, id, properties }) => {
          const coll = state.game[type];
          if (properties === null) {
            delete coll[id];
            return;
          }
          const item = coll[id];
          if (!item) {
            console.error(`unable to find ${type} with ID ${id}`);
            return;
          }
          Object.entries(properties).forEach(([key, value]) => {
            if (value === null) {
              Vue.delete(item, key);
            } else {
              Vue.set(item, key, value);
            }
          });
        });
      }
    }
  });

  store.doInit = () => Promise.resolve(true);
  return Promise.resolve(store);
}

module.exports = (playerId, initialState, gameId) => {
  const storePromise = gameId ? firebaseStore(initialState, gameId) : localStore(initialState);
  return storePromise.then((s) => {
    const store = s;
    store.commitTagged = (mutationType, mutationPayload) => {
      // TODO: not currently useful
      // const payload = { ...mutationPayload, source: playerId };
      // console.log(payload);
      store.commit(mutationType, mutationPayload);
    };

    /*  store.subscribeTagged = (func) => {
      store.subscribe(({ type, payload }) => {
        if (payload.source === playerId) {
          func(type, payload);
        }
      });
    };

    // Example
    store.subscribeTagged((type, payload) => {
      if (type === 'addPlayer') {
        app.identity.name = payload.name;
      }
      // console.log({ type, payload });
    }); */

    return store;
  });
};
