import {AllExceptionsFilter} from "./shared/error.logger";
import multipart from "@fastify/multipart";

require('dotenv').config();

process.on('uncaughtException', function (err) {
  console.log('main.ts - Uncaught exception: ', err);
});

import {HttpAdapterHost, NestFactory} from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';

declare const module: any;

async function bootstrap() {
  const adapter = new FastifyAdapter({ logger: true })
  adapter.register(multipart)
  const app = await NestFactory.create(AppModule, adapter);


  function logger(req, res, next) {
    console.log(`Request...`, req.url);
    next();
  }

  app.use(logger);
  app.enableCors();

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)))

  await app.listen(3005, '0.0.0.0');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
