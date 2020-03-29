<template>
  <Moveable
      class="moveable game-card"
      v-bind="moveable"
      @drag="dragMove"
      @dragEnd="dragEnd"
      @dragStart="dragStart"
      :style="{
          left: `${draggablePosition.x}px`,
          top: `${draggablePosition.y}px`,
          background: drag.active ? 'blue' : null,
          'z-index': drag.active ? 1e10 : zindex
      }">
    sdfglk {{ id }}
  </Moveable>
</template>

<script>
const Moveable = require('vue-moveable');
module.exports = {
  components: {
    Moveable
  },
  props: [ 'id', 'position', 'zindex' ],
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
    draggablePosition() {
      if (this.drag.active || this.zindex === this.drag.zindex) return this.drag.position;
      return this.position;
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
