import { Injectable } from '@nestjs/common';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentStatus } from './dto/incident.enums';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentEntity } from './entities/incident.entity';
import { createDynamoClient, createSqsClient, getIncidentConfig } from '../config/incidents.config';

const INCIDENT_PK_PREFIX = 'INCIDENT#';
const INCIDENT_SK = 'METADATA';
const DEFAULT_PAGE_LIMIT = 25;

@Injectable()
export class IncidentService {
  private readonly config = getIncidentConfig();
  private readonly docClient = DynamoDBDocumentClient.from(
    createDynamoClient(this.config.aws),
    {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    },
  );
  private readonly sqsClient = createSqsClient(this.config.aws);

  async create(createIncidentDto: CreateIncidentDto) {
    const now = new Date().toISOString();
    const id = randomUUID();
    const incident: IncidentEntity = {
      id,
      title: createIncidentDto.title,
      description: createIncidentDto.description,
      erpModule: createIncidentDto.erpModule,
      environment: createIncidentDto.environment,
      businessUnit: createIncidentDto.businessUnit,
      status: IncidentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          PK: `${INCIDENT_PK_PREFIX}${id}`,
          SK: INCIDENT_SK,
          ...incident,
        },
      }),
    );

    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: this.config.queueUrl,
        MessageBody: JSON.stringify({ incidentId: id }),
      }),
    );

    return { id, status: incident.status };
  }

  async findAll(limit = DEFAULT_PAGE_LIMIT, nextToken?: string) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : DEFAULT_PAGE_LIMIT;
    const exclusiveStartKey = nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8')) : undefined;

    const response = await this.docClient.send(
      new ScanCommand({
        TableName: this.config.tableName,
        Limit: safeLimit,
        ExclusiveStartKey: exclusiveStartKey,
        FilterExpression: 'begins_with(PK, :pkPrefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':pkPrefix': INCIDENT_PK_PREFIX,
          ':sk': INCIDENT_SK,
        },
      }),
    );

    const items = (response.Items ?? []).map(({ PK, SK, ...rest }) => rest) as IncidentEntity[];
    const token = response.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(response.LastEvaluatedKey), 'utf-8').toString('base64')
      : undefined;

    return { items, nextToken: token };
  }

  async findOne(id: string) {
    const response = await this.docClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: {
          PK: `${INCIDENT_PK_PREFIX}${id}`,
          SK: INCIDENT_SK,
        },
      }),
    );

    if (!response.Item) {
      return null;
    }

    const { PK, SK, ...rest } = response.Item;
    return rest as IncidentEntity;
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto) {
    const now = new Date().toISOString();

    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ':updatedAt': now,
    };

    for (const [key, value] of Object.entries(updateIncidentDto)) {
      if (value === undefined) {
        continue;
      }
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }

    const response = await this.docClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: {
          PK: `${INCIDENT_PK_PREFIX}${id}`,
          SK: INCIDENT_SK,
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }),
    );

    const attributes = response.Attributes ?? {};
    const { PK, SK, ...rest } = attributes;
    return rest as IncidentEntity;
  }

  async remove(id: string) {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: {
          PK: `${INCIDENT_PK_PREFIX}${id}`,
          SK: INCIDENT_SK,
        },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': IncidentStatus.FAILED,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );

    return { id };
  }
}
