<template>
  <div class="app">
    <div class="board">
      <Token v-bind="token" v-for="token in tokens" :key="token.id"></Token>
    </div>
    <div class="players">
      <Player v-for="player in players" :key="player.id"></Player>
    </div>
  </div>
</template>

<script>
const { mapState } = require('vuex');
const Player = require('./Player.vue').default;
const Token = require('./Token.vue').default;

module.exports = {
  components: { Token, Player },
  computed: mapState({
    players: 'players',
    tokens: 'tokens'
  })
};
</script>
