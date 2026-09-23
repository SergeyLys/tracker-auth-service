import { Module } from '@nestjs/common';
import { AuthorizationModule } from './authorization/authorization.module';
import { PinoLoggerModule } from '@SergeyLys/tracker-pinno-logger';

@Module({
  imports: [AuthorizationModule, PinoLoggerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
