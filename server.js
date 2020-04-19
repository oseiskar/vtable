const Koa = require('koa');
const KoaRouter = require('koa-router');
const websockify = require('koa-websocket');
const Vue = require('vue');
const Vuex = require('vuex');
const Store = require('./src/store-vue');

Vue.use(Vuex);

const app = websockify(new Koa());
app.use(require('koa-static')('build'));

const games = {};

function Game() {
  let store = null;
  const channels = [];

  function apply(msg) {
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
  }

  this.join = (send) => {
    const channel = {
      send,
      id: channels.length,
      receive(msg) {
        if (apply(msg)) {
          for (let i = 0; i < channels.length; ++i) {
            // broadcast to all
            if (channels[i]) channels[i].send(msg);
          }
        }
      },
      disconnect() {
        channels[this.id] = null;
      }
    };
    channels.push(channel);
    return channel;
  };

  this.getState = () => {
    if (store) {
      return store.state;
    }
    return null;
  };
}

app.ws.use(new KoaRouter().all('/games/:gameId', (ctx) => {
  const { gameId } = ctx.params;
  const clientAddr = ctx.request.ip;
  console.log(`new websocket connection from ${clientAddr} for game ${gameId}`);
  if (games[gameId]) {
    console.log('joining existing game');
    const state = games[gameId].getState();
    if (state) {
      console.log('sending current state');
      ctx.websocket.send(JSON.stringify({ initialState: state }));
    }
  } else {
    console.log('creating a new game');
    games[gameId] = new Game();
  }
  const game = games[gameId];
  const channel = game.join((msg) => {
    ctx.websocket.send(JSON.stringify(msg));
  });
  ctx.websocket.on('message', (msg) => {
    let parsed;
    try {
      parsed = JSON.parse(msg);
    } catch (err) {
      console.error(`unprocessable message from ${clientAddr}: ${msg}`);
      channel.send({ error: 'unprocessable' });
      channel.disconnect();
      return;
    }
    channel.receive(parsed);
  });
  ctx.websocket.on('error', () => {
    console.log(`${clientAddr} disconnected (error)`);
    channel.disconnect();
  });
  ctx.websocket.on('close', () => {
    console.log(`${clientAddr} disconnected (close)`);
    channel.disconnect();
  });
}).routes());

const PORT = process.env.PORT || 3000;
const BIND_IP = process.env.BIND_IP || '127.0.0.1';
app.listen(PORT, BIND_IP, () => console.log(`started on port ${PORT}, bind ${BIND_IP}`));
