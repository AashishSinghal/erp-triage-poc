import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IncidentService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import {
  Environment,
  ErpModule,
  IncidentStatus,
  Severity,
} from './dto/incident.enums';

@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentService.create(createIncidentDto);
  }

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('nextToken') nextToken?: string,
    @Query('search') search?: string,
    @Query('erpModule') erpModule?: ErpModule,
    @Query('environment') environment?: Environment,
    @Query('status') status?: IncidentStatus,
    @Query('severity') severity?: Severity,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.incidentService.findAll({
      limit: parsedLimit,
      nextToken,
      search,
      erpModule,
      environment,
      status,
      severity,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const incident = await this.incidentService.findOne(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }
    return incident;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ) {
    return this.incidentService.update(id, updateIncidentDto);
  }

  @Post(':id/retry-enrichment')
  async retryEnrichment(@Param('id') id: string) {
    const incident = await this.incidentService.retryEnrichment(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }
    return incident;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentService.remove(id);
  }
}
