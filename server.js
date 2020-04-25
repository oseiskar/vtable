const Koa = require('koa');
const IO = require('koa-socket-2');
const Vue = require('vue');
const Vuex = require('vuex');
const Store = require('./src/store-vue');

Vue.use(Vuex);

const app = new Koa();
const io = new IO();
app.use(require('koa-static')('build'));

io.attach(app);

const games = {};

function Game() {
  let store = null;

  this.apply = (msg) => {
    const { initialState, mutation } = msg;
    if (initialState) {
      if (store) {
        console.warn('not re-applying initial state');
        return false;
      }
      console.log(`setting initial state: ${JSON.stringify(initialState).length} byte(s)`);
      store = Store(initialState);
      return true;
    }
    if (mutation) {
      if (!store) {
        console.error('received mutation before initial state');
        return false;
      }
      const { type, payload } = mutation;
      store.commit(type, payload);
      return true;
    }
    console.warn(`unprocessable message ${JSON.stringify(msg)}`);
    return false;
  };

  this.getState = () => {
    if (store) {
      return store.state;
    }
    return null;
  };
}

io.on('connection', (socket) => {
  const clientAddr = socket.id;
  console.log(`new connection from ${clientAddr}`);
  socket.on('join', (gameId) => {
    console.log(`${clientAddr} joins game ${gameId}`);
    socket.join(gameId);
    if (games[gameId]) {
      console.log('joining existing game');
      const state = games[gameId].getState();
      if (state) {
        console.log('sending current state');
        socket.emit('gameMsg', { initialState: state });
      }
    } else {
      console.log('creating a new game');
      games[gameId] = new Game();
    }
    socket.on('gameMsg', (msg) => {
      if (games[gameId].apply(msg)) {
        io.to(gameId).emit('gameMsg', msg);
      }
    });
  });
  // TODO: error handling
});

const PORT = process.env.PORT || 3000;
const BIND_IP = process.env.BIND_IP || '127.0.0.1';
app.listen(PORT, BIND_IP, () => console.log(`started on port ${PORT}, bind ${BIND_IP}`));
