/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import {
  IncidentCategory,
  IncidentStatus,
  Severity,
} from './dto/incident.enums';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentEntity } from './entities/incident.entity';
import { createDynamoClient, getIncidentConfig } from '../config';
import { buildUpdateExpression } from '../shared/dynamo/update-expression';
import {
  createOpenAIClient,
  createUserPrompt,
  runEnrichment,
} from '../openai/openai-client';

const INCIDENT_PK_PREFIX = 'INCIDENT#';
const INCIDENT_SK = 'METADATA';
const DEFAULT_PAGE_LIMIT = 25;

@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);
  private readonly config = getIncidentConfig();
  private readonly docClient = DynamoDBDocumentClient.from(
    createDynamoClient(this.config.aws),
    {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    },
  );
  private readonly openai = createOpenAIClient(this.config.openAiApiKey);

  private parseAiResponse(content: string) {
    try {
      const parsed = JSON.parse(content);
      return {
        severity: (parsed.severity as Severity) ?? Severity.P3,
        category:
          (parsed.category as IncidentCategory) ?? IncidentCategory.UNKNOWN,
        summary:
          typeof parsed.summary === 'string' ? parsed.summary : undefined,
        suggestion:
          typeof parsed.suggestion === 'string' ? parsed.suggestion : undefined,
      };
    } catch {
      return {
        severity: Severity.P3,
        category: IncidentCategory.UNKNOWN,
      };
    }
  }

  async create(createIncidentDto: CreateIncidentDto) {
    const now = new Date().toISOString();
    const id = randomUUID();
    this.logger.debug(`Create incident request received incidentId=${id}`);
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
    this.logger.debug(`Incident persisted to DynamoDB incidentId=${id}`);

    const aiContent = await runEnrichment(
      this.openai,
      this.config.openAiModel,
      createUserPrompt(incident.title, incident.description),
    );
    const enrichment = this.parseAiResponse(aiContent);
    const {
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    } = buildUpdateExpression(
      {
        status: IncidentStatus.ENRICHED,
        severity: enrichment.severity,
        category: enrichment.category,
        summary: enrichment.summary ?? null,
        suggestion: enrichment.suggestion ?? null,
      },
      { addUpdatedAt: true },
    );

    await this.docClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: {
          PK: `${INCIDENT_PK_PREFIX}${id}`,
          SK: INCIDENT_SK,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    );

    incident.status = IncidentStatus.ENRICHED;
    incident.severity = enrichment.severity;
    incident.category = enrichment.category;
    incident.summary = enrichment.summary;
    incident.suggestion = enrichment.suggestion;
    const updatedAtValue = expressionAttributeValues[':updatedAt'];
    incident.updatedAt =
      typeof updatedAtValue === 'string' ? updatedAtValue : incident.updatedAt;

    this.logger.log(`Incident created incidentId=${id}`);
    return incident;
  }

  async findAll(limit = DEFAULT_PAGE_LIMIT, nextToken?: string) {
    this.logger.debug('List incidents request received');
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(limit, 100)
        : DEFAULT_PAGE_LIMIT;
    const exclusiveStartKey = nextToken
      ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8'))
      : undefined;

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

    const items = (response.Items ?? []).map(
      ({ PK, SK, ...rest }) => rest,
    ) as IncidentEntity[];
    const token = response.LastEvaluatedKey
      ? Buffer.from(
          JSON.stringify(response.LastEvaluatedKey),
          'utf-8',
        ).toString('base64')
      : undefined;

    this.logger.debug(`List incidents response count=${items.length}`);
    return { items, nextToken: token };
  }

  async findOne(id: string) {
    this.logger.debug(`Fetch incident request received incidentId=${id}`);
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
      this.logger.warn(`Incident not found incidentId=${id}`);
      return null;
    }

    const { PK, SK, ...rest } = response.Item;
    this.logger.log(`Incident fetched incidentId=${id}`);
    return rest;
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto) {
    this.logger.debug(`Update incident request received incidentId=${id}`);
    const {
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    } = buildUpdateExpression<UpdateIncidentDto>(updateIncidentDto);

    const response = await this.docClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: {
          PK: `${INCIDENT_PK_PREFIX}${id}`,
          SK: INCIDENT_SK,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }),
    );

    const attributes = response.Attributes ?? {};
    const { PK, SK, ...rest } = attributes;
    this.logger.log(`Incident updated incidentId=${id}`);
    return rest;
  }

  async remove(id: string) {
    this.logger.warn(`Remove incident requested incidentId=${id}`);
    try {
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
      this.logger.log(`Incident removed incidentId=${id}`);
    } catch (error) {
      this.logger.error(
        `Incident remove failed incidentId=${id}`,
        (error as Error).stack,
      );
      throw error;
    }

    return { id };
  }
}
