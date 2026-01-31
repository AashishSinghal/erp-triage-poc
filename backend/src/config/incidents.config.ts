import { AwsClientConfig, buildAwsConfig } from './aws.config';

export type IncidentConfig = {
  tableName: string;
  aws: AwsClientConfig;
  openAiApiKey: string;
  openAiModel: string;
};

export const getIncidentConfig = (): IncidentConfig => {
  const tableName =
    process.env.DYNAMODB_TABLE_NAME ?? process.env.INCIDENTS_TABLE_NAME;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  if (!tableName) {
    throw new Error('Missing DYNAMODB_TABLE_NAME env var.');
  }

  if (!openAiApiKey) {
    throw new Error('Missing OPENAI_API_KEY env var.');
  }

  return {
    tableName,
    aws: buildAwsConfig(),
    openAiApiKey,
    openAiModel,
  };
};
