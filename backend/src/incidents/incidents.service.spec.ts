import { Test, TestingModule } from '@nestjs/testing';
import { IncidentService } from './incidents.service';

describe('IncidentService', () => {
  let service: IncidentService;

  beforeEach(async () => {
    process.env.DYNAMODB_TABLE_NAME = 'incidents-test';
    process.env.OPENAI_API_KEY = 'test-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentService],
    }).compile();

    service = module.get<IncidentService>(IncidentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
