import Fastify, { FastifyInstance } from 'fastify';
import { Runner } from './runner';

require('dotenv').config();

const version = '1.0.2';

process.on('uncaughtException', function (err) {
  console.log('index.ts - Uncaught exception: ', err);
});

const server: FastifyInstance = Fastify({});
const runner = new Runner();

server.get('/api/events', async (request, response) => {
  const params: { path?: string; backend?: 'mock' | 'full' } = request.query;
  if (params.path && params.backend)
    runner
      .runSession(params.path, 'full')
      .then(() => response.send({ ok: true }))
      .catch((reason) => response.send({ ok: false, reason: reason }));
  else return { message: 'bad parameters' };
});

const start = async () => {
  try {
    console.log('BrowserBot runner v' + version);
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
