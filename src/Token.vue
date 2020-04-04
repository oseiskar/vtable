<template>
  <Moveable
    v-bind="moveable"
    @drag="dragMove"
    @dragEnd="dragEnd"
    @dragStart="dragStart"
    :class="dynamicClass"
    :style="dynamicStyle">
    <div v-for="token, index in tokens"
      :class="tokenClass(token)"
      :style="tokenStyle(token, index)"
      :data-token-id='token.id'><span v-if='!token.faceDown'>{{ token.text }}</span></div>
  </Moveable>
</template>

<script>
const Moveable = require('vue-moveable');
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
      zindex: -1,
      active: false
    }
  }),
  computed: {
    position() { return this.stack.position; },
    zindex() { return this.stack.zindex; },
    dynamicClass() {
      return {
        'moveable': true,
        'token-drag-active': this.drag.active
      };
    },
    dynamicStyle() {
      let pos = this.position;
      if (this.drag.active || this.zindex === this.drag.zindex) pos = this.drag.position;

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
    tokenClass(token) {
      return {
        [`token-${token.type}`]: true,
        'has-context-menu': token.type === 'card'
      };
    },
    tokenStyle(token, index) {
      const faceStyle = (token[(token.faceDown ? 'back' : 'front')] || {}).style || {};
      const dx = 2;
      const dy = 3;
      const style = {
        position: 'absolute',
        left: `${index * dx}px`,
        top: `${index * dy}px`,
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
    dragStart({ target }) {
      this.drag.active = true;
      this.drag.zindex = this.zindex;
      this.drag.position = { ...this.position };
    },
    dragMove({ target, left, top }) {
      //console.log('onDrag left, top', left, top);
      this.drag.position = {
        x: left,
        y: top
      };
    },
    dragEnd({ target }) {
      this.drag.active = false;
      this.$emit('move-token', {
        //tokenId: this.id,
        stackId: this.stack.id,
        position: this.drag.position
      });
    }
  }
};
</script>
