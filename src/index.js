const cryptoRandomString = require('crypto-random-string');
const uuid = require('uuid');
const Vue = require('vue');
const Vuex = require('vuex');
const Store = require('./store');
const GameSelector = require('./GameSelector.vue').default;
const Game = require('./Game.vue').default;

Vue.use(Vuex);

function generateGameId() {
  return cryptoRandomString({ length: 6, type: 'distinguishable' });
}

function start() {
  function startGame(initialState, gameId) {
    return new Promise((resolve, reject) => {
      const playerId = uuid.v4();
      Store(playerId, initialState, gameId).then((store) => new Vue({
        el: '#app',
        store,
        data: () => ({
          identity: {
            id: playerId,
            name: null
          }
        }),
        components: { Game },
        template: '<Game v-bind:identity="identity" v-on:join-game="joinThisGame"></Game>',
        methods: {
          joinThisGame(playerToken) {
            const { text: name } = playerToken;
            this.identity.name = name;
            console.log(`Joining as ${name}`);
            const existing = Object.values(store.state.game.players).find((p) => p.name === name);
            if (!existing) {
              // allow Claiming any existing player handle
              console.log('Creating a new player');
              this.$store.commitTagged('addPlayer', {
                name,
                id: this.identity.id
              });

              this.$store.commitTagged('addToken', playerToken);
            }
          }
        },
        created() {
          store.doInit().then(() => {
            console.log('Init success');
            resolve(true);
          });
        }
      }), reject);
    });
  }

  function joinGame(gameId) {
    return startGame(null, gameId.toUpperCase());
  }

  const app = new Vue({
    el: '#game-selector',
    data: () => ({ started: false, error: null }),
    components: { GameSelector },
    template: '<GameSelector v-on:select-game="createGame" v-bind:error="error" v-on:join-game="joinExistingGame" v-if="!started"></GameSelector>',
    methods: {
      createGame(game) {
        this.started = true;
        startGame({
          ...game
        }, generateGameId());
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
  if (gameId) app.joinExistingGame(gameId.replace('#', ''));
}

start();
