import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL,
        }),
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
