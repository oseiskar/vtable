const uuid = require('uuid');
const Vue = require('vue');
const Vuex = require('vuex');
const Store = require('./store');
const MainComponent = require('./Main.vue').default;

Vue.use(Vuex);

function start() {
  const playerId = uuid.v4();
  const store = Store(playerId, {
    players: [],
    tokens: [{ id: 2, position: { x: 500, y: 100 } }]
  });
  const app = new Vue({
    el: '#app',
    store,
    data: () => ({
      identity: {
        id: playerId,
        name: null
      }
    }),
    components: { MainComponent },
    template: '<MainComponent v-bind="identity"></MainComponent>'
  });

  store.subscribeTagged((type, payload) => {
    if (type === 'addPlayer') {
      app.identity.name = payload.name;
    }
    console.log({ type, payload });
  });

  store.commitTagged('addToken', { id: 1, position: { x: 10, y: 100 } });
  return app;
}

start();
