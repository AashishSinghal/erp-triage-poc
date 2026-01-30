import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ErpModule, Environment } from './incident.enums';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsEnum(ErpModule)
  erpModule: ErpModule;

  @IsEnum(Environment)
  environment: Environment;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessUnit?: string;
}
