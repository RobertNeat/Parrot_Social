import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';

// Catches dependency-injection wiring mistakes (e.g. a guard needing a provider that isn't
// reachable from its module) that tsc/lint cannot see, since Nest resolves DI at runtime.
// DATABASE_URL points nowhere real - the pool only connects lazily on first query, never here.
describe('AppModule', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/unused';
  });

  it('compiles with all modules wired', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
