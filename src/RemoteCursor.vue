<template>
  <div>
    <div class="remote-cursor remote-cursor-dot" :key="index" v-for="dot, index in dots" :style="dot"></div>
    <div class="remote-cursor remote-cursor-cursor" :style="cursorDynamicStyle">
    </div>
  </div>
</template>

<script>
function interpolate(p0, p1, i, n) {
  const t = (i+1)/(n+1);
  function f(field, t) {
    return p0[field] * (1 - t) + p1[field] * t;
  }
  return {
    x: f('x', t*t),
    y: f('y', t)
  };
}

function addCenter(p0, thing) {
  return {
    x: p0.x + thing.width * 0.5,
    y: p0.y + thing.height * 0.5
  };
}

module.exports = {
  props: [ 'player', 'position' ],
  data: () => ({}),
  computed: {
    cursorDynamicStyle() {
      let pos = this.position;
      return {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        ...this.player.token.style
      };
    },
    dots() {
      const p0 = addCenter(this.player.stack.position, { width: 100, height: 50 });
      const p1 = this.position;
      //const dist = Math.sqrt((p1.x - p0.x)**2 + (p1.y - p0.y)**2);
      //const DOT_DIST_PX = 20;
      //const n = Math.round(Math.max(1, dist / DOT_DIST_PX));
      const n = 20;
      const arr = [];
      const style = { ...this.cursorDynamicStyle };
      for (let i=0; i < n; ++i) {
        const s = { ...style };
        const pos = interpolate(p0, p1, i, n);
        s.left = `${pos.x}px`;
        s.top = `${pos.y}px`;
        arr.push(s);
      }
      return arr;
    }
  }
};
</script>
