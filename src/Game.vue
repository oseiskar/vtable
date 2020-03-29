<template>
  <div class="app">
    <div class="board">
      <Token v-bind="token" v-for="token in tokens" :key="token.id"></Token>
    </div>
    <div class="players">
      <Player v-bind="player" v-for="player in players" :key="player.id"></Player>
    </div>
    <div class="overlay" v-if="!identity.name">
      <div class="modal">
        <label>Your name: </label>
        <input v-model="nameInput"></input>
        <button @click="join">Join!</button>
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
  computed: mapState({
    players: 'players',
    tokens: 'tokens',
    name: 'name'
  }),
  methods: {
    join() {
      this.$store.commitTagged('addPlayer', {
        id: this.$props.id,
        name: this.nameInput
      });
    }
  },
  created() {
    document.title = `${this.$store.state.name} | vtable`;
  }
};
</script>
