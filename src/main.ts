import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SuccessResponseInterceptor } from './common/interceptors/http-success';
import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  UnauthorizedExceptionFilter,
} from './common/execptions/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe()); // Enable validation globally

  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(
    new BadRequestExceptionFilter(),
    new UnauthorizedExceptionFilter(),
    new NotFoundExceptionFilter(),
  );

  await app.listen(4000);
}
bootstrap();
