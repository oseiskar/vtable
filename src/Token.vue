<template>
  <Moveable
      class="moveable"
      v-bind="moveable"
      @drag="dragMove"
      @dragEnd="dragEnd"
      @dragStart="dragStart"
      :class="dynamicClass"
      :style="dynamicStyle">
    {{ text }}
  </Moveable>
</template>

<script>
const Moveable = require('vue-moveable');
module.exports = {
  components: {
    Moveable
  },
  props: [ 'id', 'position', 'zindex', 'type', 'text', '_style' ],
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
    dynamicClass() {
      return `token-${this.type}` + (this.drag.active ? ' token-drag-active' : '');
    },
    dynamicStyle() {
      let pos = this.position;
      if (this.drag.active || this.zindex === this.drag.zindex) pos = this.drag.position;

      let zindex = this.zindex;
      if (this.drag.active) {
        zindex = 1e10;
      }

      const style = {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        'z-index': zindex,
        ...this._style
      };

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
