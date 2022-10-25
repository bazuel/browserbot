import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionService } from './session/session.service';
import { TimeService } from './time/time.service';
import { SessionController } from './session/session.controller';
import { PostgresDbService } from './shared/services/postgres-db.service';
import { MessagesService } from './user/messages.service';
import { UserService } from './user/user.service';
import { CryptService } from './shared/services/crypt.service';
import { UserController } from './user/user.controller';
import { EmailService } from './shared/services/email.service';
import { TokenService } from './shared/services/token.service';
import { StorageService, ConfigService, initGlobalConfig } from '@browserbot/backend-shared';
import { EventService } from './session/event.service';
import { EventController } from './session/event.controller';
import { InjectorService } from './shared/functions/find-injected-service.function';
const globalConfig = initGlobalConfig();

const configService = new ConfigService(globalConfig);

@Module({
  imports: [],
  controllers: [AppController, UserController, SessionController, EventController],
  providers: [
    InjectorService,
    AppService,
    { provide: ConfigService, useValue: configService },
    { provide: StorageService, useValue: new StorageService(configService) },
    { provide: EmailService, useValue: new EmailService(globalConfig.email) },
    {
      provide: CryptService,
      useValue: new CryptService(globalConfig.master_password)
    },
    {
      provide: TokenService,
      useValue: new TokenService(globalConfig.master_password)
    },
    PostgresDbService,
    MessagesService,
    UserService,
    SessionService,
    TimeService,
    EventService
  ]
})
export class AppModule {}
