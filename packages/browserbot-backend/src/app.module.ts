import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionService } from './session/session.service';
import { TimeService } from './time/time.service';
import { SessionController } from './session/session.controller';
import { PostgresDbService } from './shared/postgres-db.service';
import { MessagesService } from './user/messages.service';
import { UserService } from './user/user.service';
import { CryptService } from './shared/crypt.service';
import { UserController } from './user/user.controller';
import { EmailService } from './shared/email.service';
import { TokenService } from './shared/token.service';
import { StorageService, ConfigService, initGlobalConfig } from '@browserbot/backend-shared';
import { EventService } from './session/event.service';
const globalConfig = initGlobalConfig();

const configService = new ConfigService(globalConfig);

@Module({
  imports: [],
  controllers: [AppController, UserController, SessionController],
  providers: [
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
