const uuid = require('uuid');
const Vue = require('vue');
const Vuex = require('vuex');
const Store = require('./store');
const GameSelector = require('./GameSelector.vue').default;
const Game = require('./Game.vue').default;

Vue.use(Vuex);

function start() {
  function startGame(initialState, gameId) {
    return new Promise((resolve, reject) => {
      const playerId = uuid.v4();
      Store(playerId, initialState, gameId).then((store) => {
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
          template: '<Game v-bind:identity="identity"></Game>',
          created() {
            store.doInit().then(() => {
              console.log('Init success');
              resolve(true);
            });
          }
        });

        store.subscribeTagged((type, payload) => {
          if (type === 'addPlayer') {
            app.identity.name = payload.name;
          }
          // console.log({ type, payload });
        });
      }, reject);
    });
  }

  function joinGame(gameId) {
    return startGame(null, gameId);
  }

  const app = new Vue({
    el: '#game-selector',
    data: () => ({ started: false, error: null }),
    components: { GameSelector },
    template: '<GameSelector v-on:select-game="createGame" v-bind:error="error" v-on:join-game="joinExistingGame" v-if="!started"></GameSelector>',
    methods: {
      createGame(game) {
        this.started = true;
        const generatedId = uuid.v4();
        startGame({
          ...game
        }, generatedId);
      },
      joinExistingGame(id) {
        joinGame(id).then(() => {
          this.started = true;
        }).catch((error) => {
          this.error = error;
        });
      }
    }
  });

  const gameId = window.location.hash;
  if (gameId) app.joinExistingGame(gameId);
}

start();
