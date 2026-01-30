import { Test, TestingModule } from '@nestjs/testing';
import { IncidentController } from './incidents.controller';
import { IncidentService } from './incidents.service';

describe('IncidentController', () => {
  let controller: IncidentController;

  beforeEach(async () => {
    process.env.DYNAMODB_TABLE_NAME = 'incidents-test';
    process.env.SQS_QUEUE_URL = 'http://localhost:4566/000000000000/incidents-test';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentController],
      providers: [IncidentService],
    }).compile();

    controller = module.get<IncidentController>(IncidentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
