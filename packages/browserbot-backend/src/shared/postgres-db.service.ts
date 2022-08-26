import { Injectable, OnModuleInit } from '@nestjs/common';
import * as postgres from 'postgres';

export interface DBConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

const { DB_HOST, DB_USRENAME, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
const config = {
  host: DB_HOST,
  user: DB_USRENAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: +DB_PORT,
};

export const paginated = (page: number, size = 20) =>
  sql` limit ${size} offset ${page * size}`;

export const like = (column:string, value:string) =>
  sql` ${sql(column)} like ${"%"+value+"%"} `;

export const sql = postgres({
  ...config,
  ssl: { rejectUnauthorized: false },
});

@Injectable()
export class PostgresDbService implements OnModuleInit {
  async onModuleInit() {
    await this.checkDB();
  }

  async query<T>(q: TemplateStringsArray, ...params: any[]) {
    console.log(`QUERY: ${q}`);
    console.log(`PARAMS: ${(params ?? []).join(', ')}`);
    let res = await sql(q, ...params);
    console.log(`RESULT: ${JSON.stringify(res)}`);
    return (res || []) as T[];
  }

  async checkDB() {
    const res = this.query`SELECT version()`;

    console.log('Postgres version: ', JSON.stringify(res));
  }

  async tableExists(tableName) {
    const tableExistData = await this.query<{ exists }>`
    SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = ${tableName}
   );`;
    return (
      tableExistData && tableExistData.length > 0 && tableExistData[0].exists
    );
  }
}
