import { Injectable, Logger } from '@nestjs/common';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { createDynamoClient, getIncidentConfig } from '../config';

export type HealthStatus = 'ok' | 'degraded';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly config = getIncidentConfig();
  private readonly dynamoClient = createDynamoClient(this.config.aws);

  async check() {
    const server = {
      status: 'ok' as HealthStatus,
      timestamp: new Date().toISOString(),
    };

    const [dynamo] = await Promise.all([this.checkDynamo()]);

    const overall: HealthStatus = dynamo.status === 'ok' ? 'ok' : 'degraded';

    if (overall !== 'ok') {
      this.logger.warn('Health check degraded');
    }

    return {
      status: overall,
      server,
      dynamodb: dynamo,
    };
  }

  private async checkDynamo() {
    try {
      await this.dynamoClient.send(
        new DescribeTableCommand({ TableName: this.config.tableName }),
      );
      return {
        status: 'ok',
        table: this.config.tableName,
        message: 'Table found',
      };
    } catch (error) {
      return {
        status: 'degraded',
        table: this.config.tableName,
        message: (error as Error).message,
      };
    }
  }
}
