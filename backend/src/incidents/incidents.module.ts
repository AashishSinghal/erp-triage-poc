import { Module } from '@nestjs/common';
import { IncidentService } from './incidents.service';
import { IncidentController } from './incidents.controller';

@Module({
  controllers: [IncidentController],
  providers: [IncidentService],
})
export class IncidentModule {}
