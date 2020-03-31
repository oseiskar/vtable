<template>
  <div class="app" @contextmenu.prevent="openContextMenu">
    <div class="board-container">
      <div class="board" :style="boardStyle">
        <Token v-bind:token="token" v-for="token in tokens" :ref="`token-${token-id}`" :key="`token-${token.id}`" :role="`token-${token.id}`" v-on:move-token="moveToken" v-on:alter-token="alterToken"></Token>
      </div>
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
    <div class="context-menu" v-if="contextMenu" :style="contextMenu.style" v-click-outside="closeContextMenu">
      <div class="list-group">
        <a v-for="option in contextMenu.options"
          href="javascript:void(0)"
          @click="option.action() && closeContextMenu()"
          class="list-group-item list-group-item-action">{{ option.name }}</a>
      </div>
    </div>
  </div>
</template>

<script>
const { mapState } = require('vuex');
const Token = require('./Token.vue').default;

function getChildWithClass(el, className) {
  // vue-moveable messes contextmenu events due to wrapping things inside
  // its own divs. Need some hacking to work around this...
  if (el.classList.contains(className)) {
    return el;
  } else {
    return el.getElementsByClassName(className)[0];
  }
}

module.exports = {
  components: { Token },
  data: () => ({
    nameInput: '',
    contextMenu: null
  }),
  props: [ 'identity' ],
  computed: {
    boardDims() {
      return (this.board && this.board.dimensions) || {
        width: 800,
        height: 800
      };
    },
    boardStyle() {
      const board = this.board;
      const style = { ...((board && board._style) || {}) };
      const dims = board && board.dimensions;
      if (dims) {
        style.left = `calc(50% - ${dims.width/2}px)`;
        style.width = `${dims.width}px`;
        style.height = `${dims.height}px`;
      }
      return style;
    },
    link() { return window.location.href; },
    maxZIndex() {
      let maxIndex = 0;
      Object.values(this.tokens).forEach(token => {
        maxIndex = Math.max(maxIndex, token.zindex);
      });
      return maxIndex;
    },
    nextPlayerTokenPosition() {
      const dims = this.boardDims;
      const center = { x: dims.width / 2 - 50, y: dims.height / 2 - 30 };
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
      const Rx = dims.width / 2 + 100;
      const Ry = dims.height / 2 + 50;
      return {
        x: Rx * Math.cos(arad) + center.x,
        y: Ry * Math.sin(arad) + center.y
      };
    },
    nextPlayerColor() {
      function randComponent() {
        const l = 0.6;
        return Math.round(255*(l + (1-l) * Math.random()));
      }
      const [r, g, b] = [0, 0, 0].map(() => randComponent());
      return `rgb(${r}, ${g}, ${b})`;
    },
    ...mapState({
      board: state => state.game && state.game.board,
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
        text: this.nameInput,
        type: 'player',
        position: this.nextPlayerTokenPosition,
        _style: {
          'background-color': this.nextPlayerColor
        },
        zindex: this.maxZIndex
      });
    },
    alterToken({ tokenId, properties }) {
      this.$store.commitTagged('move', {
        tokenId,
        properties
      });
    },
    moveToken({ tokenId, position }) {
      this.alterToken({ tokenId, properties: {
        position,
        zindex: this.maxZIndex + 1
      }});
    },
    openContextMenu(event) {
      const menuElement = getChildWithClass(event.target, 'has-context-menu');
      if (menuElement) {
        const menuTarget = this.tokens[menuElement.dataset.tokenId];
        this.contextMenu = this.buildContextMenu(event, menuTarget);
        event.preventDefault();
        return true;
      }
      return false;
    },
    buildContextMenu(event, targetToken) {
      if (!targetToken) return null;
      return {
        style: {
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          'z-index': this.maxZIndex + 100
        },
        options: [{
          name: 'Flip',
          action: () => this.$emit('alter-token', {
            tokenId: targetToken.id,
            properties: { faceDown: !targetToken.faceDown }
          })
        }]
      };
    },
    closeContextMenu() {
      this.contextMenu = null;
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
