import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService, StorageService } from '@browserbot/backend-shared';
import { TimeService } from '../time/time.service';
import { PostgresDbService, sql } from '../shared/services/postgres-db.service';
import { CrudService } from '../shared/services/crud.service';
import { BBSession } from '@browserbot/model';

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
                    path text,
                    bb_userid BIGINT,
                    created TIMESTAMPTZ,
                     CONSTRAINT bb_session_bb_userid FOREIGN KEY(bb_userid) REFERENCES bb_user(bb_userid) 
                );
            `;
  }

  async saveSession(session: Buffer, url: string) {
    const path = this.path(url);
    const id = (await this.create({ url, path }))[0].bb_sessionid;
    this.storageService.upload(session, path).then(() => this.run(path));
    return { path, id };
  }

  async sessionStream(path: string) {
    return await this.storageService.getStream(path);
  }

  async sessionBuffer(path: string) {
    return await this.storageService.read(path);
  }

  async findByPath(path: string) {
    return await this.findByField('path', path);
  }

  path(url: string) {
    const u = new URL(url);
    const path = (u.pathname ?? '/').substring(1).replace(/\//g, '_@bb@_') || '_@bb@_';
    return `sessions/${u.host}/${path}/${this.timeService.todayAs(
      'YYYY/MM/DD'
    )}/${Date.now()}-${Math.round(Math.random() * 1000)}.zip`;
  }

  run(path: BBSession['path']) {
    const urlParams = new URLSearchParams({
      path: path,
      backend: 'mock'
    });
    fetch(`${this.configService.runner_url}/api/run-events?${urlParams}`).then(() =>
      console.log('running session: ', path)
    );
  }
}
