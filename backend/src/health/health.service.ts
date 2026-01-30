import { Injectable, Logger } from '@nestjs/common';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { ListFunctionsCommand } from '@aws-sdk/client-lambda';
import {
  createDynamoClient,
  createLambdaClient,
  createSqsClient,
  getIncidentConfig,
} from '../config';

export type HealthStatus = 'ok' | 'degraded';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly config = getIncidentConfig();
  private readonly dynamoClient = createDynamoClient(this.config.aws);
  private readonly sqsClient = createSqsClient(this.config.aws);
  private readonly lambdaClient = createLambdaClient(this.config.aws);

  async check() {
    const server = { status: 'ok' as HealthStatus, timestamp: new Date().toISOString() };

    const [dynamo, sqs, lambda] = await Promise.all([
      this.checkDynamo(),
      this.checkSqs(),
      this.checkLambda(),
    ]);

    const overall: HealthStatus =
      dynamo.status === 'ok' && sqs.status === 'ok' && lambda.status === 'ok'
        ? 'ok'
        : 'degraded';

    if (overall !== 'ok') {
      this.logger.warn('Health check degraded');
    }

    return {
      status: overall,
      server,
      dynamodb: dynamo,
      sqs,
      lambda,
    };
  }

  private async checkDynamo() {
    try {
      const response = await this.dynamoClient.send(
        new ListTablesCommand({ Limit: 100 }),
      );
      const tables = response.TableNames ?? [];
      const hasTable = tables.includes(this.config.tableName);
      return {
        status: hasTable ? 'ok' : 'degraded',
        table: this.config.tableName,
        message: hasTable ? 'Table found' : 'Table not found',
      };
    } catch (error) {
      return {
        status: 'degraded',
        table: this.config.tableName,
        message: (error as Error).message,
      };
    }
  }

  private async checkSqs() {
    try {
      await this.sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: this.config.queueUrl,
          AttributeNames: ['QueueArn'],
        }),
      );
      return {
        status: 'ok',
        queueUrl: this.config.queueUrl,
        message: 'Queue reachable',
      };
    } catch (error) {
      return {
        status: 'degraded',
        queueUrl: this.config.queueUrl,
        message: (error as Error).message,
      };
    }
  }

  private async checkLambda() {
    try {
      const response = await this.lambdaClient.send(
        new ListFunctionsCommand({ MaxItems: 10 }),
      );
      return {
        status: 'ok',
        functionCount: response.Functions?.length ?? 0,
        message: 'Lambda reachable',
      };
    } catch (error) {
      return {
        status: 'degraded',
        functionCount: 0,
        message: (error as Error).message,
      };
    }
  }
}
