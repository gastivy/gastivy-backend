import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserModule } from './api/user/user.module';
import { AuthModule } from './api/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtMiddleware } from './middleware/jwt.middleware';
import { JwtSharedModule } from './common/modules/jwt.shared.module';
import { CategoriesModule } from './api/activity-app/categories/categories.module';
import { ActivityModule } from './api/activity-app/activity/activity.module';
import { CategoriesTransactionsModule } from './api/finance-app/categories/categories.module';
import typeorm from './config/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [typeorm] }), // for Load variable environment
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
    JwtSharedModule,
    UserModule,
    AuthModule,
    CategoriesModule,
    CategoriesTransactionsModule,
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
