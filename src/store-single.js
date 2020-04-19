const localStore = require('./store-vue.js');

module.exports = (playerId, initialState) => {
  const store = localStore(initialState);
  store.commitTagged = (mutationType, mutationPayload) => {
    store.commit(mutationType, mutationPayload);
  };
  store.singlePlayer = true;
  return Promise.resolve(store);
};
