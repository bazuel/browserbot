import { Controller, Get, Post, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { SessionService } from './session.service';
import { BLSessionEvent } from '@browserbot/model';
import {domainFromUrl, eventId, streamToBuffer, unzipJson} from 'browserbot-common';
import { HitService } from './hit.service';
import { StorageService } from '@browserbot/backend-shared';
import { TimeService } from '../time/time.service';

@Controller('session')
export class SessionController {
  constructor(
    private sessionService: SessionService,
    private hitService: HitService,
    private storageService: StorageService,
    private timeService: TimeService
  ) {}

  @Get('download')
  async download(@Res({ passthrough: true }) res, @Query('path') path) {
    const stream = await this.sessionService.sessionStream(path);
    const filename = path.split('/').pop();
    (res as any).header('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(stream);
  }

  @Post('upload')
  async uploadFile(@Req() req, @Res() res): Promise<any> {
    if (!req.isMultipart()) throw new Error('Not a multipart request');

    const data: {
      file;
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
    } = await req.file();
    const zipFile = data.file;
    //const url = data.fields['url']?.value;
    const zipBuffer = await streamToBuffer(zipFile as ReadableStream);
    const events: BLSessionEvent[] = await unzipJson(zipBuffer);
    const reference = eventId(events[0]!);
    const path = `${domainFromUrl(
      events[0]!.url
    )}/${this.timeService.todayAsString()}/${reference}.zip`;
    this.hitService.save(events, reference);
    this.storageService.upload(zipBuffer, path);
    /*
    
    const { path, id } = await this.sessionService.saveSession(
      zipFile,
      url
    );
    console.log('path: ', path);
     */
    res.send({ ok: true, path, reference });
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
    const path = session.path.replace('.zip', '/info.json');
    return await this.getStreamByPath(path, res);
  }

  private async getStreamByPath(path, res) {
    const stream = await this.sessionService.sessionStream(path);
    const filename = path.split('/').pop();
    (res as any).header('Content-Disposition', `attachment; filename="${filename}";`);
    return new StreamableFile(stream);
  }

  @Get('all')
  async getAll(@Res({ passthrough: true }) res, @Query('id') id) {
    return await this.sessionService.getAll();
  }
}
