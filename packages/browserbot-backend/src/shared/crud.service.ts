import { like, paginated, PostgresDbService, sql } from './postgres-db.service';

export class CrudService<T> {
  constructor(
    protected db: PostgresDbService,
    private table: string,
    private id: string,
  ) {}

  async count() {
    const result = await this.db.query<{
      count: number;
    }>`select count(*) from ${sql(this.table)}`;
    return result[0].count;
  }

  async all<T>(page: number, size: number, options: { order?: string } = {}) {
    return await this.db.query<T>`select * from ${sql(this.table)} ${
      options.order ? sql`order by ${options.order}` : sql``
    }${paginated(page, size)}`;
  }

  async create(item: Partial<T>) {
    return this.db.query<any>`insert into ${sql(this.table)} ${sql({
      ...cleanUndefined(item as any),
      created: new Date(),
    })} returning ${sql(this.id)}` as any;
  }

  async update(item: Partial<T>) {
    return await this.db.query`update ${sql(this.table)} set ${sql(
      cleanUndefined(item) as any,
    )} where ${sql(this.id)} = ${item[this.id]}`;
  }

  async delete(id: string) {
    return await this.db.query`delete from ${sql(this.table)} where ${sql(
      this.id,
    )} = ${id}`;
  }

  async findById(id: string) {
    const items = await this.db.query<T>`select * from ${sql(
      this.table,
    )} where ${sql(this.id)} = ${id}`;
    return items[0];
  }

  async findByIds(ids: string[]): Promise<T[]> {
    const items = await this.db.query<T>`select * from ${sql(
      this.table,
    )} where ${sql(this.id)} IN ${sql(ids)}`;
    return items;
  }

  async findByField(
    field: keyof T,
    value: any,
    options: { page?: number; size?: number } = {},
  ) {
    /*
     * insert options because in future this method can used also for queries
     * */
    if (options === {}) {
      const items = await this.db.query<T>`select * from ${sql(
        this.table,
      )} where ${sql(field as string)} = ${value}`;
      return items;
    }
    const items = await this.db.query<T>`select * from ${sql(
      this.table,
    )} where ${sql(field as string)} = ${value}
            ${paginated(options.page, options.size)}`;
    return items;
  }

  async findByQuery(q: string, ...columns: (keyof T)[]) {
    return await this.db.query<T>`select * from ${sql(this.table)} where 
${[columns[0]].map((c) => sql` ${like(c as string, q)} `)}
${columns.slice(1).map((c) => sql` or ${like(c as string, q)} `)}
limit 100
`;
  }
}

function cleanUndefined(o) {
  Object.keys(o).forEach((key) => {
    if (o[key] === undefined) {
      delete o[key];
    }
  });
  return o;
}
