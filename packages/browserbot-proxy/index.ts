import {createServer} from "http";
import {serveUsingProxy} from "./proxy.api";
import fastify from "fastify";

const serverFactory = (handler, opts) => {
  const httpServer = createServer((req, res) => {
    let url = req.url ?? "";
    if (url.startsWith("/proxy")) {
      serveUsingProxy(req, res, "/proxy?url=", "*");
    }
  });

  return httpServer;
};

const server = fastify({
  serverFactory,
  ignoreTrailingSlash: true,
  bodyLimit: 1048576 * 50,
});

server.listen({ port: 2550 }).then((r) => {
  console.log(`;-) App listening on  localhost:2550 - Version: `);
});
