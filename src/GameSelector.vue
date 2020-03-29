<template>
  <div class="game-selector">
    <h1>Select game</h1>
    <ul>
      <li v-for="game in games"><a href="javascript:void(0)" @click="selectGame(game)">{{ game.name }}</a></li>
    </ul>
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
  data: () => ({ games }),
  methods: {
    selectGame(game) {
      this.$emit('select-game', game.fullData());
    }
  }
};
</script>
