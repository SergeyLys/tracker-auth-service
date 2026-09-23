import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { AuthorizationController } from './authorization.controller';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserServiceTypes } from '@SergeyLys/tracker-contracts';
import { join } from 'path';
import { protoPath } from '@SergeyLys/tracker-contracts/paths';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.PRIVATE_KEY || 'SECRET',
      signOptions: {
        expiresIn: '24h',
      },
    }),
    ClientsModule.register([
      {
        name: UserServiceTypes.USER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: UserServiceTypes.protobufPackage,
          url: process.env.USER_SERVICE_GRPC_URL,
          protoPath: join(protoPath, 'user', 'user-service.proto'),
          loader: {
            includeDirs: [protoPath],
          },
        },
      },
    ]),
  ],
  providers: [AuthorizationService],
  controllers: [AuthorizationController],
})
export class AuthorizationModule {}
