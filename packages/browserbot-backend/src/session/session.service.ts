import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService, StorageService } from '@browserbot/backend-shared';
import { TimeService } from '../time/time.service';
import { PostgresDbService, sql } from '../shared/services/postgres-db.service';
import { CrudService } from '../shared/services/crud.service';
import { BBSession } from '@browserbot/model';
import { pathFromReference } from 'browserbot-common';

@Injectable()
export class SessionService extends CrudService<BBSession> implements OnModuleInit {
  protected table = 'bb_session';
  protected id = 'bb_sessionid';

  constructor(
    private timeService: TimeService,
    db: PostgresDbService,
    private storageService: StorageService,
    private configService: ConfigService
  ) {
    super(db);
  }

  async onModuleInit() {
    await this.generateTable();
  }

  async generateTable() {
    const tableExists = await this.db.tableExists(this.table);
    if (!tableExists)
      await this.db.query`
                create table if not exists ${sql(this.table)} (
                    ${sql(this.id)} BIGSERIAL PRIMARY KEY,
                    url text,
                    reference text,
                    bb_userid BIGINT,
                    master_session text,
                    created TIMESTAMPTZ,
                     CONSTRAINT bb_session_bb_userid FOREIGN KEY(bb_userid) REFERENCES bb_user(bb_userid)
                );
            `;
  }

  async save(session: Buffer, url: string, reference: string) {
    const path = pathFromReference(reference);
    const id = await this.create({ url, reference }).then((result) => result[0].bb_sessionid);
    await this.storageService.upload(session, path); //.then(() => this.run(path));
    return { id };
  }

  async sessionStream(path: string) {
    return await this.storageService.getStream(path);
  }

  async sessionBuffer(path: string) {
    return await this.storageService.read(path);
  }

  path(url: string) {
    const u = new URL(url);
    const path = (u.pathname ?? '/').substring(1).replace(/\//g, '_@bb@_') || '_@bb@_';
    return `sessions/${u.host}/${path}/${this.timeService.todayAs(
      'YYYY/MM/DD'
    )}/${Date.now()}-${Math.round(Math.random() * 1000)}.zip`;
  }

  run(reference: BBSession['reference']) {
    const urlParams = new URLSearchParams({
      reference: reference,
      backend: 'mock'
    });
    fetch(`${this.configService.runner_url}/api/run-events?${urlParams}`).then(() =>
      console.log('running session: ', reference)
    );
  }

  async link(masterSession: string, newSession: string) {
    await this.db.query`
            update bb_session
            set master_session = ${masterSession}
            where reference = ${newSession}`;
  }
}
