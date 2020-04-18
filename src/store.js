const storeImplementation = BUILD_CONFIG.backend === 'firebase'
  ? require('./store-firebase')
  : require('./store-node');

module.exports = (playerId, initialState, gameId) => {
  const storePromise = storeImplementation(initialState, gameId);
  return storePromise.then((s) => {
    const store = s;
    store.commitTagged = (mutationType, mutationPayload) => {
      // TODO: not currently useful
      // const payload = { ...mutationPayload, source: playerId };
      // console.log(payload);
      store.commit(mutationType, mutationPayload);
    };

    /* store.subscribeTagged = (func) => {
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
