# ERP Triage Infrastructure (CDK)

This CDK app provisions the DynamoDB table used by the backend.

## Prerequisites
- Node.js 18+
- AWS credentials configured (IAM user or role)

## Install

```bash
cd infra
npm install
```

## Deploy

```bash
cd infra
npx cdk bootstrap
npx cdk deploy
```

## Customize table name

```bash
cd infra
npx cdk deploy -c tableName=incidents
```

## Attach policy to existing IAM role (optional)

If you already have an EC2 role and want CDK to add the DynamoDB
`DescribeTable` permission, pass the role name:

```bash
cd infra
npx cdk deploy -c tableName=incidents -c iamRoleName=erp-triage-dynamodb-iam
```

## GitHub Actions (optional)

If you enable the `Deploy Infra (CDK)` workflow, set these repo secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (optional, defaults to `us-east-1`)
- `DYNAMODB_TABLE_NAME` (optional, defaults to `incidents`)
- `IAM_ROLE_NAME` (optional, for attaching `DescribeTable` policy)

The workflow deploys only when `infra/**` changes.

## Notes
- The table uses partition key `PK` and sort key `SK`.
- Removal policy is `RETAIN` to protect data on stack deletion.
- Point-in-time recovery is enabled.
