import Fastify, {FastifyInstance} from 'fastify';
import {Runner} from './runner';

require('dotenv').config();

const version = '1.0.2';

process.on('uncaughtException', function (err) {
  console.log('index.ts - Uncaught exception: ', err);
});

const server: FastifyInstance = Fastify({});
const runner = new Runner();

server.get('/api/events', async (request) => {

  const params: {path?:string} = request.params
  if (params.path)
    await runner.runSession(params.path);
  return {ok: 'true'};
});

const start = async () => {
  try {
    console.log('BrowserBot runner v' + version);
    await server.listen({port: 3000});
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
