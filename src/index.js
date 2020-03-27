const Vue = require('vue');
const Vuex = require('vuex');
const Store = require('./store');
const MainComponent = require('./Main.vue').default;

Vue.use(Vuex);

function start() {
  const store = Store();
  const app = new Vue({
    el: '#app',
    store,
    components: { MainComponent },
    template: '<MainComponent></MainComponent>'
  });

  app.$store.commit('addToken', { id: 1, position: { x: 10, y: 100 } });
}

start();
