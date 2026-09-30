import { Module } from '@nestjs/common';
import { AuthorizationModule } from './authorization/authorization.module';
import { PinoLoggerModule } from '@SergeyLys/tracker-pinno-logger';
import { SequelizeModule } from '@nestjs/sequelize';
import { RefreshTokens } from './authorization/entities/refresh-token.entity';

@Module({
  imports: [
    PinoLoggerModule,
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: Number(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USERNAME || 'auth_user',
      password: process.env.DATABASE_PASSWORD || 'auth_password',
      database: process.env.DATABASE_NAME || 'auth_db',
      models: [RefreshTokens],
      autoLoadModels: true,
    }),
    AuthorizationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
