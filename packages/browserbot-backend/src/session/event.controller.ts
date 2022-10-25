import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import { PostgresDbService } from '../shared/services/postgres-db.service';
import { HasPermission } from '../shared/token.decorator';
import { SessionService } from './session.service';
import { EventService } from './event.service';

@Controller('event')
export class EventController {
  constructor(
    private db: PostgresDbService,
    private sessionService: SessionService,
    private eventService: EventService
  ) {}

  @Get('download-session')
  @HasPermission('download')
  async downloadSession(@Res({ passthrough: true }) res, @Query('path') path) {
    const stream = await this.sessionService.sessionStream(path);
    const filename = path.split('/').pop();
    (res as any).header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(stream);
  }

  @Get('download-preview')
  @HasPermission('download')
  async downloadPreview(@Query() fieldsMap) {
    await this.eventService.findByFields(fieldsMap);
  }

  @Get('download-event-details')
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
}
