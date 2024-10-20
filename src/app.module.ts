import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserModule } from './api/user/user.module';
import { AuthModule } from './api/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './api/user/user.entity';
import { JwtMiddleware } from './middleware/jwt.middleware';
import { JwtSharedModule } from './common/modules/jwt.shared.module';
import { CategoriesModule } from './api/categories/categories.module';
import { Categories } from './api/categories/categories.entity';
import { ActivityModule } from './api/activity/activity.module';
import { Activity } from './api/activity/activity.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // for Load variable environment
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, Categories, Activity],
      synchronize: true,
      keepConnectionAlive: true,
    }),
    JwtSharedModule,
    UserModule,
    AuthModule,
    CategoriesModule,
    ActivityModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude(
        { path: '/auth/login', method: RequestMethod.POST },
        { path: '/auth/register', method: RequestMethod.POST },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply middleware globally
  }
}
