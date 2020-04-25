<template>
  <div class="overlay">
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
</template>

<script>
module.exports = {
  data: () => ({
    nameInput: ''
  }),
  props: [ 'identity', 'nExisting', 'maxZIndex' ],
  computed: {
    link() {
      return window.location.href;
    },
    nextPlayerTokenPosition() {
      return {
        x: 40,
        y: 100*this.nExisting
      };
    },
    nextPlayerColor() {
      function randComponent() {
        const l = 0.6;
        return Math.round(255*(l + (1-l) * Math.random()));
      }
      const [r, g, b] = [0, 0, 0].map(() => randComponent());
      return `rgb(${r}, ${g}, ${b})`;
    }
  },
  methods: {
    join() {
      this.$emit('join-game', {
        id: this.identity.id,
        text: this.nameInput,
        type: 'player',
        style: {
          'background-color': this.nextPlayerColor
        },
        stack: {
          id: `stack-${this.identity.id}`,
          position: this.nextPlayerTokenPosition,
          zindex: this.maxZIndex,
          remoteDrag: 0
        }
      });
    }
  }
};
</script>
