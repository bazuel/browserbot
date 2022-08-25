import Fastify, {FastifyInstance} from 'fastify'
import {Runner} from "./runner";

require('dotenv').config();

const version = "1.0.2"



process.on('uncaughtException', function (err) {
  console.log('main.ts - Uncaught exception: ', err);
});

const server: FastifyInstance = Fastify({})

server.get('/api/events', async (request, reply) => {
  return {ok: 'true'}
})

const start = async () => {
  try {console.log("BrowserBot runner v" + version)
    await server.listen({port: 3000})
    const runner = new Runner()
    await runner.run()
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
start()
