<template>
  <div class="app" @contextmenu.prevent="openContextMenu">
    <div class="board-container">
      <div class="board" :style="boardStyle">
        <Token v-bind="obj" v-for="obj in stackedTokens"
        :key="`stack-${obj.stack.id}`"
        v-on:move-token="moveToken"
        v-on:drag-token="dragToken"></Token>
      </div>
    </div>
    <Join v-if="!identity.name"
      v-bind:identity="identity"
      v-bind:nExistingPlayers="nPlayers"
      v-bind:maxZIndex="maxZIndex"
      v-on:join-game="join">
    </Join>
    <div class="context-menu" v-if="contextMenu" :style="contextMenu.style" v-click-outside="closeContextMenu">
      <p v-if="contextMenu.title" class="context-menu-title">{{ contextMenu.title }}</p>
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
const Join = require('./Join.vue').default;
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

const STACK_DX = 2;
const STACK_DY = 3;

module.exports = {
  components: { Join, Token },
  data: () => ({
    contextMenu: null,
    zoomedTokenId: null
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
    maxZIndex() {
      let maxIndex = 0;
      Object.values(this.stacks).forEach((stack) => {
        maxIndex = Math.max(maxIndex, stack.zindex || 0); // TODO
      });
      return maxIndex;
    },
    maxStackPosition() {
      let max = 0;
      Object.values(this.tokens).forEach((token) => {
        max = Math.max(max, token.stackPosition || 0); // TODO
      });
      return Math.ceil(max); // shuffle uses random floats
    },
    nPlayers() {
      return Object.values(this.players).length;
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
              const stack = { ...state.game.stacks[token.stackId] };
              let remoteDrag = stack.remoteDrag;
              delete stack.remoteDrag;
              if (remoteDrag && remoteDrag.source === this.identity.id) {
                // ignore own drag events
                remoteDrag = 0;
              }
              stacked[token.stackId] = {
                remoteDrag,
                stack,
                tokens: [token]
              };
            } else {
              stacked[token.stackId].tokens.push(token);
            }
          });
          Object.values(stacked).forEach((stack) => {
            stack.tokens.sort((a, b) => {
              return a.stackPosition - b.stackPosition
            });
            dScale = 1.0 / (1.0 + stack.tokens.length*0.1);
            stack.dx = STACK_DX * dScale;
            stack.dy = STACK_DY * dScale;

            stack.zoomedTokenId = this.zoomedTokenId;
          });
        }
        return stacked;
      },
      tokens: state => state.game.tokens,
      name: state => state.game && state.game.name
    })
  },
  methods: {
    join(data) {
      this.$emit('join-game', data);
    },
    findTargetStack(position, excludedStackId) {
      function dist2(p0, stackBase, nStack, d) {
        const p1 = {
          x: stackBase.x + d.x * (nStack - 1),
          y: stackBase.y + d.y * (nStack - 1)
        };
        return (p1.x - p0.x)**2 + (p1.y - p0.y)**2;
      }
      const MIN_MERGE_DISTANCE = 20; // pixels
      let maxZ, bestStack = null;
      Object.values(this.stackedTokens).forEach(obj => {
        const { stack, dx, dy, tokens } = obj;
        if (!this.isStackable(obj)) return;
        if (stack.id === excludedStackId) return;
        const mergeDist = Math.max(MIN_MERGE_DISTANCE, tokens.length*Math.max(dx, dy)*2);
        const d2 = dist2(position, stack.position, tokens.length, { x: dx, y: dy });
        if (d2 < mergeDist**2) {
          if (!bestStack || stack.zindex > maxZ) {
            maxZ = stack.zindex;
            bestStack = obj;
          }
        }
      });
      return bestStack;
    },
    isStackable(obj) {
      return obj && obj.tokens.length > 0 && obj.tokens[0].type === 'card'; // TODO
    },
    moveToken({ tokenId, stackId, position }) {
      const detachedToken = tokenId && this.tokens[tokenId];
      const sourceStack = (tokenId &&
        this.stackedTokens[this.tokens[tokenId].stackId])
          || this.stackedTokens[stackId];

      const targetStack = this.isStackable(sourceStack) &&
        this.findTargetStack(position, detachedToken ? null : sourceStack.stack.id);

      let change = [];
      let sourceRemoved = false;

      if (sourceStack && targetStack && sourceStack.stack.id === targetStack.stack.id) {
        console.log('same stack');
        change = [{
          type: 'stacks',
          id: sourceStack.stack.id,
          properties: {
            zindex: this.maxZIndex + 1, // TODO: hacky
            remoteDrag: 0
          }
        }];
      }
      else if (targetStack) {
        // stack on top of existing
        const movedTokens = detachedToken ?
          [detachedToken] :
          sourceStack.tokens;

        let stackPos = this.maxStackPosition + 10;
        console.log(`moving ${movedTokens.length} tokens to stack ${targetStack.stack.id}, starting stack pos ${stackPos}`);

        change = movedTokens.map(token => ({
          type: 'tokens',
          id: token.id,
          properties: {
            stackId: targetStack.stack.id,
            stackPosition: stackPos++
          }
        }));

        if (!detachedToken) {
          console.log('removing source stack');
          sourceRemoved = true;
          change.push({
            type: 'stacks',
            id: sourceStack.stack.id,
            properties: null
          });
        }
      }
      else {
        console.log(`moving stack ${stackId}`);
        change = [{
          type: 'stacks',
          id: stackId,
          properties: {
            id: stackId, // needed if a new stack is added
            position,
            zindex: this.maxZIndex + 1,
            remoteDrag: 0 // TODO: hacky
          }
        }];

        if (detachedToken) {
          console.log(`creating new stack ${stackId}`);
          // new stack
          change.push({
            type: 'tokens',
            id: tokenId,
            properties: {
              stackId,
              stackPosition: this.maxStackPosition + 1
            }
          });
        }
      }

      if (!sourceRemoved) {
        change.push({
          type: 'stacks',
          id: sourceStack.stack.id,
          properties: {
            remoteDrag: 0
          }
        });
      }

      if (change.length > 0) this.$store.commitTagged('alterItems', change);
    },
    dragToken({ stackId, drag }) {
      this.zoomedTokenId = null;
      this.$store.commitTagged('alterItems', [{
        type: 'stacks',
        id: stackId,
        properties: {
          remoteDrag: {
            source: this.identity.id,
            ...drag
          }
        }
      }]);
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
      if (stack) {
        menu.title = `${stack.tokens.length} cards`;
        menu.options = [
          {
            name: 'Flip stack', // TODO: duplicate
            action: () => this.$store.commitTagged('alterItems', stack.tokens.map((token) => ({
              type: 'tokens',
              id: token.id,
              properties: {
                faceDown: !token.faceDown,
                stackPosition: -token.stackPosition
              }
            })))
          },
          {
            name: 'Shuffle',
            action: () => this.$store.commitTagged('alterItems', stack.tokens.map((token) => ({
              type: 'tokens',
              id: token.id,
              properties: {
                stackPosition: Math.random()
              }
            })))
          },
        ];
      }
      else if (token) {
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
      if (token) {
        const isZoomed = this.zoomedTokenId === token.id;
        menu.options.push({
          name: isZoomed ? 'Unzoom' : 'Zoom',
          action: () => {
            this.zoomedTokenId = isZoomed ? null : token.id;
          }
        });
      }
      return menu;
    },
    closeContextMenu() {
      this.contextMenu = null;
    }
  },
  watch: {
    name: {
      immediate: true,
      handler(value) {
        document.title = `${value} | vtable`;
      }
    },
    id: {
      immediate: true,
      handler(value) {
        if (value) window.location.hash = value;
      }
    }
  }
};
</script>
