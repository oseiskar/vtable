const uuid = require('uuid');
const Vue = require('vue');
const Vuex = require('vuex');
const Store = require('./store');
const GameSelector = require('./GameSelector.vue').default;
const Game = require('./Game.vue').default;

Vue.use(Vuex);

function start() {
  const playerId = uuid.v4();
  return new Vue({
    el: '#game-selector',
    data: () => ({ started: false }),
    components: { GameSelector },
    template: '<GameSelector v-on:select-game="createGame" v-if="!started"></GameSelector>',
    methods: {
      createGame(game) {
        this.started = true;
        const store = Store(playerId, {
          players: [],
          ...game
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
          components: { Game },
          template: '<Game v-bind:identity="identity"></Game>'
        });

        store.subscribeTagged((type, payload) => {
          if (type === 'addPlayer') {
            app.identity.name = payload.name;
          }
          console.log({ type, payload });
        });
      }
    }
  });
}

start();
