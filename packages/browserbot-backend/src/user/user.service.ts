import { Injectable, OnModuleInit } from '@nestjs/common';
import { like, paginated, PostgresDbService, sql } from '../shared/services/postgres-db.service';
import { CryptService } from '../shared/services/crypt.service';
import { CrudService } from '../shared/services/crud.service';
import { BBUser } from '@browserbot/model';

@Injectable()
export class UserService extends CrudService<BBUser> implements OnModuleInit {
  protected table = 'bb_user';
  protected id = 'bb_userid';

  constructor(db: PostgresDbService, private crypt: CryptService) {
    super(db);
  }

  async onModuleInit() {
    await this.generateTable();
  }

  async generateTable() {
    console.log('generateTable: ', this.table);
    const tableExists = await this.db.tableExists(this.table);
    console.log(this.table + ' tableExists: ', tableExists);
    if (!tableExists)
      await this.db.query`
            create table if not exists ${sql(this.table)} (
                bb_userid  BIGSERIAL PRIMARY KEY,
                name text,
                surname text,
                email text,
                password text,
                roles jsonb,
                state text,
                phone text,
                api_token text,
                created TIMESTAMPTZ
            );
        `;
    const users = await this.all(0, 10);
    console.log('users: ', users);
    if (users.length == 0)
      await this.createUser({
        email: 'me@salvatoreromeo.com',
        password: this.crypt.hash('prova23424'),
        roles: ['ADMIN'],
        teams: [],
        surname: 'Romeo',
        name: 'Salvatore',
        state: 'ACTIVE',
        api_token: ''
      });
  }

  async createUser(user: BBUser) {
    let { teams, bb_userid, ...u } = user;
    if (!u.password) u.password = 'smith@' + Math.round(Math.random() * 1000);
    else u.password = this.crypt.hash(u.password);
    return this.create(u);
  }

  async allNonDeletedUsers(page: number, size: number) {
    return await this.db.query<BBUser>`select * from ${sql(
      this.table
    )} where state != 'DELETED' order by email ${paginated(page, size)}`;
  }

  async updateUserRoles(bb_userid: BBUser['bb_userid'], roles: string[]) {
    return await this.db.query`update ${sql(
      this.table
    )} set roles = ${roles} where bb_userid = ${bb_userid}`;
  }

  async updateUser(user: BBUser) {
    const { password, teams, ...u } = user;
    return await this.update(u);
  }

  async deleteUser(bb_userid: BBUser['bb_userid']) {
    return await this.db.query`delete from ${sql(this.table)} where bb_userid = ${bb_userid}`;
  }

  async findUserByEmail(email: string) {
    return await this.findByField('email', email);
  }

  async findUser(email: string, password: string) {
    let found = await this.findUserByEmail(email);
    if (found.length > 0) {
      let u = found[0];
      if (this.crypt.check(password, u.password)) {
        delete (u as any).password;
        return [u];
      }
    }
    return [];
  }

  async findUserByRole(role: string, page: number, size: number) {
    return await this.db.query<BBUser>`select * from ${sql(
      this.table
    )} where roles ? ${role} ${paginated(page, size)} `;
  }

  async countUsersByRole(role: string) {
    const result = await this.db.query<{
      count: number;
    }>`select count(*) from ${sql(this.table)} where roles ? ${role} `;
    return result[0].count;
  }

  async resetUserPassword(bb_userid: BBUser['bb_userid'], password: string) {
    return await this.db.query`update ${sql(this.table)} set password = ${this.crypt.hash(
      password
    )} where bb_userid = ${bb_userid}`;
  }

  async userWithEmailExists(email: string) {
    const result = await this.findUserByEmail(email);
    return result.length > 0;
  }

  async findUserByQuery(q: string) {
    return await this.db.query<BBUser>`select * from ${sql(this.table)} where 
${like('name', q)} 
or ${like('surname', q)}  
or ${like('email', q)} 
limit 100
`;
  }
}
