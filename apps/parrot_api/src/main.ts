import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Needed to read the httpOnly media-access binding cookie on GET /media/stream/:token.
  app.use(cookieParser());
  // parrot-web and parrot-api are separate origins; credentials: true is required for the
  // browser to store/send the media-access cookie set by POST /media/refresh. `ng serve` now
  // defaults to the same port as compose (10700, see angular.json); 4200 stays in the default
  // list only as a fallback for `ng serve --port 4200`. PARROT_WEB_ORIGIN can be a comma-separated
  // list to add more.
  const webOrigins = (
    process.env.PARROT_WEB_ORIGIN ??
    'http://localhost:10700,http://localhost:4200'
  )
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: webOrigins, credentials: true });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
