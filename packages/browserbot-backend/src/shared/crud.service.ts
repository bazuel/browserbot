import { like, paginated, PostgresDbService, sql } from './postgres-db.service';

export class CrudService<T> {
  constructor(protected db: PostgresDbService, private table: string, private id: string) {}

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
      created: new Date()
    })} returning ${sql(this.id)}` as any;
  }

  async update(item: Partial<T>) {
    return await this.db.query`update ${sql(this.table)} set ${sql(
      cleanUndefined(item) as any
    )} where ${sql(this.id)} = ${item[this.id]}`;
  }

  async delete(id: string) {
    return await this.db.query`delete from ${sql(this.table)} where ${sql(this.id)} = ${id}`;
  }

  async findById(id: string) {
    const items = await this.db.query<T>`select * from ${sql(this.table)} where ${sql(
      this.id
    )} = ${id}`;
    return items[0];
  }

  async findByIds(ids: string[]): Promise<T[]> {
    const items = await this.db.query<T>`select * from ${sql(this.table)} where ${sql(
      this.id
    )} IN ${sql(ids)}`;
    return items;
  }

  async findByField(field: keyof T, value: any, options: { page?: number; size?: number } = {}) {
    /*
     * insert options because in future this method can used also for queries
     * */
    if (Object.keys(options).length === 0) {
      const items = await this.db.query<T>`select * from ${sql(this.table)} where ${sql(
        field as string
      )} = ${value}`;
      return items;
    }
    const items = await this.db.query<T>`select * from ${sql(this.table)} where ${sql(
      field as string
    )} = ${value}
            ${paginated(options.page, options.size)}`;
    return items;
  }

  async findByFields(
    fieldsMap: { [key in keyof T]: string | number | Date },
    options: { page?: number; size?: number } = {}
  ) {
    const payload: { column: keyof T; value: string | number | any }[] = [];
    for (const c in fieldsMap) payload.push({ column: c, value: fieldsMap[c] });

    return await this.db.query<T>`select * 
       from ${sql(this.table)}
       where ${sql(payload[0].column as string)} = ${payload[0].value as string}
             ${
               payload.length == 1
                 ? sql``
                 : payload
                     .slice(1)
                     .map(
                       (elem) => sql` and ${sql(elem.column as string)} = ${elem.value as string}`
                     )
             }
             
       order by created desc
             
        ${paginated(options.page ?? 0, options.size ?? 100)}
       `;
  }

  async findByQuery(q: string, ...columns: (keyof T)[]) {
    return await this.db.query<T>`select * from ${sql(this.table)} where 
${[columns[0]].map((c) => sql` ${like(c as string, q)} `)}
${columns.slice(1).map((c) => sql` or ${like(c as string, q)} `)}
limit 100
`;
  }

  async bulkCreate(items: Partial<T>[] | any) {
    const itemsPlusCreated = items.map((i) => ({ ...i, created: new Date() }));
    // postgres handles at most 65k parameters per query, so we split the
    // items 1000 by 1000 assuming each items spends at most 65 parameters
    let from = 0;
    let to = 1000; // we proceed at bulk of 1000 items at a time
    do {
      let pack = itemsPlusCreated.slice(from, to);
      pack.forEach((i, index) => {
        const keys = Object.keys(i);
        const nullKeys = keys.filter((v) => v == null || v == undefined);
        if (nullKeys.length > 0) throw new Error(index + ' ' + JSON.stringify(i));
        const nullValues = keys.map((k) => i[k]).filter((v) => v == null || v == undefined);
        if (nullValues.length > 0) throw new Error(index + ' ' + JSON.stringify(i));
      });
      /*
      
      for (const p of pack) {
        const i = pack.indexOf(p);
        console.log(i,p)
        try{
          await this.create(p)
        } catch (e){
          console.log(e)
        }
      }
       */
      await this.db.query<any>`insert into ${sql(this.table)} ${sql(pack)}`;
      from = to;
      to = to + 1000;
    } while (to < itemsPlusCreated.length);
    try {
      let lastPack = itemsPlusCreated.slice(to - 1000);
      if (lastPack) await this.db.query<any>`insert into ${sql(this.table)} ${sql(lastPack)}`;
    } catch (e) {
      console.log(e);
    }
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
