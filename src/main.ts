import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SuccessResponseInterceptor } from './common/interceptors/http-success';
import {
  BadRequestExceptionFilter,
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  UnauthorizedExceptionFilter,
} from './common/execptions/exceptions';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://gastivy.my.id',
      'https://www.gastivy.my.id',
      'https://stg-lyceum.gastivy.my.id',
      'https://www.stg-lyceum.gastivy.my.id',
      'https://www.super-gastivy.gannaprasetya.com',
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
    maxAge: 0,
  });

  app.useGlobalPipes(new ValidationPipe()); // Enable validation globally

  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(
    new BadRequestExceptionFilter(),
    new UnauthorizedExceptionFilter(),
    new ForbiddenExceptionFilter(),
    new NotFoundExceptionFilter(),
  );
  app.use(cookieParser());

  await app.listen(4000);
}
bootstrap();
