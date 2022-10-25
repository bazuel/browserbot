import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { UserService } from './user.service';
import { CryptService } from '../shared/services/crypt.service';
import { EmailService } from '../shared/services/email.service';
import { ApiTokenData, TokenService } from '../shared/services/token.service';
import { Admin, HasToken } from '../shared/token.decorator';
import { BBUser } from '@browserbot/model';
import { ConfigService, StorageService } from '@browserbot/backend-shared';
import { MessagesService } from './messages.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly cryptService: CryptService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
    private readonly storageService: StorageService
  ) {
    console.log(configService);
  }

  @Post('login')
  async login(@Body() user: BBUser) {
    const found = await this.userService.findUser(
      user.email.trim().toLowerCase(),
      user.password.trim()
    );
    if (found.length > 0) {
      const token = this.tokenService.generate({
        id: this.cryptService.encode(+found[0].bb_userid),
        email: user.email,
        name: found[0].name,
        surname: found[0].surname,
        roles: found[0].roles
      });
      return { token };
    } else throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  @Post('request-registration')
  async register(
    @Body()
    user: BBUser
  ) {
    const result = await this.userService.createUser(user);
    const token = this.tokenService.generate({
      user,
      bb_userid: result[0].bb_userid
    });
    console.log('token: ', token);
    const link = this.configService.backend_url + '/api/user/register?token=' + token;
    await this.emailService.send(
      user.email,
      this.messagesService.email.welcomeSubject,
      this.messagesService.email.welcomeBody(user.name, link)
    );
    return { ok: true };
  }

  @Get('register')
  async confirmRegistration(@Query('token') token: string) {
    try {
      let data = this.tokenService.verify(token) as unknown as {
        user: BBUser;
        roles: string[];
        bb_userid: string;
      };
      console.log('data: ', data);
      const user = data.user;
      user.email = user.email.trim().toLowerCase();
      user.password = user.password.trim();
      const foundUser = await this.userService.findById(data.bb_userid);
      if (!foundUser) throw new HttpException(`Cannot find this user: ${token}`, 404);
      await this.userService.updateUserRoles(data.bb_userid, ['EMAIL_CONFIRMED', 'USER']);
      console.log('user saved into db');
      const loginToken = this.tokenService.generate({
        id: this.cryptService.encode(+data.bb_userid),
        email: user.email,
        roles: data.roles
      });
      return {
        url: `${this.configService.app_url}/app/dashboard?token=${loginToken}`
      };
    } catch {
      return {
        url: this.configService.app_url + '/app/error?error=' + token
      };
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body()
    { email }: { email: string }
  ) {
    const token = this.tokenService.generate({ email });
    const url = this.configService.app_url;
    const link = `${url}/auth/login?token=${token}`;
    await this.emailService.send(
      email.trim().toLowerCase(),
      this.messagesService.passwordForgot.emailSubject,
      this.messagesService.passwordForgot.emailBody(link)
    );
    return { ok: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetData: { token: string; password: string }) {
    const token = this.tokenService.verify(resetData.token);
    let user = await this.userService.findUserByEmail(token.email.trim().toLowerCase());
    await this.userService.resetUserPassword(user[0].bb_userid, resetData.password.trim());
    return { ok: true };
  }

  @Get('email-exists')
  async checkEmail(@Query('email') email: string) {
    let exists = await this.userService.userWithEmailExists(email.trim().toLowerCase());
    return { exists };
  }

  @Get('list')
  @UseGuards(Admin)
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('includeDeleted') includeDeleted: string
  ) {
    let users = [];
    if (includeDeleted == 'true') {
      users = await this.userService.all(page, size);
    } else users = await this.userService.allNonDeletedUsers(page, size);
    return users.map((u) => ({ ...u, password: '' }));
  }

  @Get('find')
  @UseGuards(Admin)
  async find(@Query('id') bb_userid: string) {
    const user = await this.userService.findById(bb_userid);
    delete user?.password;
    return user;
  }

  @Get('find-by-query')
  async findByQuery(@Query('q') q: string) {
    const users = await this.userService.findUserByQuery(q);
    users.forEach((u) => delete u.password);
    return users;
  }

  @Post('save')
  @UseGuards(Admin)
  async save(@Body() user: BBUser) {
    if (!user.bb_userid) {
      if (!user.state) user.state = 'ACTIVE';
      const result = await this.userService.createUser(user);
      return result;
    } else return await this.userService.updateUser(user);
  }

  @Get('find-users-by-id')
  @UseGuards(Admin)
  async findUserByIds(@Query('ids') ids: string) {
    let users = await this.userService.findByIds(ids.split(','));
    return users.map((u) => ({ ...u, password: '' }));
  }

  @Post('request-token-api-generation')
  @UseGuards(HasToken)
  async generateApiToken(
    @Req() request: Request,
    @Body()
    user: BBUser
  ) {
    const domain = new URL(request.url).hostname;
    const apiToken = this.tokenService.generate(
      <Partial<ApiTokenData>>{ user, api: ['all'], domain: domain },
      '1y'
    );
    await this.userService.updateUser({ ...user, api_token: apiToken });
    return apiToken;
  }

  @Get('get-permissions')
  @UseGuards(HasToken)
  async verifyApiToken(@Query('api-token') apiToken) {
    const blackList: string[] = (await this.storageService.read('/api-token/blacklist.json'))[
      'list'
    ];
    try {
      if (!blackList.includes(apiToken))
        return this.tokenService.verify<ApiTokenData>(apiToken).api;
      else return [];
    } catch (e) {
      throw new HttpException('Token not valid', HttpStatus.NOT_FOUND);
    }
  }
}
