const cryptoRandomString = require('crypto-random-string');
const uuid = require('uuid');
const Vue = require('vue');
const Vuex = require('vuex');
const vClickOutside = require('v-click-outside');
const Store = require('./store');
const GameSelector = require('./GameSelector.vue').default;
const Game = require('./Game.vue').default;

Vue.use(Vuex);
Vue.use(vClickOutside);

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
            name: store.singlePlayer ? 'single' : null
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
            if (existing) {
              console.log(`Claiming player id ${existing.id}`);
              this.identity.id = existing.id;
            } else {
              console.log('Creating a new player');
              const { stack, ...player } = playerToken;
              this.$store.commitTagged('addItems', [
                {
                  type: 'players',
                  id: this.identity.id,
                  properties: { name }
                },
                {
                  type: 'tokens',
                  id: player.id,
                  properties: {
                    stackId: stack.id,
                    ...player
                  }
                },
                {
                  type: 'stacks',
                  id: stack.id,
                  properties: stack
                }
              ]);
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
