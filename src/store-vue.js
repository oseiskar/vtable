const Vue = require('vue');
const Vuex = require('vuex');

function vuexStore(initialState) {
  const store = new Vuex.Store({
    state: {
      ...initialState
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
            Vue.delete(coll, id);
            return;
          }
          const item = coll[id];
          if (!item) {
            Vue.set(coll, id, { id, ...properties });
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
      },
      reinitialize(state, { game }) {
        Vue.set(state, 'game', game);
      }
    }
  });

  store.doInit = () => Promise.resolve(true);
  return store;
}

module.exports = vuexStore;
