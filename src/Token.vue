<template>
  <Moveable
      class="moveable card"
      v-bind="moveable"
      @drag="drag"
      @dragEnd="dragEnd"
      :style="{
          left: `${draggablePosition.x}px`,
          top: `${draggablePosition.y}px`,
          background: dragActive ? 'blue' : null,
          'z-index': dragActive ? 1e10: zindex
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
    localPosition: { x: 0, y: 0 },
    dragActive: false
  }),
  computed: {
    draggablePosition() {
      if (this.dragActive) return this.localPosition;
      return this.position;
    }
  },
  methods: {
    drag({ target, left, top }) {
      //console.log('onDrag left, top', left, top);
      this.dragActive = true;
      this.localPosition = {
        x: left,
        y: top
      };
    },
    dragEnd({ target }) {
      this.dragActive = false;
      this.$store.commitTagged('move', {
        tokenId: this.id,
        properties: {
          position: this.localPosition,
          zindex: this.$store.nextZIndex()
        }
      });
    }
  }
};
</script>
