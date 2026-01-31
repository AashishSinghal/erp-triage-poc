/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
  Environment,
  ErpModule,
  IncidentCategory,
  IncidentStatus,
  Severity,
} from './dto/incident.enums';
import { IncidentQueryDto } from './dto/incident-query.dto';
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
const DEFAULT_SORT_BY: 'createdAt' | 'updatedAt' = 'updatedAt';
const DEFAULT_SORT_ORDER: 'asc' | 'desc' = 'desc';

type IncidentQuery = IncidentQueryDto;

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

  private buildIncidentKey(id: string) {
    return {
      PK: `${INCIDENT_PK_PREFIX}${id}`,
      SK: INCIDENT_SK,
    };
  }

  private async updateIncident(
    id: string,
    updates: Partial<IncidentEntity>,
    options: { addUpdatedAt?: boolean } = { addUpdatedAt: true },
  ) {
    const {
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    } = buildUpdateExpression(updates, options);

    await this.docClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: this.buildIncidentKey(id),
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    );

    const updatedAtValue = expressionAttributeValues[':updatedAt'];
    return {
      ...updates,
      updatedAt:
        typeof updatedAtValue === 'string' ? updatedAtValue : undefined,
    };
  }

  private async markIncidentFailed(id: string) {
    const updatedAt = new Date().toISOString();
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: this.buildIncidentKey(id),
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': IncidentStatus.FAILED,
          ':updatedAt': updatedAt,
        },
      }),
    );
    return updatedAt;
  }

  private buildScanFilters(query: IncidentQuery, includeSearch = true) {
    const filterExpressions: string[] = [
      'begins_with(PK, :pkPrefix)',
      'SK = :sk',
    ];
    const expressionAttributeValues: Record<string, unknown> = {
      ':pkPrefix': INCIDENT_PK_PREFIX,
      ':sk': INCIDENT_SK,
    };
    const expressionAttributeNames: Record<string, string> = {};

    if (!query.status) {
      filterExpressions.push('#status <> :deletedStatus');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':deletedStatus'] = IncidentStatus.DELETED;
    }

    if (includeSearch && query.search) {
      filterExpressions.push(
        '(contains(#title, :search) OR contains(#description, :search))',
      );
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':search'] = query.search;
    }

    if (query.erpModule) {
      filterExpressions.push('#erpModule = :erpModule');
      expressionAttributeNames['#erpModule'] = 'erpModule';
      expressionAttributeValues[':erpModule'] = query.erpModule;
    }

    if (query.environment) {
      filterExpressions.push('#environment = :environment');
      expressionAttributeNames['#environment'] = 'environment';
      expressionAttributeValues[':environment'] = query.environment;
    }

    if (query.status) {
      filterExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = query.status;
    }

    if (query.severity) {
      filterExpressions.push('#severity = :severity');
      expressionAttributeNames['#severity'] = 'severity';
      expressionAttributeValues[':severity'] = query.severity;
    }

    return {
      filterExpression: filterExpressions.join(' AND '),
      expressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0
          ? expressionAttributeNames
          : undefined,
      expressionAttributeValues,
    };
  }

  private applySearchFilter(items: IncidentEntity[], term?: string) {
    if (!term) {
      return items;
    }
    const normalized = term.toLowerCase();
    return items.filter((item) => {
      const title = item.title?.toLowerCase() ?? '';
      const description = item.description?.toLowerCase() ?? '';
      return title.includes(normalized) || description.includes(normalized);
    });
  }

  private decodeOffsetToken(token?: string) {
    if (!token) {
      return 0;
    }
    try {
      const parsed: unknown = JSON.parse(
        Buffer.from(token, 'base64').toString('utf-8'),
      );
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'offset' in parsed &&
        typeof (parsed as { offset?: unknown }).offset === 'number'
      ) {
        return (parsed as { offset: number }).offset;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private encodeOffsetToken(offset: number) {
    return Buffer.from(JSON.stringify({ offset }), 'utf-8').toString('base64');
  }

  private async scanAllIncidents(
    scanFilters: ReturnType<typeof this.buildScanFilters>,
  ) {
    const items: IncidentEntity[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const response = await this.docClient.send(
        new ScanCommand({
          TableName: this.config.tableName,
          Limit: 200,
          ExclusiveStartKey: exclusiveStartKey,
          FilterExpression: scanFilters.filterExpression,
          ExpressionAttributeNames: scanFilters.expressionAttributeNames,
          ExpressionAttributeValues: scanFilters.expressionAttributeValues,
        }),
      );

      const batch = (response.Items ?? []).map(
        ({ PK, SK, ...rest }) => rest,
      ) as IncidentEntity[];
      items.push(...batch);
      exclusiveStartKey = response.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return items;
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

    try {
      const aiContent = await runEnrichment(
        this.openai,
        this.config.openAiModel,
        createUserPrompt(incident.title, incident.description),
      );
      const enrichment = this.parseAiResponse(aiContent);
      const updateResult = await this.updateIncident(id, {
        status: IncidentStatus.ENRICHED,
        severity: enrichment.severity,
        category: enrichment.category,
        summary: enrichment.summary ?? null,
        suggestion: enrichment.suggestion ?? null,
      });

      incident.status = IncidentStatus.ENRICHED;
      incident.severity = enrichment.severity;
      incident.category = enrichment.category;
      incident.summary = enrichment.summary;
      incident.suggestion = enrichment.suggestion;
      if (updateResult.updatedAt) {
        incident.updatedAt = updateResult.updatedAt;
      }
    } catch (error) {
      this.logger.error(
        `Incident enrichment failed incidentId=${id}`,
        (error as Error).stack,
      );
      const updatedAt = await this.markIncidentFailed(id);
      incident.status = IncidentStatus.FAILED;
      incident.updatedAt = updatedAt;
    }

    this.logger.log(`Incident created incidentId=${id}`);
    return incident;
  }

  async findAll(query: IncidentQuery = {}) {
    this.logger.debug('List incidents request received');
    this.logger.debug(
      `List incidents query search=${query.search ?? ''} erpModule=${query.erpModule ?? ''} environment=${query.environment ?? ''} status=${query.status ?? ''} severity=${query.severity ?? ''} sortBy=${query.sortBy ?? ''} sortOrder=${query.sortOrder ?? ''} limit=${query.limit ?? ''}`,
    );
    const safeLimit =
      Number.isFinite(query.limit) && (query.limit as number) > 0
        ? Math.min(query.limit as number, 100)
        : DEFAULT_PAGE_LIMIT;
    const scanFilters = this.buildScanFilters(query, false);
    const offset = this.decodeOffsetToken(query.nextToken);
    const scannedItems = await this.scanAllIncidents(scanFilters);
    this.logger.debug(`List incidents scanned count=${scannedItems.length}`);
    const items = this.applySearchFilter(scannedItems, query.search);
    this.logger.debug(`List incidents search-matched count=${items.length}`);
    const sortBy = query.sortBy ?? DEFAULT_SORT_BY;
    const sortOrder = query.sortOrder ?? DEFAULT_SORT_ORDER;
    const sortedItems = [...items].sort((a, b) => {
      const left = typeof a[sortBy] === 'string' ? a[sortBy] : '';
      const right = typeof b[sortBy] === 'string' ? b[sortBy] : '';
      const leftTime = Date.parse(left);
      const rightTime = Date.parse(right);
      const comparison =
        Number.isNaN(leftTime) || Number.isNaN(rightTime)
          ? String(left).localeCompare(String(right))
          : leftTime - rightTime;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    const pagedItems = sortedItems.slice(offset, offset + safeLimit);
    this.logger.debug(
      `List incidents page offset=${offset} limit=${safeLimit} returned=${pagedItems.length}`,
    );
    const nextOffset = offset + safeLimit;
    const token =
      pagedItems.length > 0 && nextOffset < sortedItems.length
        ? this.encodeOffsetToken(nextOffset)
        : undefined;

    this.logger.debug(`List incidents response count=${pagedItems.length}`);
    return { items: pagedItems, nextToken: token };
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
    if (rest.status === IncidentStatus.DELETED) {
      this.logger.warn(`Incident deleted incidentId=${id}`);
      return null;
    }
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
      const deletedAt = new Date().toISOString();
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.config.tableName,
          Key: {
            PK: `${INCIDENT_PK_PREFIX}${id}`,
            SK: INCIDENT_SK,
          },
          UpdateExpression:
            'SET #status = :status, #updatedAt = :updatedAt, #deletedAt = :deletedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#updatedAt': 'updatedAt',
            '#deletedAt': 'deletedAt',
          },
          ExpressionAttributeValues: {
            ':status': IncidentStatus.DELETED,
            ':updatedAt': deletedAt,
            ':deletedAt': deletedAt,
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

  async retryEnrichment(id: string) {
    this.logger.debug(`Retry enrichment request received incidentId=${id}`);
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
      this.logger.warn(`Incident not found for retry incidentId=${id}`);
      return null;
    }

    const { PK, SK, ...rest } = response.Item as IncidentEntity & {
      PK: string;
      SK: string;
    };

    if (rest.status !== IncidentStatus.FAILED) {
      throw new BadRequestException(`Incident ${id} is not in FAILED status`);
    }

    try {
      const aiContent = await runEnrichment(
        this.openai,
        this.config.openAiModel,
        createUserPrompt(rest.title, rest.description),
      );
      const enrichment = this.parseAiResponse(aiContent);
      const updateResult = await this.updateIncident(id, {
        status: IncidentStatus.ENRICHED,
        severity: enrichment.severity,
        category: enrichment.category,
        summary: enrichment.summary ?? null,
        suggestion: enrichment.suggestion ?? null,
      });

      return {
        ...rest,
        status: IncidentStatus.ENRICHED,
        severity: enrichment.severity,
        category: enrichment.category,
        summary: enrichment.summary,
        suggestion: enrichment.suggestion,
        updatedAt: updateResult.updatedAt ?? rest.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Incident retry enrichment failed incidentId=${id}`,
        (error as Error).stack,
      );
      const updatedAt = await this.markIncidentFailed(id);
      return {
        ...rest,
        status: IncidentStatus.FAILED,
        updatedAt,
      };
    }
  }
}
