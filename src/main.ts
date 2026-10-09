import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { AuthorizationServiceTypes } from '@SergeyLys/tracker-contracts';
import { protoPath } from '@SergeyLys/tracker-contracts/paths';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: AuthorizationServiceTypes.protobufPackage,
      protoPath: join(
        protoPath,
        'authorization',
        'authorization-service.proto',
      ),
      loader: {
        includeDirs: [protoPath],
      },
      url: process.env.AUTH_SERVICE_GRPC_URL,
    },
  });

  await app.startAllMicroservices();
}
bootstrap();
