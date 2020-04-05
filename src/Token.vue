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
    Moveable
  },
  props: [ 'stack', 'tokens', 'remoteDrag' ],
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
        this.drag = { ...v };
        this.drag.position = pos0;
        this.drag.active = true;
        animate(this);
      } else {
        this.drag.active = false;
        // TODO: hacks
        this.drag.zindex = 0;
        this.drag.stackSize = 0;
        this.drag.stack = false;
      }
    }
  },
  computed: {
    animDrag() {
      return this.drag;
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
      if (drag.stack && (drag.active || this.zindex === drag.zindex))
        pos = drag.position;

      let zindex = this.zindex;
      if (drag.active) {
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
        'has-context-menu': token.type === 'card',
        'token-drag-active': index === this.tokens.length - 1 && this.animDrag.active && !this.animDrag.stack
      };
    },
    tokenStyle(token, index) {
      const faceStyle = (token[(token.faceDown ? 'back' : 'front')] || {}).style || {};
      const drag = this.animDrag;

      let x = index * dx;
      let y = index * dy;

      if (index === this.tokens.length - 1 && !drag.stack && (drag.active || this.tokens.length === drag.stackSize)) {
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
