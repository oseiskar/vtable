<template>
  <div>
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
    <RemoteCursor
      v-if="remoteDrag && remoteDrag.player && animDrag"
      v-bind:player="remoteDrag.player"
      v-bind:position="cursorPosition">
    </RemoteCursor>
  </div>
</template>

<script>
const Moveable = require('vue-moveable');
const uuid = require('uuid');
const RemoteCursor = require('./RemoteCursor.vue').default;

const QUICK_DRAG_MILLISECONDS = 400;
const DRAG_BROADCAST_INTERVAL_MILLIS = 300;
const ANIM_INTERVAL = 20;

function dragTrigger(drag) {
  const t = +new Date();
  if (drag.lastBroadcast < t - DRAG_BROADCAST_INTERVAL_MILLIS) {
    drag.lastBroadcast = t;
    return true;
  }
  return false;
}

function interpolatePosition(pos0, pos1) {
  const ratio = 0.1;
  const interp = (v0, v1) => v0 + (v1 - v0) * ratio;
  return {
    x: interp(pos0.x, pos1.x),
    y: interp(pos0.y, pos1.y)
  };
}

function animate(target, id = null) {
  if (target.remoteDrag && target.drag.active && (!target.drag.animationId || target.drag.animationId === id)) {
    if (id === null) id = uuid.v4();
    target.drag.animationId = id;
    target.drag.position = interpolatePosition(target.drag.position, target.remoteDrag.position);
    setTimeout(() => animate(target, id), ANIM_INTERVAL);
  }
}

module.exports = {
  components: {
    Moveable,
    RemoteCursor
  },
  props: [ 'stack', 'tokens', 'remoteDrag', 'dx', 'dy', 'zoomedTokenId' ],
  data: () => ({
    drag: {
      position: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      zindex: -1,
      active: false,
      stack: false,
      stackSize: 0,
      lastBroadcast: 0
    },
    dragStopCheckTimeout: null
  }),
  watch: {
    remoteDrag(v) {
      let pos0;
      if (this.drag.active) {
        pos0 = this.drag.position;
      } else {
        pos0 = this.position;
      }
      if (v) {
        const newDrag = { ...v };
        newDrag.position = pos0;
        newDrag.active = true;
        this.drag = newDrag;
        animate(this);
      } else {
        this.drag.active = false;
      }
    },
    tokens() {
      if (this.drag.active === 'pending')
        this.drag.active = false;
    }
  },
  computed: {
    moveable() {
      return {
        // TODO: this.remoteDrag can cause the card to be permanently stuck
        draggable: true, // !this.remoteDrag,
        throttleDrag: 0,
        resizable: false,
        scalable: false,
        rotatable: false
      }
    },
    animDrag() {
      return this.drag;
    },
    cursorPosition() {
      const pos = { ...this.animDrag.position };
      if (this.tokens[0].dimensions) {
        const { width, height } = this.tokens[0].dimensions;
        pos.x += width * 0.5;
        pos.y += height * 0.5;
      }
      return pos;
    },
    position() { return this.stack.position; },
    zindex() { return this.stack.zindex; },
    dynamicClass() {
      return {
        'moveable': true,
        'token-drag-active': this.animDrag.active && this.animDrag.stack
      };
    },
    dynamicStyle() {
      let pos = this.position;
      const drag = this.animDrag;
      if (drag.stack && drag.active) pos = drag.position;

      let zindex = this.zindex;
      if (drag.active || this.zoomedTokenId == this.tokens[this.tokens.length - 1].id) {
        zindex = 1000000 - 1;
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
        'token-bottom': index === 0,
        'has-context-menu': token.type === 'card',
        'token-drag-active': index === this.tokens.length - 1 && this.animDrag.active && !this.animDrag.stack
      };
    },
    tokenStyle(token, index) {
      const faceStyle = (token[(token.faceDown ? 'back' : 'front')] || {}).style || {};
      const drag = this.animDrag;

      let x = index * this.dx;
      let y = index * this.dy;

      if (index === this.tokens.length - 1 && !drag.stack && drag.active) {
        x = drag.position.x - this.position.x + drag.offset.x;
        y = drag.position.y - this.position.y + drag.offset.y;
      }

      const style = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        ...token.style,
        ...faceStyle
      };

      if (token.id === this.zoomedTokenId) {
        style.transform = 'scale(2.0)';
      }

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
        if (!this.drag.moved && this.drag.active === true) {
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
          x: this.dx * (this.tokens.length - 1),
          y: this.dy * (this.tokens.length - 1)
        },
        lastBroadcast: 0
      }
    },
    dragMove({ target, left, top }) {
      this.drag.position = {
        x: left,
        y: top
      };
      this.drag.moved = true;

      const broadcastDrag = {
        offset: this.drag.offset,
        position: this.drag.position,
        stack: this.drag.stack
      };
      if (dragTrigger(this.drag)) {
        this.$emit('drag-token', { stackId: this.stack.id, drag: broadcastDrag });
      } else {
        if (this.dragStopCheckTimeout) {
          clearTimeout(this.dragStopCheckTimeout);
        }
        this.dragStopCheckTimeout = setTimeout(() => {
          if (this.drag.active) {
            this.$emit('drag-token', { stackId: this.stack.id, drag: broadcastDrag });
          }
          this.dragStopCheckTimeout = null;
        }, 200);
      }
    },
    dragEnd({ target }) {
      this.drag.active = 'pending'; // TODO: hacky
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
