import { Body, Controller, Get, Post, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { SessionService } from './session.service';
import { BLSessionEvent } from '@browserbot/model';
import { eventReference, pathFromReference, streamToBuffer, unzipJson } from 'browserbot-common';
import { EventService } from './event.service';

type MultipartFile = {
  file: ReadableStream;
  fileField: string;
  filename: string;
  mimetype: string;
  fields: {
    [key: string]: {
      encoding: string;
      fieldname: string;
      fieldnameTruncated: false;
      mimetype: string;
      value: string;
      valueTruncated: boolean;
    };
  };
};

@Controller('session')
export class SessionController {
  constructor(private sessionService: SessionService, private eventService: EventService) {}

  @Get('download')
  async download(@Res({ passthrough: true }) res, @Query('path') path) {
    const stream = await this.sessionService.sessionStream(path);
    const filename = path.split('/').pop();
    (res as any).header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(stream);
  }

  @Post('upload')
  async upload(@Req() req, @Res() res): Promise<any> {
    if (!req.isMultipart()) throw new Error('Not a multipart request');
    const data: MultipartFile = await req.file();
    const zipBuffer = await streamToBuffer(data.file);
    const events: BLSessionEvent[] = await unzipJson(zipBuffer);
    const reference = eventReference(events[0]);
    const url = events[0].url;
    this.eventService.save(events, reference);
    this.sessionService.save(zipBuffer, url, reference);
    console.log('path: ', encodeURIComponent(pathFromReference(reference)));
    console.log('reference: ', reference);
    res.send({ ok: true, reference });
  }

  @Post('link')
  async link(@Body() body: string) {
    const data = JSON.parse(body);
    await this.sessionService.link(data.masterPath, data.newPath);
    return { ok: true };
  }

  @Get('screenshot')
  async getScreenshot(@Res({ passthrough: true }) res, @Query('path') path) {
    return await this.getStreamByPath(path + '.png', res);
  }

  @Get('video')
  async getVideo(@Res({ passthrough: true }) res: Response, @Query('path') path) {
    return await this.getStreamByPath(path + '.webm', res);
  }

  @Get('dom')
  async getDom(@Res({ passthrough: true }) res, @Query('path') path) {
    return await this.getStreamByPath(path + '.json', res);
  }

  @Get('info-by-path')
  async getInfoByPath(@Res({ passthrough: true }) res, @Query('path') path) {
    return await this.getStreamByPath(path + '/info.json', res);
  }

  @Get('info-by-id')
  async getInfoById(@Res({ passthrough: true }) res, @Query('id') id) {
    const session = await this.sessionService.findById(id);
    const path = session.reference.replace('.zip', '/info.json');
    return await this.getStreamByPath(path, res);
  }

  @Get('all')
  async getAll(@Res({ passthrough: true }) res, @Query('id') id) {
    return await this.sessionService.all(0, 500);
  }

  private async getStreamByPath(path, res) {
    const stream = await this.sessionService.sessionStream(path);
    const filename = path.split('/').pop();
    (res as any).header('Content-Disposition', `attachment; filename="${filename}";`);
    return new StreamableFile(stream);
  }
}
