import Fastify, { FastifyInstance } from 'fastify';
import { Runner } from './runner';

require('dotenv').config();

const version = '1.0.2';

process.on('uncaughtException', function (err) {
  console.log('main.ts - Uncaught exception: ', err);
});

const server: FastifyInstance = Fastify({});
const runner = new Runner();

server.get('/api/events', async (request, reply) => {
  const path = `sessions/staging.agentesmith.com/dashboard_@bb@_home/2022/08/24/1661346969648-716.zip`;
  // if(req.path) run session
  await runner.runSession(path);
  return { ok: 'true' };
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
