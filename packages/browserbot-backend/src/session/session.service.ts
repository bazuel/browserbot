import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { TimeService } from '../time/time.service';
import {PostgresDbService, sql} from "../shared/postgres-db.service";
import {CrudService} from "../shared/crud.service";
import {BBSession} from "@browserbot/model";

@Injectable()
export class SessionService {
  private sessionTable: CrudService<BBSession>;
  private table = "bb_session";
  private id = "bb_sessionid"
  constructor(
    private storageService: StorageService,
    private timeService: TimeService,
    private db: PostgresDbService
  ) {
    this.sessionTable = new CrudService<BBSession>(db, this.table, this.id)
  }

  async onModuleInit() {
    await this.generateTable();
  }

  async generateTable() {
    const tableExists = await this.db.tableExists(this.table);
    if(!tableExists)
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
    await this.sessionTable.create({url, path})
    this.storageService.upload(session, path);
    return {path};
  }

  path(url: string) {
    const u = new URL(url);
    const path = ((u.pathname ?? '/').substring(1)).replace(/\//g, "_@bb@_") || "_@bb@_"
    return `sessions/${u.host}/${
      path
    }/${this.timeService.todayAs(
      'YYYY/MM/DD',
    )}/${Date.now()}-${Math.round(Math.random() * 1000)}.zip`;
  }
  
  async sessionStream(path:string){
    return await this.storageService.getStream(path)
  }
}
