import { Controller, Get, Query } from '@nestjs/common';
import { PostgresDbService } from '../shared/services/postgres-db.service';
import { HasPermission } from '../shared/token.decorator';
import { SessionService } from './session.service';
import { BBEvent, EventService } from './event.service';
import { BBSession, pathFromReference, unzipJson } from 'browserbot-common';

@Controller('event')
export class EventController {
  constructor(
    private db: PostgresDbService,
    private sessionService: SessionService,
    private eventService: EventService
  ) {}

  @Get()
  @HasPermission('download')
  async downloadPreview(@Query() fieldsMap) {
    await this.eventService.findByFields(fieldsMap);
  }

  @Get('session')
  @HasPermission('download')
  async downloadSession(@Query() query) {
    let { reference, ...filters } = query;
    const path = pathFromReference(reference);
    let eventList: BBEvent[] = await this.sessionService
      .sessionBuffer(path)
      .then((buffer) => unzipJson(buffer));
    eventList = eventList.filter((event) => {
      for (const key in filters) {
        if (event[key] != filters[key]) return false;
      }
      return true;
    });
    return eventList;
  }

  @Get('screenshot')
  @HasPermission('download')
  async downloadScreenshot(@Query('reference') reference) {
    const result = await this.eventService.readByReference(reference);
    return await unzipJson(result).then((result) => result[0]);
  }

  @Get('run')
  @HasPermission('run')
  async runSession(@Query('reference') reference: BBSession['reference']) {
    if (reference) this.sessionService.run(reference);
  }
}
