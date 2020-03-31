<template>
  <Moveable
    v-bind="moveable"
    @drag="dragMove"
    @dragEnd="dragEnd"
    @dragStart="dragStart"
    :class="dynamicClass"
    :style="dynamicStyle">
    <div :data-token-id='token.id' :class='{ "has-context-menu": hasContextMenu }'><span v-if='!token.faceDown'>{{ text }}</span></div>
  </Moveable>
</template>

<script>
const Moveable = require('vue-moveable');
module.exports = {
  components: {
    Moveable
  },
  props: [ 'token' ],
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
    id() { return this.token.id; },
    position() { return this.token.position; },
    zindex() { return this.token.zindex; },
    type() { return this.token.type; },
    dimensions() { return this.token.dimensions; },
    text() { return this.token.text; },
    vueId() {
      return `token-content-${this.id}`;
    },
    hasContextMenu() {
      return this.type === 'card';
    },
    dynamicClass() {
      return {
        [`token-${this.type}`]: true,
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

      const faceStyle = (this.token[(this.token.faceDown ? 'back' : 'front')] || {}).style || {};
      const style = {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        'z-index': zindex,
        ...this.token.style,
        ...faceStyle
      };

      if (this.dimensions) {
        const { width, height } = this.dimensions;
        style.width = `${width}px`;
        style.height = `${height}px`;
      }

      return style;
    }
  },
  methods: {
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
        tokenId: this.id,
        position: this.drag.position
      });
    }
  }
};
</script>
