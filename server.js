const Koa = require('koa');
const KoaRouter = require('koa-router');

const app = new Koa();
app.use(require('koa-static')('build'));

const router = new KoaRouter();
router.get('/state', (ctx) => {
  ctx.body = 'Foo bar';
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
const BIND_IP = process.env.BIND_IP || '127.0.0.1';
app.listen(PORT, BIND_IP, () => console.log(`started on port ${PORT}, bind ${BIND_IP}`));
