<template>
  <div class="app" >
    <div class="board">
      <Token v-bind="token" v-for="token in tokens" :key="token.id"></Token>
    </div>
    <div class="players">
      <Player v-bind="player" v-for="player in players" :key="player.id"></Player>
    </div>
    <div class="overlay" v-if="!identity.name">
      <div class="game-modal">
        <div class="form-group row">
          <label class="col-sm-3 col-form-label col-form-label-lg" for="name">Your name:</label>
          <div class="col-sm-6">
            <input v-model="nameInput" id="name" class="form-control form-control-lg"></input>
          </div>
          <div class="col-sm-3">
            <button @click="join" :disabled="!nameInput" class="btn btn-primary btn-lg col-sm-12">Join!</button>
          </div>
        </div>
        <p class="help-text">
          To invite others to join this game, share this direct link,
          which should also be in your address bar:
          <a :href="link">{{ link }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
const { mapState } = require('vuex');
const Player = require('./Player.vue').default;
const Token = require('./Token.vue').default;

module.exports = {
  components: { Token, Player },
  data: () => ({
    nameInput: '',
  }),
  props: [ 'identity' ],
  computed: {
    link() { return window.location.href; },
    ...mapState({
      id: state => state.game && state.game.id,
      players: state => state.game.players,
      tokens: state => state.game.tokens,
      name: state => state.game && state.game.name
    })
  },
  methods: {
    join() {
      this.$emit('join-game', { name: this.nameInput });
    }
  },
  watch: {
    name() {
      document.title = `${this.$store.state.game.name} | vtable`;
    },
    id(value) {
      if (value) window.location.hash = value;
    }
  }
};
</script>
