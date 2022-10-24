import { Injectable } from '@nestjs/common';
import { TimeService } from '../time/time.service';
import { PostgresDbService, sql } from '../shared/postgres-db.service';
import { CrudService } from '../shared/crud.service';
import { BLEventName, BLEventType, BLSessionEvent } from '@browserbot/model';
import { eventPath } from 'browserbot-common';
import { StorageService } from '@browserbot/backend-shared/dist';

export interface BBEvent {
  bb_eventid: number;
  reference: string;
  url: string;
  name: BLEventName;
  type: BLEventType;
  sid: number;
  tab: number;
  timestamp: number;
  scope?: { [key: string]: any };
  data?: (BLSessionEvent & { [key: string]: any }) | {};
  data_path?: string; // a url pointing to a (BLSessionEvent & { [key: string]: any });
  created: Date | null;
}

@Injectable()
export class EventService {
  private eventTable: CrudService<BBEvent>;
  private table = 'bb_event';
  private id = 'bb_eventid';

  constructor(
    private timeService: TimeService,
    private db: PostgresDbService,
    private storageService: StorageService
  ) {
    this.eventTable = new CrudService<BBEvent>(db, this.table, this.id);
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
    await this.db
      .query`CREATE INDEX if not exists  "bb_event_timestamp" ON "bb_event" ("timestamp");`;
    await this.db.query`CREATE INDEX if not exists  "bb_event_name" ON "bb_event" ("name");`;
  }

  private jsonSizeKb(json) {
    return Buffer.byteLength(JSON.stringify(json)) / 1024;
  }

  async save(hits: BLSessionEvent[], reference: string) {
    if (hits.length == 1) await this.eventTable.create(this.handleSize(hits[0], reference));
    else {
      const hitsToSave: BLSessionEvent[] = [];
      hits.forEach((h) => {
        hitsToSave.push(this.handleSize(h, reference));
      });
      await this.eventTable.bulkCreate(hitsToSave);
    }
  }

  async findByField(field: keyof BBEvent, value: string) {
    return await this.eventTable.findByField(field, value);
  }

  async findByFields(fieldsMap) {
    return await this.eventTable.findByFields(fieldsMap);
  }

  async findById(id) {
    return await this.eventTable.findById(id);
  }

  async readByPath(path: string) {
    return await this.storageService.read(path);
  }

  private handleSize(h: BLSessionEvent, reference: string) {
    const { url, sid, tab, timestamp, type, name, ...data } = h;
    if (this.jsonSizeKb(h) > 5) {
      const data_path = eventPath(h);
      return { url, sid, tab, timestamp, type, name, data: {}, data_path, reference };
    } else return { url, sid, tab, timestamp, type, name, data, reference };
  }
}