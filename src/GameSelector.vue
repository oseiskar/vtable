<template>
  <div class="game-selector container">
    <div class="alert alert-danger" v-if="error">{{error}}</div>
    <div class="form-group row">
      <label class="col-sm-5 col-form-label col-form-label-lg" for="code">Join an existing game</label>
      <div class="col-sm-4">
        <input v-model="gameId" id="code" class="form-control form-control-lg" placeholder="Code"></input>
      </div>
      <div class="col-sm-3">
        <button @click="joinGame" class="btn btn-outline-primary btn-lg col-sm-12">Join!</button>
      </div>
    </div>
    <h5 class="new-game-header">... or start a new one</h5>
    <div class="list-group">
      <a v-for="game in games"
        href="javascript:void(0)"
        @click="selectGame(game)"
        class="list-group-item list-group-item-action">{{ game.name }}</a>
    </div>
  </div>
</template>

<script>
// avoid making full data of all games reactive
const games = require('./games').map(game => ({
  name: game.name,
  fullData() {
    return game;
  }
}));

module.exports = {
  data: () => ({ games, gameId: '' }),
  props: ['error'],
  methods: {
    selectGame(game) {
      this.$emit('select-game', game.fullData());
    },
    joinGame() {
      this.$emit('join-game', this.gameId);
    }
  }
};
</script>
