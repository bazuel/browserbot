import { Injectable } from '@nestjs/common';
import { TimeService } from '../time/time.service';
import { PostgresDbService, sql } from '../shared/postgres-db.service';
import { CrudService } from '../shared/crud.service';
import { BBSession, BLEventName, BLEventType, BLSessionEvent } from '@browserbot/model';
import { StorageService } from '@browserbot/backend-shared';
import { JsonCompressor, eventId, domainFromUrl, eventPath } from 'browserbot-common';

export interface BBHit {
  bb_hitid: number;
  reference: string;
  url: string;
  name: BLEventName;
  type: BLEventType;
  sid: number;
  tab: number;
  timestamp: number;
  scope?: { [key: string]: any };
  data?: BLSessionEvent & { [key: string]: any };
  data_path?: string; // a url pointing to a (BLSessionEvent & { [key: string]: any });
  created: Date | null;
}

@Injectable()
export class HitService {
  private hits: CrudService<BBSession>;
  private table = 'bb_hit';
  private id = 'bb_hitid';

  constructor(
    private timeService: TimeService,
    private db: PostgresDbService,
    private storageService: StorageService
  ) {
    this.hits = new CrudService<BBSession>(db, this.table, this.id);
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
        reference TEXT,
        url text,
        name TEXT,
        type TEXT,
        sid BIGINT,
        tab BIGINT,
        timestamp BIGINT,
        scope JSONB,
        data JSONB,
        data_path TEXT,
        created TIMESTAMPTZ
    );`;
    await this.db
      .query`CREATE INDEX if not exists  bb_hit_index ON bb_hit(url,name,sid,tab,timestamp);`;
    await this.db.query`CREATE INDEX if not exists  "bb_hit_timestamp" ON "bb_hit" ("timestamp");`;
    await this.db.query`CREATE INDEX if not exists  "bb_hit_name" ON "bb_hit" ("name");`;
  }

  private jsonSizeKb(json) {
    return Buffer.byteLength(JSON.stringify(json)) / 1024;
  }

  async save(hits: BLSessionEvent[], reference:string) {
    const hitsToSave: BLSessionEvent[] = [];
    hits.forEach((h) => {
      const { url, sid, tab, timestamp, type, name, ...data } = h;
      if (this.jsonSizeKb(h) > 5) {
        const data_path = eventPath(h);
        hitsToSave.push({ url, sid, tab, timestamp, type, name, data: {}, data_path, reference });
      } else hitsToSave.push({ url, sid, tab, timestamp, type, name, data, reference });
    });
    await this.hits.bulkCreate(hitsToSave);
  }
}
