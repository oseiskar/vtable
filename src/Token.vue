<template>
  <Moveable
    v-bind="moveable"
    @drag="dragMove"
    @dragEnd="dragEnd"
    @dragStart="dragStart"
    :class="dynamicClass"
    :style="dynamicStyle">
    <div v-for="token, index in tokens"
      :class="tokenClass(token, index)"
      :style="tokenStyle(token, index)"
      :data-token-id='tokenIdAttr(token, index)'
      :data-stack-id='stackIdAttr(token, index)'><span v-if='!token.faceDown'>{{ token.text }}</span></div>
  </Moveable>
</template>

<script>
const Moveable = require('vue-moveable');
const uuid = require('uuid');

const QUICK_DRAG_MILLISECONDS = 400;
const dx = 2;
const dy = 3;

module.exports = {
  components: {
    Moveable
  },
  props: [ 'stack', 'tokens' ],
  data: () => ({
    moveable: {
      draggable: true,
      throttleDrag: 0,
      resizable: false,
      scalable: false,
      rotatable: false
    },
    drag: {
      position: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      zindex: -1,
      active: false,
      stack: false,
      stackSize: 0
    }
  }),
  computed: {
    position() { return this.stack.position; },
    zindex() { return this.stack.zindex; },
    dynamicClass() {
      return {
        'moveable': true,
        'token-drag-active': this.drag.active && this.drag.stack
      };
    },
    dynamicStyle() {
      let pos = this.position;
      if (this.drag.stack && (this.drag.active || this.zindex === this.drag.zindex))
        pos = this.drag.position;

      let zindex = this.zindex;
      if (this.drag.active) {
        zindex = 1e10;
      }

      return {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        'z-index': zindex
      };
    }
  },
  methods: {
    tokenClass(token, index) {
      return {
        [`token-${token.type}`]: true,
        'has-context-menu': token.type === 'card',
        'token-drag-active': index === this.tokens.length - 1 && this.drag.active && !this.drag.stack
      };
    },
    tokenStyle(token, index) {
      const faceStyle = (token[(token.faceDown ? 'back' : 'front')] || {}).style || {};

      let x = index * dx;
      let y = index * dy;

      if (index === this.tokens.length - 1 && !this.drag.stack && (this.drag.active || this.tokens.length === this.drag.stackSize)) {
        x = this.drag.position.x - this.position.x + this.drag.offset.x;
        y = this.drag.position.y - this.position.y + this.drag.offset.y;
      }

      const style = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        ...token.style,
        ...faceStyle
      };

      if (token.dimensions) {
        const { width, height } = token.dimensions;
        style.width = `${width}px`;
        style.height = `${height}px`;
      }

      return style;
    },
    tokenIdAttr(token, index) {
      if (index === this.tokens.length - 1) return token.id;
      return null;
    },
    stackIdAttr(token, index) {
      if (this.tokens.length > 1) return this.stack.id;
      return null;
    },
    dragStart(obj) {
      setTimeout(() => {
        if (!this.drag.moved) {
          this.drag.stack = true;
        }
      }, QUICK_DRAG_MILLISECONDS);
      this.drag = {
        active: true,
        stack: this.tokens.length <= 1,
        zindex: this.zindex,
        stackSize: this.tokens.length,
        position: { ...this.position },
        offset: {
          x: dx * (this.tokens.length - 1),
          y: dy * (this.tokens.length - 1)
        }
      }
    },
    dragMove({ target, left, top }) {
      this.drag.position = {
        x: left,
        y: top
      };
      this.drag.moved = true;
    },
    dragEnd({ target }) {
      this.drag.active = false;
      let move;
      if (this.drag.stack) {
        move = {
          stackId: this.stack.id,
          position: this.drag.position
        };
      } else {
        move = {
          tokenId: this.tokens[this.tokens.length - 1].id,
          stackId: `stack-${uuid.v4()}`,
          position: {
            x: this.drag.position.x + this.drag.offset.x,
            y: this.drag.position.y + this.drag.offset.y
          }
        };
      }
      this.$emit('move-token', move);
    }
  }
};
</script>
