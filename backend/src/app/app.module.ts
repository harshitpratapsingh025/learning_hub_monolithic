import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import {} from './config';
import { ConfigModule } from '@nestjs/config';
import {
  AuthModule,
  ContentModule,
  PermissionsModule,
  RolesModule,
  UserRolesModule,
  UsersModule,
} from './modules';
import { validationSchema, mongoConfig } from './config';
import {
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
  AllExceptionsFilter,
  LoggingInterceptor,
} from './common';
import { TestsModule } from './modules/tests';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema,
      load: [configuration],
      validationOptions: {
        abortEarly: true, // stop at first error
      },
      envFilePath: `.env`,
    }),
    MongooseModule.forRootAsync({
      useFactory: mongoConfig,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    UsersModule,
    RolesModule,
    PermissionsModule,
    UserRolesModule,
    AuthModule,
    ContentModule,
    TestsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // Global Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
