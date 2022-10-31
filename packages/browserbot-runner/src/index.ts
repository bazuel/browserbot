import Fastify, { FastifyInstance } from 'fastify';
import { Runner } from './runner';
import { log } from './services/log.service';
import { ConfigService, initGlobalConfig, StorageService } from '@browserbot/backend-shared';

require('dotenv').config();

const version = '1.0.2';

process.on('uncaughtException', function (err) {
  log(err.stack);
  log('index.ts - Uncaught exception: ', err);
});

const server: FastifyInstance = Fastify({});
const runner = new Runner(new StorageService(new ConfigService(initGlobalConfig())));

const status: any = { params: {} }; //TODO serve?

server.get('/api/run-events', (request, reply) => {
  const params: { reference?: string; backend?: 'mock' | 'full' } = request.query;
  if (params.reference && params.backend)
    runner
      .run(params.reference, params.backend)
      .then(() => reply.send({ ok: true }))
      .catch((reason) => reply.send({ ok: false, reason: reason }));
  else return { message: 'bad parameters' };
});

server.get('/api/last-session', async (request, reply) => {
  runner.run(status.params.reference, status.params.backend).then(() => reply.send({ ok: true }));
});

const start = async () => {
  try {
    log('BrowserBot runner v' + version);
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
