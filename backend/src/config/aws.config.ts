import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const DEFAULT_REGION = 'us-east-1';

export type AwsClientConfig = {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
};

const toBool = (value?: string) => value?.toLowerCase() === 'true';

export const buildAwsConfig = (): AwsClientConfig => {
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

export const createDynamoClient = (config: AwsClientConfig) =>
  new DynamoDBClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
  });
