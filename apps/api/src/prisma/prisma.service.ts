import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@leetrack/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication): void {
    // Cast due to Prisma's event generic type inference in TS
    (this as unknown as { $on: (event: 'beforeExit', cb: () => Promise<void>) => void }).$on(
      'beforeExit',
      async () => {
        await app.close();
      },
    );
  }
}
