import { Test, TestingModule } from '@nestjs/testing';
import { IncidentService } from './incidents.service';

describe('IncidentService', () => {
  let service: IncidentService;

  beforeEach(async () => {
    process.env.DYNAMODB_TABLE_NAME = 'incidents-test';
    process.env.SQS_QUEUE_URL = 'http://localhost:4566/000000000000/incidents-test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentService],
    }).compile();

    service = module.get<IncidentService>(IncidentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
