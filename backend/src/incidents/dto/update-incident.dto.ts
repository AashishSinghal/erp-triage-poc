import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateIncidentDto } from './create-incident.dto';
import { IncidentStatus } from './incident.enums';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}
