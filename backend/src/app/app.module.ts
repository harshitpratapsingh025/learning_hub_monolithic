import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoConfig } from './config';
import { ConfigModule } from '@nestjs/config';
import { PermissionsModule } from './permissions/permissions.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { AuthModule } from './auth/auth.module';
import { validationSchema } from './config/validation.schema';
import { ContentModule } from './content/content.module';
import configuration from './config/configuration';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

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
    UsersModule,
    RolesModule,
    PermissionsModule,
    UserRolesModule,
    AuthModule,
    ContentModule,
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
  ],
})
export class AppModule {}
