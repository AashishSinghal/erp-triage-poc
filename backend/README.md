# Backend (NestJS)

ERP Triage backend service built with NestJS + Fastify.

## What’s used and why

- **NestJS**: structured, testable backend with DI and clear module boundaries.
- **Fastify adapter**: faster HTTP server and lower overhead.
- **AWS SDK v3 (DynamoDB)**: direct, low-level access with DocumentClient for JSON.
- **OpenAI SDK**: synchronous enrichment (summary/suggestion/category/severity).
- **class-validator / class-transformer**: DTO validation at the API boundary.
- **ConsoleLogger (JSON)**: structured logs for production and CloudWatch.

## Local Run

1) Install dependencies

```bash
npm install
```

2) Create `.env`

```bash
cp .env.example .env
```

Required vars:

```
AWS_LOCALSTACK=true
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=incidents
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

3) Start server

```bash
npm run start:dev
```

API runs on `http://localhost:3000`

## API Endpoints

- `GET /health`
- `GET /incidents`
- `POST /incidents`
- `GET /incidents/:id`
- `PATCH /incidents/:id`
- `DELETE /incidents/:id`

## LocalStack setup (DynamoDB)

```bash
docker compose -f docker-compose.localstack.yml up -d
bash scripts/localstack-init.sh
```

## Production Run (EC2 + PM2)

PM2 config: `backend/ecosystem.config.cjs`

Deploy workflow: `.github/workflows/deploy-backend-ssh.yml`

## Notes

- Health check uses `DescribeTable` for DynamoDB (IAM-safe).
- Incident enrichment happens synchronously at create time.
