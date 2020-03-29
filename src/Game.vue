<template>
  <div class="app" >
    <div class="board">
      <Token v-bind="token" v-for="token in tokens" :key="token.id" v-on:move-token="moveToken"></Token>
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
const Token = require('./Token.vue').default;

module.exports = {
  components: { Token },
  data: () => ({
    nameInput: ''
  }),
  props: [ 'identity' ],
  computed: {
    link() { return window.location.href; },
    maxZIndex() {
      let maxIndex = 0;
      Object.values(this.tokens).forEach(token => {
        maxIndex = Math.max(maxIndex, token.zindex);
      });
      return maxIndex;
    },
    nextPlayerTokenPosition() {
      const center = { x: 600, y: 450 };
      const R = 400;
      const nExisting = Object.values(this.players).length;
      let angle = 0;
      switch (nExisting) {
        case 0: angle = 0; break;
        case 1: angle = 180; break;
        case 2: angle = 270; break;
        case 3: angle = 90; break;
        default: angle = Math.random() * 360;
      }
      const arad = (90 - angle) / 180 * Math.PI;
      return {
        x: R * Math.cos(arad) + center.x,
        y: R * Math.sin(arad) + center.y
      };
    },
    nextPlayerColor() {
      function randComponent() {
        const l = 0.6;
        return Math.round(255*(l + (1-l) * Math.random()));
      }
      const [r, g, b] = [0, 0, 0].map(() => randComponent());
      return { r, g, b };
    },
    ...mapState({
      id: state => state.game && state.game.id,
      players: state => state.game.players,
      tokens: state => state.game.tokens,
      name: state => state.game && state.game.name
    })
  },
  methods: {
    join() {
      this.$emit('join-game', {
        id: this.identity.id,
        name: this.nameInput,
        type: 'player',
        position: this.nextPlayerTokenPosition,
        color: this.nextPlayerColor,
        zindex: this.maxZIndex
      });
    },
    moveToken({ tokenId, position }) {
      this.$store.commitTagged('move', {
        tokenId,
        properties: {
          position,
          zindex: this.maxZIndex + 1
        }
      });
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
