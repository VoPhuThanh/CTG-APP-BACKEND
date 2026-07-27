import { QueryRunner } from 'typeorm';
import { AddContactPageSupport1785214800000 } from '../../database/migrations/1785214800000-add-contact-page-support';

describe('contact page migration banner placement', () => {
  it('adds contact to the PostgreSQL banner placement enum', async () => {
    const sql: string[] = [];
    const runner = {
      query: jest.fn((statement: string) => {
        sql.push(statement);
        return Promise.resolve([]);
      }),
    } as unknown as QueryRunner;

    await new AddContactPageSupport1785214800000().up(runner);

    expect(sql.join('\n')).toContain(
      `ALTER TYPE "public"."banners_placement_enum" ADD VALUE IF NOT EXISTS 'contact'`,
    );
  });
});
