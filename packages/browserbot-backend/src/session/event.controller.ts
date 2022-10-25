import { Controller, Get, Query, Res } from '@nestjs/common';
import { PostgresDbService } from '../shared/services/postgres-db.service';
import { HasPermission } from '../shared/token.decorator';
import { SessionService } from './session.service';
import { BBEvent, EventService } from './event.service';
import { unzipJson } from 'browserbot-common';

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
    let { path, ...filters } = query;
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

  @Get('detailed')
  @HasPermission('download')
  async downloadDetails(@Query('id') id) {
    const event = await this.eventService.findById(id);
    if (Object.keys(event.data).length == 0)
      event.data = await this.eventService.readByPath(event.data_path);
    return event;
  }

  @Get('screenshot')
  @HasPermission('download')
  async downloadScreenshot(@Query('path') path) {
    return await this.eventService.readByPath(path);
  }

  @Get('run')
  @HasPermission('run')
  async run(@Query('path') path: string) {
    if (path) this.sessionService.run(path);
  }
}
