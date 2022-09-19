import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Get('download')
  async download(
    @Res({ passthrough: true }) res,
    @Query('path') path,
  ) {
    const stream = await this.sessionService.sessionStream(path);
    const filename = path.split('/').pop();
    (res as any).header(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    return new StreamableFile(stream);
  }

  @Post('upload')
  async uploadFile(@Req() req, @Res() res) {
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

    const { path } = await this.sessionService.saveSession(
      data.file,
      data.fields['url']?.value,
    );
    console.log('path: ', path);
    res.send({ ok: true, path });
  }
}
