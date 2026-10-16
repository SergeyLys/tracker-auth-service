import { Module } from '@nestjs/common';
import { AuthorizationModule } from './authorization/authorization.module';
import { PinoLoggerModule } from '@SergeyLys/tracker-pinno-logger';
import { SequelizeModule } from '@nestjs/sequelize';
import { RefreshTokens } from './authorization/entities/refresh-token.entity';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token/token.module';
import { readFileSync } from 'node:fs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      models: [RefreshTokens],
      autoLoadModels: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: true,
          ca: readFileSync(
            process.env.DB_SSL_CA_PATH ?? '/app/certs/global-bundle.pem',
            'utf8',
          ),
        },
      },
    }),
    PinoLoggerModule,
    TokenModule,
    AuthorizationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
