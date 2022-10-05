import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller("test")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("hello")
  getHello(): string {
    console.log("ciao a tutti")
    return this.appService.getHello() + Date.now();
  }
}
