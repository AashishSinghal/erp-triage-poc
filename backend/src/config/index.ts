import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { SQSClient } from '@aws-sdk/client-sqs';

const DEFAULT_REGION = 'us-east-1';

export type AwsClientConfig = {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
};

export type IncidentConfig = {
  tableName: string;
  queueUrl: string;
  aws: AwsClientConfig;
};

const toBool = (value?: string) => value?.toLowerCase() === 'true';

const buildAwsConfig = (): AwsClientConfig => {
  const region = process.env.AWS_REGION ?? DEFAULT_REGION;
  const endpoint =
    process.env.AWS_ENDPOINT_URL ??
    process.env.AWS_ENDPOINT ??
    process.env.LOCALSTACK_ENDPOINT;
  const isLocal = toBool(process.env.AWS_LOCALSTACK) || Boolean(endpoint);

  if (!isLocal) {
    return { region };
  }

  return {
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
    },
  };
};

export const getIncidentConfig = (): IncidentConfig => {
  const tableName = "incidents";
  const queueUrl =
    process.env.SQS_QUEUE_URL ?? process.env.INCIDENTS_QUEUE_URL;

  if (!tableName) {
    throw new Error('Missing DYNAMODB_TABLE_NAME env var.');
  }

  if (!queueUrl) {
    throw new Error('Missing SQS_QUEUE_URL env var.');
  }

  return {
    tableName,
    queueUrl,
    aws: buildAwsConfig(),
  };
};

export const createDynamoClient = (config: AwsClientConfig) =>
  new DynamoDBClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
  });

export const createSqsClient = (config: AwsClientConfig) =>
  new SQSClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
  });

export const createLambdaClient = (config: AwsClientConfig) =>
  new LambdaClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
  });
