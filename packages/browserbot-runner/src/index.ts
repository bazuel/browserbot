import {ConfigService, StorageService} from "@browserbot/backend-shared";

const version = "1.0.2"
console.log("BrowserBot runner v" + version)


require('dotenv').config();

process.on('uncaughtException', function (err) {
    console.log('main.ts - Uncaught exception: ', err);
});


import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import {unzip, strFromU8} from "fflate";

const server: FastifyInstance = Fastify({})

const configService = new ConfigService()
const storageService = new StorageService(configService)





server.get('/api/events', async (request, reply) => {
    return { ok: 'true' }
})

const start = async () => {
    try {
        await server.listen({ port: 3000 })

        const address = server.server.address()
        const port = typeof address === 'string' ? address : address?.port

        const zip = await storageService.read(`sessions/staging.agentesmith.com/dashboard_@bb@_home/2022/08/24/1661346969648-716.zip`)
        unzip(new Uint8Array(zip), (err, data) => {
            for(let f in data){
                const raw = strFromU8(data[f])
                const jsonEvents = JSON.parse(raw)
                console.log("jsonEvents: ",jsonEvents)
            }
        })

    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}
start()
