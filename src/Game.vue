<template>
  <div class="app" @contextmenu.prevent="openContextMenu">
    <div class="board-container">
      <div class="board" :style="boardStyle">
        <Token v-bind="obj" v-for="obj in stackedTokens" :key="`stack-${obj.stack.id}`" v-on:move-token="moveToken"></Token>
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
          @click="option.action(), closeContextMenu()"
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
      Object.values(this.stacks).forEach((stack) => {
        maxIndex = Math.max(maxIndex, stack.zindex);
      });
      return maxIndex;
    },
    maxStackPosition() {
      let max = 0;
      Object.values(this.tokens).forEach((token) => {
        max = Math.max(max, token.stackPosition);
      });
      return Math.ceil(max); // shuffle uses random floats
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
      stacks: state => state.game.stacks,
      stackedTokens(state) {
        const stacked = {};
        if (state.game && state.game.tokens) {
          Object.values(state.game.tokens).forEach((token) => {
            if (!stacked[token.stackId]) {
              stacked[token.stackId] = {
                stack: state.game.stacks[token.stackId],
                tokens: [token]
              }
            } else {
              stacked[token.stackId].tokens.push(token);
            }
          });
          Object.values(stacked).forEach((stack) => {
            stack.tokens.sort((a, b) => {
              return a.stackPosition - b.stackPosition
            });
          });
        }
        return stacked;
      },
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
        style: {
          'background-color': this.nextPlayerColor
        },
        stack: {
          id: `stack-${this.identity.id}`,
          position: this.nextPlayerTokenPosition,
          zindex: this.maxZIndex
        }
      });
    },
    moveToken({ tokenId, stackId, position }) {
      const change = [{
        type: 'stacks',
        id: stackId,
        properties: {
          id: stackId, // needed if a new stack is added
          position,
          zindex: this.maxZIndex + 1
        }
      }];

      if (tokenId && this.tokens[tokenId].stackId !== stackId) {
        change.push({
          type: 'tokens',
          id: tokenId,
          properties: {
            stackId,
            stackPosition: this.maxStackPosition + 1
          }
        });
      }
      this.$store.commitTagged('alterItems', change);
    },
    openContextMenu(event) {
      const menuElement = getChildWithClass(event.target, 'has-context-menu');
      if (menuElement) {
        const { tokenId, stackId } = menuElement.dataset;
        const token = tokenId && this.tokens[tokenId];
        const stack = stackId && this.stackedTokens[stackId];
        if (token || stack) {
          this.contextMenu = this.buildContextMenu(event, { token, stack });
          event.preventDefault();
          return true;
        }
      }
      return false;
    },
    buildContextMenu(event, { token, stack }) {
      const menu = {
        style: {
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          'z-index': this.maxZIndex + 100
        },
        options: []
      };
      if (token) {
        menu.options.push({
          name: 'Flip',
          action: () => this.$store.commitTagged('alterItems', [{
            type: 'tokens',
            id: token.id,
            properties: {
              faceDown: !token.faceDown
            }
          }])
        });
      }
      if (stack) {
        menu.options.push({
          name: 'Shuffle',
          action: () => this.$store.commitTagged('alterItems', stack.tokens.map((token) => ({
            type: 'tokens',
            id: token.id,
            properties: {
              stackPosition: Math.random()
            }
          })))
        });
      }
      return menu;
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
